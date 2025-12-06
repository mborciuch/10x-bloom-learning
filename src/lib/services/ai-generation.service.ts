// src/lib/services/ai-generation.service.ts

import type { SupabaseClient } from "@/db/supabase.client";
import type { InitiateAiGenerationCommand, AiGeneratedSessionsSchema, TaxonomyLevel, ReviewSessionDto } from "@/types";
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
   * Synchroniczne generowanie sesji AI dla danego planu nauki.
   * Zwraca listę świeżo utworzonych sesji jako ReviewSessionDto[].
   */
  async generateReviewSessions(
    userId: string,
    studyPlanId: string,
    command: InitiateAiGenerationCommand
  ): Promise<ReviewSessionDto[]> {
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

    // 2. Waliduj templates jeśli podane
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

    // 3. Zbuduj prompty
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(
      studyPlan.source_material,
      command.requestedCount,
      command.taxonomyLevels as TaxonomyLevel[]
    );

    // 4. Zdefiniuj schemat JSON dla odpowiedzi
    const responseSchema = this.buildResponseSchema();

    try {
      // 5. Wywołaj OpenRouter
      const result = await this.openRouterService.generateCompletion<AiGeneratedSessionsSchema>({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        modelName: command.modelName,
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

      // 6. Zapisz sesje do review_sessions
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const sessionsToInsert = result.content.sessions.map((session) => ({
        study_plan_id: studyPlanId,
        user_id: userId,
        exercise_label: session.exerciseLabel,
        review_date: today,
        taxonomy_level: session.taxonomyLevel,
        status: "proposed" as const,
        is_ai_generated: true,
        is_completed: false,
        content: {
          questions: session.questions,
          answers: session.answers,
          hints: session.hints,
        } as never,
        notes: null,
      }));

      const { data: inserted, error: insertError } = await this.supabase
        .from("review_sessions")
        .insert(sessionsToInsert)
        .select("*");

      if (insertError) {
        throw insertError;
      }

      const rows = inserted ?? [];

      // 7. Zmapuj do ReviewSessionDto (lekki mapping bez dodatkowego serwisu)
      return rows.map((row) => ({
        id: row.id,
        studyPlanId: row.study_plan_id,
        exerciseTemplateId: row.exercise_template_id,
        exerciseLabel: row.exercise_label,
        reviewDate: row.review_date,
        taxonomyLevel: row.taxonomy_level,
        status: row.status,
        isAiGenerated: row.is_ai_generated,
        isCompleted: row.is_completed,
        content: {
          questions: (row.content as { questions?: unknown[] }).questions ?? [],
          answers: (row.content as { answers?: unknown[] }).answers ?? [],
          hints: (row.content as { hints?: unknown[] }).hints ?? [],
        },
        notes: row.notes,
        statusChangedAt: row.status_changed_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw this.mapOpenRouterError(error);
      }
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
