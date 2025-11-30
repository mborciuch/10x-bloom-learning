// src/lib/types/openrouter.types.ts

/**
 * Konfiguracja dla OpenRouterService
 */
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Wiadomość w konwersacji
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Parametry modelu LLM
 */
export interface ModelParams {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

/**
 * JSON Schema dla odpowiedzi
 */
export interface JsonSchema {
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
  enum?: unknown[];
  [key: string]: unknown;
}

/**
 * Format odpowiedzi ze schematem JSON
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
}

/**
 * Parametry dla generateCompletion
 */
export interface CompletionParams<TResponse = unknown> {
  messages: Message[];
  modelName?: string;
  modelParams?: ModelParams;
  responseFormat?: ResponseFormat;
}

/**
 * Wynik generacji completion
 */
export interface CompletionResult<TResponse = unknown> {
  content: TResponse;
  rawResponse: string;
  modelUsed: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "tool_calls";
  metadata: {
    requestId: string;
    modelProvider: string;
    processingTimeMs: number;
  };
}

/**
 * Informacje o modelu
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

/**
 * Request do OpenRouter API (wewnętrzny)
 */
export interface OpenRouterRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: JsonSchema;
    };
  };
}

/**
 * Odpowiedź z OpenRouter API (wewnętrzna)
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}
