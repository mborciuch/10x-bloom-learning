// src/lib/utils/openrouter-errors.ts

export type OpenRouterErrorCode =
  | "INVALID_API_KEY"
  | "RATE_LIMIT_EXCEEDED"
  | "INSUFFICIENT_CREDITS"
  | "MODEL_NOT_AVAILABLE"
  | "INVALID_REQUEST"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "RESPONSE_PARSE_ERROR"
  | "SCHEMA_VALIDATION_ERROR"
  | "UNKNOWN_ERROR";

export class OpenRouterError extends Error {
  public readonly name = "OpenRouterError";

  constructor(
    public readonly code: OpenRouterErrorCode,
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    // Zachowaj prawidłowy stack trace
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }

  static fromHttpError(statusCode: number, responseBody: unknown): OpenRouterError {
    const message = getErrorMessage(responseBody);

    switch (statusCode) {
      case 401:
        return new OpenRouterError("INVALID_API_KEY", message || "Invalid API key", statusCode);
      case 402:
        return new OpenRouterError("INSUFFICIENT_CREDITS", message || "Insufficient credits", statusCode);
      case 429:
        return new OpenRouterError("RATE_LIMIT_EXCEEDED", message || "Rate limit exceeded", statusCode, {
          retryAfter: getRetryAfter(responseBody),
        });
      case 400:
        // Sprawdź czy to błąd modelu czy inny błąd walidacji
        if (isModelNotAvailableError(responseBody)) {
          return new OpenRouterError("MODEL_NOT_AVAILABLE", message || "Model not available", statusCode);
        }
        return new OpenRouterError("INVALID_REQUEST", message || "Invalid request", statusCode);
      case 408:
      case 504:
        return new OpenRouterError("TIMEOUT", message || "Request timeout", statusCode);
      default:
        return new OpenRouterError("UNKNOWN_ERROR", message || "Unknown error occurred", statusCode);
    }
  }

  static networkError(originalError: unknown): OpenRouterError {
    const message = originalError instanceof Error ? originalError.message : "Network error";
    return new OpenRouterError("NETWORK_ERROR", message);
  }

  static parseError(originalError: unknown, rawResponse?: string): OpenRouterError {
    const message = originalError instanceof Error ? originalError.message : "Failed to parse response";
    return new OpenRouterError("RESPONSE_PARSE_ERROR", message, 500, { rawResponse });
  }

  static schemaValidationError(errors: unknown): OpenRouterError {
    return new OpenRouterError("SCHEMA_VALIDATION_ERROR", "Response does not match expected schema", 500, {
      schemaErrors: errors,
    });
  }

  isRetryable(): boolean {
    return ["RATE_LIMIT_EXCEEDED", "TIMEOUT", "NETWORK_ERROR"].includes(this.code);
  }
}

function getErrorMessage(responseBody: unknown): string | undefined {
  if (!responseBody || typeof responseBody !== "object") {
    return undefined;
  }

  const body = responseBody as Record<string, unknown>;

  if (typeof body.error === "string") {
    return body.error;
  }

  if (body.error && typeof body.error === "object") {
    const error = body.error as Record<string, unknown>;
    if (typeof error.message === "string") {
      return error.message;
    }
  }

  if (typeof body.message === "string") {
    return body.message;
  }

  return undefined;
}

function getRetryAfter(responseBody: unknown): number | undefined {
  if (!responseBody || typeof responseBody !== "object") {
    return undefined;
  }

  const body = responseBody as Record<string, unknown>;
  if (typeof body.retryAfter === "number") {
    return body.retryAfter;
  }

  return undefined;
}

function isModelNotAvailableError(responseBody: unknown): boolean {
  const message = getErrorMessage(responseBody);
  return (message?.toLowerCase().includes("model") && message?.toLowerCase().includes("not available")) || false;
}
