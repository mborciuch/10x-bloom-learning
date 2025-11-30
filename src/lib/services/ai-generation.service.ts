// src/lib/services/ai-generation.service.ts

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  InitiateAiGenerationCommand,
  AiGeneratedSessionsSchema,
  TaxonomyLevel,
  AiGenerationDto,
  AiGenerationParametersDto,
} from "@/types";
import { OpenRouterService } from "./openrouter.service";
import { ApiError } from "@/lib/utils/error-handler";
import { OpenRouterError } from "@/lib/utils/openrouter-errors";

export class AiGenerationService {
  private readonly openRouterService: OpenRouterService;

  constructor(
    private readonly supabase: SupabaseClient,
    openRouterApiKey: string
  ) {
    this.openRouterService = new OpenRouterService({
      apiKey: openRouterApiKey,
      defaultModel: "anthropic/claude-3.5-sonnet",
      timeout: 90000, // 90 sekund dla dłuższych generacji
      maxRetries: 2,
    });
  }

  /**
   * Inicjuje asynchroniczne generowanie sesji AI
   * Tworzy wpis w ai_generation_log i zwraca ID do trackingu
   */
  async initiate(userId: string, studyPlanId: string, command: InitiateAiGenerationCommand): Promise<AiGenerationDto> {
    // 1. Sprawdź ownership planu
    const { data: studyPlan, error: planError } = await this.supabase
      .from("study_plans")
      .select("id, title, source_material, user_id")
      .eq("id", studyPlanId)
      .eq("user_id", userId)
      .single();

    if (planError || !studyPlan) {
      throw new ApiError("NOT_FOUND", "Study plan not found", 404);
    }

    // 2. Sprawdź czy nie istnieje pending generation
    const { data: pendingGeneration } = await this.supabase
      .from("ai_generation_log")
      .select("id")
      .eq("study_plan_id", studyPlanId)
      .eq("state", "pending")
      .maybeSingle();

    if (pendingGeneration) {
      throw new ApiError("CONFLICT", "A pending AI generation already exists for this study plan", 409);
    }

    // 3. Waliduj templates jeśli podane
    if (command.includePredefinedTemplateIds && command.includePredefinedTemplateIds.length > 0) {
      const { data: templates, error: templatesError } = await this.supabase
        .from("exercise_templates")
        .select("id")
        .in("id", command.includePredefinedTemplateIds)
        .eq("is_active", true);

      if (templatesError) {
        throw templatesError;
      }

      if (!templates || templates.length !== command.includePredefinedTemplateIds.length) {
        throw new ApiError("VALIDATION_ERROR", "One or more template IDs are invalid or inactive", 400);
      }
    }

    // 4. Przygotuj parameters dla log
    const parameters: AiGenerationParametersDto = {
      requestedCount: command.requestedCount,
      taxonomyLevels: command.taxonomyLevels,
      templateIds: command.includePredefinedTemplateIds,
    };

    // 5. Utwórz wpis w ai_generation_log
    const { data: logEntry, error: logError } = await this.supabase
      .from("ai_generation_log")
      .insert({
        study_plan_id: studyPlanId,
        user_id: userId,
        state: "pending",
        model_name: command.modelName || "anthropic/claude-3.5-sonnet",
        parameters: parameters as never,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      throw logError;
    }

    // 6. Zwróć DTO dla 202 response
    return {
      id: logEntry.id,
      studyPlanId: logEntry.study_plan_id,
      state: logEntry.state,
      requestedAt: logEntry.requested_at,
      modelName: logEntry.model_name,
      parameters: parameters,
      response: logEntry.response,
      errorMessage: logEntry.error_message,
    };
  }

  /**
   * Background worker: Wykonuje faktyczne generowanie przez OpenRouter
   * Wywołanie asynchroniczne - nie blokuje API endpoint
   */
  async processGeneration(generationId: string): Promise<void> {
    try {
      // 1. Pobierz generation log
      const { data: generation, error: genError } = await this.supabase
        .from("ai_generation_log")
        .select("*, study_plans(source_material, title)")
        .eq("id", generationId)
        .single();

      if (genError || !generation) {
        throw new Error("Generation log not found");
      }

      // 2. Pobierz study plan
      const studyPlan = Array.isArray(generation.study_plans) ? generation.study_plans[0] : generation.study_plans;

      if (!studyPlan || !studyPlan.source_material) {
        throw new Error("Study plan source material not found");
      }

      // 3. Parsuj parameters
      const parameters = generation.parameters as unknown as AiGenerationParametersDto;

      // 4. Zbuduj prompty
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(
        studyPlan.source_material,
        parameters.requestedCount,
        parameters.taxonomyLevels
      );

      // 5. Zdefiniuj schemat JSON dla odpowiedzi
      const responseSchema = this.buildResponseSchema();

      // 6. Wywołaj OpenRouter
      const result = await this.openRouterService.generateCompletion<AiGeneratedSessionsSchema>({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        modelName: generation.model_name || undefined,
        modelParams: {
          temperature: 0.7,
          maxTokens: 4000,
        },
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "ai_generated_sessions",
            strict: true,
            schema: responseSchema,
          },
        },
      });

      // 7. Zapisz sesje do review_sessions
      const sessionsToInsert = result.content.sessions.map((session) => ({
        study_plan_id: generation.study_plan_id,
        user_id: generation.user_id,
        exercise_label: session.exerciseLabel,
        review_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        taxonomy_level: session.taxonomyLevel,
        status: "proposed" as const,
        is_ai_generated: true,
        is_completed: false,
        content: {
          questions: session.questions,
          answers: session.answers,
          hints: session.hints,
        } as never,
        ai_generation_log_id: generationId,
      }));

      const { error: insertError } = await this.supabase.from("review_sessions").insert(sessionsToInsert);

      if (insertError) {
        throw insertError;
      }

      // 8. Aktualizuj ai_generation_log na succeeded
      const { error: updateError } = await this.supabase
        .from("ai_generation_log")
        .update({
          state: "succeeded",
          response: result.content as never,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      // Obsługa błędu - zapisz w ai_generation_log
      let errorMessage = "Unknown error occurred";

      if (error instanceof OpenRouterError) {
        errorMessage = `OpenRouter error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      await this.supabase
        .from("ai_generation_log")
        .update({
          state: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generationId);

      throw error;
    }
  }

  private buildSystemPrompt(): string {
    return `Jesteś ekspertem w tworzeniu materiałów edukacyjnych zgodnych z taksonomią Blooma.
    
Twoje zadanie to generowanie sesji przeglądowych dla studentów na podstawie materiału źródłowego.

Każda sesja przeglądowa powinna zawierać:
- Pytania dostosowane do konkretnego poziomu taksonomii Blooma
- Szczegółowe odpowiedzi na pytania
- Pomocne wskazówki, które pomogą studentowi w odpowiedzi

Poziomy taksonomii Blooma:
1. remember (Zapamiętywanie) - przypomnienie faktów i podstawowych koncepcji
2. understand (Rozumienie) - wyjaśnienie idei i koncepcji
3. apply (Zastosowanie) - użycie informacji w nowych sytuacjach
4. analyze (Analiza) - rozróżnienie między różnymi elementami
5. evaluate (Ewaluacja) - uzasadnienie decyzji lub wniosków
6. create (Tworzenie) - generowanie nowych idei lub produktów

Generuj pytania i odpowiedzi w języku polskim, dostosowane do poziomu studenta.`;
  }

  private buildUserPrompt(sourceMaterial: string, requestedCount: number, taxonomyLevels: TaxonomyLevel[]): string {
    const levelsDescription = taxonomyLevels.join(", ");

    return `Materiał źródłowy:
${sourceMaterial}

Wygeneruj ${requestedCount} sesji przeglądowych dla następujących poziomów taksonomii: ${levelsDescription}

Każda sesja powinna zawierać:
- 5 pytań odpowiednich dla danego poziomu
- 5 szczegółowych odpowiedzi
- 5 wskazówek pomocniczych
- Odpowiednią etykietę opisującą sesję

Upewnij się, że pytania są:
- Konkretne i związane z materiałem źródłowym
- Odpowiednie dla poziomu taksonomii
- Różnorodne i pokrywające różne aspekty materiału`;
  }

  private buildResponseSchema() {
    return {
      type: "object" as const,
      properties: {
        sessions: {
          type: "array" as const,
          items: {
            type: "object" as const,
            properties: {
              questions: {
                type: "array" as const,
                items: { type: "string" as const },
                description: "Lista 5 pytań egzaminacyjnych",
              },
              answers: {
                type: "array" as const,
                items: { type: "string" as const },
                description: "Lista 5 odpowiedzi na pytania",
              },
              hints: {
                type: "array" as const,
                items: { type: "string" as const },
                description: "Lista 5 wskazówek pomocniczych",
              },
              taxonomyLevel: {
                type: "string" as const,
                enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"],
                description: "Poziom taksonomii Blooma",
              },
              exerciseLabel: {
                type: "string" as const,
                description: "Krótka etykieta opisująca sesję",
              },
            },
            required: ["questions", "answers", "hints", "taxonomyLevel", "exerciseLabel"],
          },
        },
      },
      required: ["sessions"],
    };
  }

  private mapOpenRouterError(error: OpenRouterError): ApiError {
    switch (error.code) {
      case "INVALID_API_KEY":
        return new ApiError("CONFIGURATION_ERROR", "AI service is misconfigured. Please contact support.", 500);

      case "RATE_LIMIT_EXCEEDED":
        return new ApiError(
          "RATE_LIMIT",
          "AI generation service is temporarily busy. Please try again in a few minutes.",
          429
        );

      case "INSUFFICIENT_CREDITS":
        return new ApiError("SERVICE_UNAVAILABLE", "AI generation service is temporarily unavailable.", 503);

      case "TIMEOUT":
        return new ApiError("TIMEOUT", "AI generation took too long. Try requesting fewer sessions.", 408);

      case "SCHEMA_VALIDATION_ERROR":
      case "RESPONSE_PARSE_ERROR":
        return new ApiError("AI_GENERATION_ERROR", "Failed to generate valid content. Please try again.", 500);

      default:
        return new ApiError("AI_GENERATION_ERROR", "Failed to generate AI content. Please try again.", 500);
    }
  }
}
