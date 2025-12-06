// src/lib/services/openrouter.service.ts

import type {
  OpenRouterConfig,
  CompletionParams,
  CompletionResult,
  OpenRouterRequest,
  OpenRouterResponse,
  ModelInfo,
  ResponseFormat,
} from "@/lib/types/openrouter.types";
import { OpenRouterHttpClient } from "@/lib/clients/openrouter.client";
import { OpenRouterError } from "@/lib/utils/openrouter-errors";
import { logger } from "@/lib/utils/logger";

const DEFAULT_CONFIG: Partial<OpenRouterConfig> = {
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "anthropic/claude-3.5-sonnet",
  timeout: 60000, // 60 sekund
  maxRetries: 3,
};

export class OpenRouterService {
  private readonly config: Required<OpenRouterConfig>;
  private readonly httpClient: OpenRouterHttpClient;

  constructor(config: OpenRouterConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<OpenRouterConfig>;

    this.httpClient = new OpenRouterHttpClient({
      baseUrl: this.config.baseUrl,
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  /**
   * Generuje completion od modelu LLM
   */
  async generateCompletion<TResponse = unknown>(
    params: CompletionParams<TResponse>
  ): Promise<CompletionResult<TResponse>> {
    const startTime = Date.now();

    logger.info("OpenRouter API request initiated", {
      modelName: params.modelName || this.config.defaultModel,
      messageCount: params.messages.length,
      hasResponseFormat: !!params.responseFormat,
    });

    try {
      const request = this.buildRequest(params);
      const response = await this.executeWithRetry(() => this.httpClient.post("/chat/completions", request));
      const processingTimeMs = Date.now() - startTime;
      const result = this.parseResponse<TResponse>(response, params.responseFormat, processingTimeMs);

      logger.info("OpenRouter API request completed", {
        modelUsed: result.modelUsed,
        tokensUsed: result.usage.totalTokens,
        processingTimeMs: result.metadata.processingTimeMs,
      });

      return result;
    } catch (error) {
      logger.error("OpenRouter API request failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: error instanceof OpenRouterError ? error.code : undefined,
        processingTimeMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Waliduje klucz API
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.httpClient.post("/chat/completions", {
        model: this.config.defaultModel,
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      if (error instanceof OpenRouterError && error.code === "INVALID_API_KEY") {
        return false;
      }
      // Inne błędy też oznaczają problem z kluczem lub konfiguracją
      return false;
    }
  }

  /**
   * Pobiera listę dostępnych modeli (opcjonalne)
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    // To wymagałoby oddzielnego endpointu GET /api/v1/models
    // Implementacja zależna od dokumentacji OpenRouter
    throw new Error("Not implemented yet");
  }

  /**
   * Buduje request do OpenRouter API
   */
  private buildRequest<TResponse>(params: CompletionParams<TResponse>): OpenRouterRequest {
    const request: OpenRouterRequest = {
      model: params.modelName || this.config.defaultModel,
      messages: params.messages,
    };

    if (params.modelParams) {
      const mp = params.modelParams;
      if (mp.temperature !== undefined) request.temperature = mp.temperature;
      if (mp.topP !== undefined) request.top_p = mp.topP;
      if (mp.maxTokens !== undefined) request.max_tokens = mp.maxTokens;
      if (mp.frequencyPenalty !== undefined) request.frequency_penalty = mp.frequencyPenalty;
      if (mp.presencePenalty !== undefined) request.presence_penalty = mp.presencePenalty;
      if (mp.stop !== undefined) request.stop = mp.stop;
    }

    if (params.responseFormat) {
      request.response_format = {
        type: "json_schema",
        json_schema: {
          name: params.responseFormat.json_schema.name,
          strict: params.responseFormat.json_schema.strict,
          schema: params.responseFormat.json_schema.schema,
        },
      };
    }

    return request;
  }

  /**
   * Parsuje odpowiedź z OpenRouter API
   */
  private parseResponse<TResponse>(
    response: OpenRouterResponse,
    responseFormat: ResponseFormat | undefined,
    processingTimeMs: number
  ): CompletionResult<TResponse> {
    const choice = response.choices[0];
    if (!choice) {
      throw OpenRouterError.parseError(new Error("No choices in response"));
    }

    const rawContent = choice.message.content;
    let parsedContent: TResponse;

    if (responseFormat) {
      // Parsuj JSON zgodnie z schematem (z awaryjnym sanitizowaniem payloadu)
      parsedContent = this.parseJsonContent<TResponse>(rawContent);
    } else {
      // Zwróć surową treść jako content
      parsedContent = rawContent as TResponse;
    }

    return {
      content: parsedContent,
      rawResponse: rawContent,
      modelUsed: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      finishReason: this.mapFinishReason(choice.finish_reason),
      metadata: {
        requestId: response.id,
        modelProvider: this.extractProvider(response.model),
        processingTimeMs,
      },
    };
  }

  /**
   * Wykonuje operację z retry
   */
  private async executeWithRetry<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof OpenRouterError && error.isRetryable() && retryCount < this.config.maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await this.sleep(backoffMs);
        return this.executeWithRetry(operation, retryCount + 1);
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapFinishReason(reason: string): "stop" | "length" | "content_filter" | "tool_calls" {
    switch (reason) {
      case "stop":
        return "stop";
      case "length":
      case "max_tokens":
        return "length";
      case "content_filter":
        return "content_filter";
      case "tool_calls":
        return "tool_calls";
      default:
        return "stop";
    }
  }

  private extractProvider(modelName: string): string {
    // Zakładamy format "provider/model-name"
    const parts = modelName.split("/");
    return parts.length > 1 ? parts[0] : "unknown";
  }

  /**
   * Bezpiecznie parsuje JSON – jeśli model zwróci dodatkowy tekst (np. nagłówki Markdown),
   * próbujemy wyciągnąć blok JSON zanim rzucimy błąd.
   */
  private parseJsonContent<TResponse>(rawContent: string): TResponse {
    try {
      return JSON.parse(rawContent) as TResponse;
    } catch (error) {
      const sanitized = this.extractJsonPayload(rawContent);
      if (sanitized) {
        try {
          logger.warn("OpenRouter response contained non-JSON prefix, applied fallback sanitizer");
          return JSON.parse(sanitized) as TResponse;
        } catch (sanitizedError) {
          throw OpenRouterError.parseError(sanitizedError, rawContent);
        }
      }
      throw OpenRouterError.parseError(error, rawContent);
    }
  }

  private extractJsonPayload(rawContent: string): string | null {
    const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    const balanced = this.findBalancedJsonObject(rawContent);
    return balanced?.trim() ?? null;
  }

  /**
   * Przechodzi po całej odpowiedzi i próbuje znaleźć zbalansowany blok JSON,
   * ignorując klamry znajdujące się wewnątrz stringów lub w materiałach źródłowych.
   */
  private findBalancedJsonObject(rawContent: string): string | null {
    let depth = 0;
    let startIndex = -1;
    let inString = false;

    for (let i = 0; i < rawContent.length; i++) {
      const char = rawContent[i];
      const prev = rawContent[i - 1];

      if (char === '"' && prev !== "\\") {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === "{") {
        if (depth === 0) {
          startIndex = i;
        }
        depth++;
      } else if (char === "}") {
        if (depth > 0) {
          depth--;
          if (depth === 0 && startIndex !== -1) {
            const candidate = rawContent.slice(startIndex, i + 1);
            if (candidate.includes('"sessions"')) {
              return candidate;
            }
            startIndex = -1;
          }
        }
      }
    }

    return null;
  }
}
