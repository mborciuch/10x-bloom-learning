# OpenRouter Service - Przewodnik Implementacji

## 1. Opis Usługi

`OpenRouterService` jest serwisem odpowiedzialnym za komunikację z OpenRouter API w celu generowania treści przy użyciu różnych modeli LLM (Large Language Models). Usługa ta stanowi warstwę abstrakcji między aplikacją a OpenRouter API, zapewniając:

- **Typowanie TypeScript** - pełne wsparcie dla typów zapewniające bezpieczeństwo typów
- **Obsługę błędów** - kompleksowa obsługa błędów API i walidacji
- **Struktueryzowane odpowiedzi** - wsparcie dla JSON Schema w odpowiedziach modeli
- **Konfigurowalność** - elastyczne parametry modeli i prompt systemowy
- **Streaming** - opcjonalne wsparcie dla streamowania odpowiedzi (rozszerzenie przyszłościowe)

### Przypadki użycia w aplikacji:

1. Generowanie sesji przeglądowych AI na podstawie materiału źródłowego
2. Tworzenie pytań, odpowiedzi i wskazówek dla różnych poziomów taksonomii Blooma
3. Adaptacja treści do konkretnych szablonów ćwiczeń

## 2. Opis Konstruktora

### Sygnatura

```typescript
constructor(config: OpenRouterConfig)
```

### Parametr `OpenRouterConfig`

```typescript
interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}
```

| Pole           | Typ      | Wymagane | Domyślna wartość                 | Opis                                              |
| -------------- | -------- | -------- | -------------------------------- | ------------------------------------------------- |
| `apiKey`       | `string` | ✅       | -                                | Klucz API OpenRouter (ze zmiennej środowiskowej)  |
| `baseUrl`      | `string` | ❌       | `"https://openrouter.ai/api/v1"` | URL bazowy API OpenRouter                         |
| `defaultModel` | `string` | ❌       | `"anthropic/claude-3.5-sonnet"`  | Domyślny model używany w requestach               |
| `timeout`      | `number` | ❌       | `60000`                          | Timeout w milisekundach (60s)                     |
| `maxRetries`   | `number` | ❌       | `3`                              | Maksymalna liczba prób przy błędach przejściowych |

### Przykład użycia konstruktora

```typescript
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: "anthropic/claude-3.5-sonnet",
  timeout: 90000, // 90 sekund dla dłuższych generacji
  maxRetries: 2,
});
```

## 3. Publiczne Metody i Pola

### 3.1. Metoda `generateCompletion`

Główna metoda do generowania odpowiedzi od modeli LLM.

#### Sygnatura

```typescript
async generateCompletion<TResponse = unknown>(
  params: CompletionParams<TResponse>
): Promise<CompletionResult<TResponse>>
```

#### Parametr `CompletionParams<TResponse>`

```typescript
interface CompletionParams<TResponse = unknown> {
  messages: Message[];
  modelName?: string;
  modelParams?: ModelParams;
  responseFormat?: ResponseFormat<TResponse>;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ModelParams {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

interface ResponseFormat<TResponse> {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema<TResponse>;
  };
}

type JsonSchema<T> = {
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JsonSchema<unknown>>;
  items?: JsonSchema<unknown>;
  required?: string[];
  description?: string;
  enum?: unknown[];
  [key: string]: unknown;
};
```

| Pole             | Typ                         | Wymagane | Opis                                         |
| ---------------- | --------------------------- | -------- | -------------------------------------------- |
| `messages`       | `Message[]`                 | ✅       | Tablica wiadomości (system, user, assistant) |
| `modelName`      | `string`                    | ❌       | Nazwa modelu (nadpisuje domyślny)            |
| `modelParams`    | `ModelParams`               | ❌       | Parametry modelu (temperatura, tokens, etc.) |
| `responseFormat` | `ResponseFormat<TResponse>` | ❌       | Format strukturyzowanej odpowiedzi JSON      |

#### Zwracany typ `CompletionResult<TResponse>`

```typescript
interface CompletionResult<TResponse = unknown> {
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
```

#### Przykład użycia 1: Proste zapytanie z systemowym promptem

```typescript
const result = await openRouterService.generateCompletion({
  messages: [
    {
      role: "system",
      content: "Jesteś ekspertem od tworzenia pytań edukacyjnych zgodnych z taksonomią Blooma.",
    },
    {
      role: "user",
      content: "Utwórz 3 pytania na poziomie analizy o fotosyntezę.",
    },
  ],
  modelParams: {
    temperature: 0.7,
    maxTokens: 2000,
  },
});

console.log(result.content); // string z odpowiedzią modelu
```

#### Przykład użycia 2: Strukturyzowana odpowiedź z JSON Schema

```typescript
// Definiujemy typ TypeScript dla odpowiedzi
interface ReviewSessionSchema {
  questions: string[];
  answers: string[];
  hints: string[];
  taxonomyLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
}

// Definiujemy JSON Schema
const reviewSessionJsonSchema = {
  type: "object" as const,
  properties: {
    questions: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Lista pytań egzaminacyjnych",
    },
    answers: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Lista odpowiedzi na pytania",
    },
    hints: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Lista wskazówek pomocniczych",
    },
    taxonomyLevel: {
      type: "string" as const,
      enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"],
      description: "Poziom taksonomii Blooma",
    },
  },
  required: ["questions", "answers", "hints", "taxonomyLevel"],
};

const result = await openRouterService.generateCompletion<ReviewSessionSchema>({
  messages: [
    {
      role: "system",
      content:
        "Jesteś ekspertem w tworzeniu materiałów edukacyjnych. Generujesz sesje przeglądowe na podstawie materiału źródłowego.",
    },
    {
      role: "user",
      content: `Utwórz sesję przeglądową na poziomie "analyze" dla materiału:
      
      ${sourceMaterial}
      
      Wygeneruj 5 pytań, odpowiedzi i wskazówki.`,
    },
  ],
  modelName: "anthropic/claude-3.5-sonnet",
  modelParams: {
    temperature: 0.8,
    maxTokens: 4000,
  },
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "review_session_schema",
      strict: true,
      schema: reviewSessionJsonSchema,
    },
  },
});

// Odpowiedź jest typowana jako ReviewSessionSchema
const { questions, answers, hints, taxonomyLevel } = result.content;
```

#### Przykład użycia 3: Generowanie wielu sesji z różnymi parametrami

```typescript
interface BulkGenerationRequest {
  sourceMaterial: string;
  requestedCount: number;
  taxonomyLevels: TaxonomyLevel[];
  templateIds: string[];
}

async function generateBulkReviewSessions(
  request: BulkGenerationRequest,
  openRouterService: OpenRouterService
): Promise<ReviewSessionSchema[]> {
  const sessions: ReviewSessionSchema[] = [];

  for (const taxonomyLevel of request.taxonomyLevels) {
    const result = await openRouterService.generateCompletion<ReviewSessionSchema>({
      messages: [
        {
          role: "system",
          content: `Jesteś ekspertem w tworzeniu materiałów edukacyjnych zgodnych z taksonomią Blooma. 
          Tworzysz pytania na poziomie: ${taxonomyLevel}.`,
        },
        {
          role: "user",
          content: `Materiał źródłowy: ${request.sourceMaterial}
          
          Utwórz sesję przeglądową zawierającą 5 pytań, odpowiedzi i wskazówki.`,
        },
      ],
      modelParams: {
        temperature: 0.7,
        maxTokens: 3000,
      },
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "review_session_schema",
          strict: true,
          schema: reviewSessionJsonSchema,
        },
      },
    });

    sessions.push(result.content);
  }

  return sessions;
}
```

### 3.2. Metoda `validateApiKey`

Waliduje czy klucz API jest poprawny i aktywny.

#### Sygnatura

```typescript
async validateApiKey(): Promise<boolean>
```

#### Przykład użycia

```typescript
const isValid = await openRouterService.validateApiKey();
if (!isValid) {
  throw new Error("Invalid OpenRouter API key");
}
```

### 3.3. Metoda `getAvailableModels`

Pobiera listę dostępnych modeli z OpenRouter API (opcjonalne, dla rozszerzeń).

#### Sygnatura

```typescript
async getAvailableModels(): Promise<ModelInfo[]>

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}
```

#### Przykład użycia

```typescript
const models = await openRouterService.getAvailableModels();
const anthropicModels = models.filter((m) => m.provider === "anthropic");
```

## 4. Prywatne Metody i Pola

### 4.1. Prywatne pola

```typescript
private readonly config: OpenRouterConfig;
private readonly httpClient: HttpClient;
```

### 4.2. Metoda `buildRequest`

Buduje request HTTP do OpenRouter API.

```typescript
private buildRequest<TResponse>(
  params: CompletionParams<TResponse>
): OpenRouterRequest
```

### 4.3. Metoda `executeRequest`

Wykonuje request HTTP z obsługą retry i timeout.

```typescript
private async executeRequest<TResponse>(
  request: OpenRouterRequest,
  retryCount: number = 0
): Promise<OpenRouterResponse>
```

### 4.4. Metoda `parseResponse`

Parsuje odpowiedź z OpenRouter API.

```typescript
private parseResponse<TResponse>(
  response: OpenRouterResponse,
  responseFormat?: ResponseFormat<TResponse>
): CompletionResult<TResponse>
```

### 4.5. Metoda `handleApiError`

Obsługuje błędy API i mapuje je na wewnętrzne typy błędów.

```typescript
private handleApiError(error: unknown): never
```

### 4.6. Metoda `shouldRetry`

Określa czy request powinien być ponowiony.

```typescript
private shouldRetry(error: OpenRouterError, retryCount: number): boolean
```

## 5. Obsługa Błędów

### 5.1. Typy błędów

```typescript
class OpenRouterError extends Error {
  constructor(
    public code: OpenRouterErrorCode,
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

type OpenRouterErrorCode =
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
```

### 5.2. Scenariusze błędów

#### 1. Nieprawidłowy klucz API

```typescript
// Kod błędu: 401
// OpenRouterErrorCode: "INVALID_API_KEY"
// Retry: NIE
throw new OpenRouterError("INVALID_API_KEY", "The provided API key is invalid or expired", 401);
```

#### 2. Przekroczenie limitu requestów

```typescript
// Kod błędu: 429
// OpenRouterErrorCode: "RATE_LIMIT_EXCEEDED"
// Retry: TAK (z exponential backoff)
throw new OpenRouterError("RATE_LIMIT_EXCEEDED", "Rate limit exceeded. Please try again later.", 429, {
  retryAfter: 60,
});
```

#### 3. Niewystarczające kredyty

```typescript
// Kod błędu: 402
// OpenRouterErrorCode: "INSUFFICIENT_CREDITS"
// Retry: NIE
throw new OpenRouterError("INSUFFICIENT_CREDITS", "Insufficient credits to complete the request", 402);
```

#### 4. Model niedostępny

```typescript
// Kod błędu: 400
// OpenRouterErrorCode: "MODEL_NOT_AVAILABLE"
// Retry: NIE
throw new OpenRouterError("MODEL_NOT_AVAILABLE", "The requested model is not available", 400, {
  modelName: "anthropic/claude-3.5-sonnet",
});
```

#### 5. Nieprawidłowy request

```typescript
// Kod błędu: 400
// OpenRouterErrorCode: "INVALID_REQUEST"
// Retry: NIE
throw new OpenRouterError(
  "INVALID_REQUEST",
  "Invalid request parameters",
  400,
  { validationErrors: [...] }
);
```

#### 6. Timeout

```typescript
// Kod błędu: 408
// OpenRouterErrorCode: "TIMEOUT"
// Retry: TAK
throw new OpenRouterError("TIMEOUT", "Request timed out after 60000ms", 408);
```

#### 7. Błąd sieci

```typescript
// OpenRouterErrorCode: "NETWORK_ERROR"
// Retry: TAK
throw new OpenRouterError("NETWORK_ERROR", "Network error occurred while connecting to OpenRouter API");
```

#### 8. Błąd parsowania odpowiedzi

```typescript
// OpenRouterErrorCode: "RESPONSE_PARSE_ERROR"
// Retry: NIE
throw new OpenRouterError("RESPONSE_PARSE_ERROR", "Failed to parse response from OpenRouter API", 500, {
  rawResponse: "...",
});
```

#### 9. Błąd walidacji schematu

```typescript
// OpenRouterErrorCode: "SCHEMA_VALIDATION_ERROR"
// Retry: NIE
throw new OpenRouterError(
  "SCHEMA_VALIDATION_ERROR",
  "Response does not match the expected JSON schema",
  500,
  { schemaErrors: [...] }
);
```

### 5.3. Strategia retry

```typescript
private async executeWithRetry<T>(
  operation: () => Promise<T>,
  retryCount: number = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (this.shouldRetry(error, retryCount)) {
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await this.sleep(backoffMs);
      return this.executeWithRetry(operation, retryCount + 1);
    }
    throw error;
  }
}

private shouldRetry(error: unknown, retryCount: number): boolean {
  if (retryCount >= this.config.maxRetries) {
    return false;
  }

  if (error instanceof OpenRouterError) {
    const retryableCodes: OpenRouterErrorCode[] = [
      "RATE_LIMIT_EXCEEDED",
      "TIMEOUT",
      "NETWORK_ERROR"
    ];
    return retryableCodes.includes(error.code);
  }

  return false;
}
```

### 5.4. Przykład obsługi błędów w aplikacji

```typescript
try {
  const result = await openRouterService.generateCompletion({
    messages: [...],
    responseFormat: {...}
  });

  // Sukces - przetwarzaj wynik
  await saveGeneratedSessions(result.content);

} catch (error) {
  if (error instanceof OpenRouterError) {
    switch (error.code) {
      case "INVALID_API_KEY":
        // Loguj krytyczny błąd - wymaga interwencji admina
        logger.error("Invalid OpenRouter API key", { error });
        throw new ApiError(
          "CONFIGURATION_ERROR",
          "AI service is misconfigured. Please contact support.",
          500
        );

      case "RATE_LIMIT_EXCEEDED":
        // Informuj użytkownika o opóźnieniu
        throw new ApiError(
          "RATE_LIMIT",
          "AI generation service is temporarily busy. Please try again in a few minutes.",
          429
        );

      case "INSUFFICIENT_CREDITS":
        // Informuj użytkownika o problemie z kredytami
        throw new ApiError(
          "SERVICE_UNAVAILABLE",
          "AI generation service is temporarily unavailable.",
          503
        );

      case "TIMEOUT":
        // Sugeruj użytkownikowi zmniejszenie zakresu generacji
        throw new ApiError(
          "TIMEOUT",
          "AI generation took too long. Try requesting fewer sessions.",
          408
        );

      case "SCHEMA_VALIDATION_ERROR":
        // Loguj szczegóły błędu walidacji
        logger.error("Schema validation failed", {
          error,
          details: error.details
        });
        throw new ApiError(
          "AI_GENERATION_ERROR",
          "Failed to generate valid content. Please try again.",
          500
        );

      default:
        // Ogólny błąd AI
        logger.error("OpenRouter API error", { error });
        throw new ApiError(
          "AI_GENERATION_ERROR",
          "Failed to generate AI content. Please try again.",
          500
        );
    }
  }

  // Nieoczekiwany błąd
  logger.error("Unexpected error in AI generation", { error });
  throw new ApiError(
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred",
    500
  );
}
```

## 6. Kwestie Bezpieczeństwa

### 6.1. Zarządzanie kluczem API

```typescript
// ❌ ZŁE - hardcoded klucz
const service = new OpenRouterService({
  apiKey: "sk-or-v1-abc123...",
});

// ✅ DOBRE - ze zmiennej środowiskowej
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});
```

#### Konfiguracja zmiennych środowiskowych

```bash
# .env (nigdy nie commituj do repozytorium!)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

```typescript
// env.d.ts - deklaracja typów
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 6.2. Walidacja inputu użytkownika

```typescript
// Zawsze waliduj dane wejściowe przed przekazaniem do OpenRouter
import { z } from "zod";

const AiGenerationRequestSchema = z.object({
  sourceMaterial: z
    .string()
    .min(MIN_WORD_COUNT * 4) // ~4 znaki na słowo
    .max(MAX_WORD_COUNT * 10),
  requestedCount: z.number().int().min(1).max(20),
  taxonomyLevels: z
    .array(z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]))
    .min(1)
    .max(6),
});

// W API endpoint
const validationResult = AiGenerationRequestSchema.safeParse(body);
if (!validationResult.success) {
  throw new ApiError("VALIDATION_ERROR", "Invalid request", 400, {
    errors: validationResult.error.issues,
  });
}
```

### 6.3. Rate limiting po stronie aplikacji

```typescript
// Implementacja prostego rate limitera per użytkownik
class RateLimiter {
  private requests = new Map<string, number[]>();

  canMakeRequest(userId: string, maxRequestsPerHour: number = 10): boolean {
    const now = Date.now();
    const hourAgo = now - 3600000;

    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter((time) => time > hourAgo);

    if (recentRequests.length >= maxRequestsPerHour) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// W API endpoint
if (!rateLimiter.canMakeRequest(userId, 10)) {
  throw new ApiError("RATE_LIMIT", "You have exceeded the maximum number of AI generations per hour", 429);
}
```

### 6.4. Sanityzacja materiału źródłowego

```typescript
function sanitizeSourceMaterial(material: string): string {
  // Usuń nadmiar whitespace
  let sanitized = material.trim().replace(/\s+/g, " ");

  // Ogranicz długość
  const maxChars = MAX_WORD_COUNT * 10;
  if (sanitized.length > maxChars) {
    sanitized = sanitized.slice(0, maxChars);
  }

  // Usuń potencjalnie niebezpieczne znaki
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  return sanitized;
}
```

### 6.5. Logowanie i monitoring

```typescript
// Logger service
class Logger {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  error(message: string, meta?: Record<string, unknown>) {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }
}

const logger = new Logger();

// Loguj wszystkie requesty do OpenRouter
logger.info("OpenRouter API request", {
  userId,
  modelName,
  messageCount: messages.length,
  hasResponseFormat: !!responseFormat,
});

// Loguj wszystkie odpowiedzi
logger.info("OpenRouter API response", {
  userId,
  modelUsed: result.modelUsed,
  tokensUsed: result.usage.totalTokens,
  processingTimeMs: result.metadata.processingTimeMs,
});

// Loguj wszystkie błędy ze szczegółami (bez wrażliwych danych)
logger.error("OpenRouter API error", {
  userId,
  errorCode: error.code,
  errorMessage: error.message,
  statusCode: error.statusCode,
  // NIE loguj: apiKey, pełnych treści odpowiedzi
});
```

## 7. Plan Wdrożenia Krok Po Kroku

### Krok 1: Przygotowanie środowiska

#### 1.1. Dodaj zmienną środowiskową

```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

#### 1.2. Zaktualizuj `env.d.ts`

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### 1.3. Sprawdź czy zmienna jest dostępna

```typescript
// Test w konsoli dev
console.log("OpenRouter API Key set:", !!import.meta.env.OPENROUTER_API_KEY);
```

### Krok 2: Struktura katalogów

Utwórz następującą strukturę w `src/lib/`:

```
src/lib/
├── clients/
│   └── openrouter.client.ts       # Implementacja HTTP client dla OpenRouter
├── services/
│   ├── study-plan.service.ts      # Istniejący
│   └── openrouter.service.ts      # NOWY - główna usługa OpenRouter
├── types/
│   └── openrouter.types.ts        # NOWY - typy dla OpenRouter
└── utils/
    ├── error-handler.ts           # Istniejący
    └── openrouter-errors.ts       # NOWY - definicje błędów OpenRouter
```

### Krok 3: Implementacja typów

#### 3.1. Utwórz `src/lib/types/openrouter.types.ts`

```typescript
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
export type JsonSchema<T = unknown> = {
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
  enum?: unknown[];
  [key: string]: unknown;
};

/**
 * Format odpowiedzi ze schematem JSON
 */
export interface ResponseFormat<TResponse = unknown> {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema<TResponse>;
  };
}

/**
 * Parametry dla generateCompletion
 */
export interface CompletionParams<TResponse = unknown> {
  messages: Message[];
  modelName?: string;
  modelParams?: ModelParams;
  responseFormat?: ResponseFormat<TResponse>;
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
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created: number;
}
```

### Krok 4: Implementacja obsługi błędów

#### 4.1. Utwórz `src/lib/utils/openrouter-errors.ts`

```typescript
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
```

### Krok 5: Implementacja HTTP Client

#### 5.1. Utwórz `src/lib/clients/openrouter.client.ts`

```typescript
// src/lib/clients/openrouter.client.ts

import type { OpenRouterRequest, OpenRouterResponse } from "@/lib/types/openrouter.types";
import { OpenRouterError } from "@/lib/utils/openrouter-errors";

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export class OpenRouterHttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  async post(endpoint: string, body: OpenRouterRequest): Promise<OpenRouterResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "HTTP-Referer": "https://10x-bloom-learning.app", // Zmień na swoją domenę
          "X-Title": "10x Bloom Learning", // Nazwa aplikacji
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await this.parseResponseBody(response);

      if (!response.ok) {
        throw OpenRouterError.fromHttpError(response.status, responseBody);
      }

      return responseBody as OpenRouterResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof OpenRouterError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("TIMEOUT", `Request timeout after ${this.config.timeout}ms`, 408);
      }

      throw OpenRouterError.networkError(error);
    }
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        return await response.json();
      } catch (error) {
        const text = await response.text();
        throw OpenRouterError.parseError(error, text);
      }
    }

    const text = await response.text();
    throw OpenRouterError.parseError(new Error("Expected JSON response"), text);
  }
}
```

### Krok 6: Implementacja głównej usługi OpenRouter

#### 6.1. Utwórz `src/lib/services/openrouter.service.ts`

```typescript
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
    const request = this.buildRequest(params);

    const response = await this.executeWithRetry(() => this.httpClient.post("/chat/completions", request));

    const processingTimeMs = Date.now() - startTime;
    return this.parseResponse(response, params.responseFormat, processingTimeMs);
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
    responseFormat: ResponseFormat<TResponse> | undefined,
    processingTimeMs: number
  ): CompletionResult<TResponse> {
    const choice = response.choices[0];
    if (!choice) {
      throw OpenRouterError.parseError(new Error("No choices in response"));
    }

    const rawContent = choice.message.content;
    let parsedContent: TResponse;

    if (responseFormat) {
      // Parsuj JSON zgodnie z schematem
      try {
        parsedContent = JSON.parse(rawContent) as TResponse;
        // Opcjonalnie: walidacja względem schematu
        // validateAgainstSchema(parsedContent, responseFormat.json_schema.schema);
      } catch (error) {
        throw OpenRouterError.parseError(error, rawContent);
      }
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
  private async executeWithRetry<T>(operation: () => Promise<T>, retryCount: number = 0): Promise<T> {
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
}
```

### Krok 7: Integracja z istniejącym kodem

#### 7.1. Zaktualizuj `src/types.ts` - dodaj schematy dla AI generacji

```typescript
// Na końcu pliku src/types.ts dodaj:

/**
 * Schema dla pojedynczej sesji przeglądowej generowanej przez AI
 */
export interface AiGeneratedReviewSessionSchema {
  questions: string[];
  answers: string[];
  hints: string[];
  taxonomyLevel: TaxonomyLevel;
  exerciseLabel: string;
}

/**
 * Schema dla pełnej odpowiedzi AI zawierającej wiele sesji
 */
export interface AiGeneratedSessionsSchema {
  sessions: AiGeneratedReviewSessionSchema[];
}
```

#### 7.2. Utwórz nowy serwis do generowania AI

Utwórz `src/lib/services/ai-generation.service.ts`:

```typescript
// src/lib/services/ai-generation.service.ts

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  InitiateAiGenerationCommand,
  AiGeneratedSessionsSchema,
  AiGeneratedReviewSessionSchema,
  TaxonomyLevel,
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

  async generateReviewSessions(
    studyPlanId: string,
    command: InitiateAiGenerationCommand
  ): Promise<AiGeneratedReviewSessionSchema[]> {
    // 1. Pobierz study plan z bazy
    const { data: studyPlan, error: fetchError } = await this.supabase
      .from("study_plans")
      .select("source_material, title")
      .eq("id", studyPlanId)
      .single();

    if (fetchError || !studyPlan) {
      throw new ApiError("NOT_FOUND", "Study plan not found", 404);
    }

    // 2. Zbuduj prompt systemowy
    const systemPrompt = this.buildSystemPrompt();

    // 3. Zbuduj prompt użytkownika
    const userPrompt = this.buildUserPrompt(studyPlan.source_material, command.requestedCount, command.taxonomyLevels);

    // 4. Zdefiniuj schemat JSON dla odpowiedzi
    const responseSchema = this.buildResponseSchema();

    // 5. Wywołaj OpenRouter
    try {
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

      return result.content.sessions;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        // Mapuj błędy OpenRouter na błędy API
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
```

### Krok 8: Utwórz endpoint API

Utwórz `src/pages/api/study-plans/[planId]/ai-generations/index.ts`:

```typescript
// src/pages/api/study-plans/[planId]/ai-generations/index.ts

export const prerender = false;

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { AiGenerationService } from "@/lib/services/ai-generation.service";
import { handleError } from "@/lib/utils/error-handler";
import { z } from "zod";

const InitiateAiGenerationSchema = z.object({
  requestedCount: z.number().int().min(1).max(20),
  taxonomyLevels: z
    .array(z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]))
    .min(1)
    .max(6),
  includePredefinedTemplateIds: z.array(z.string().uuid()).optional(),
  modelName: z.string().optional(),
});

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;
  const studyPlanId = context.params.planId;

  if (!studyPlanId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Study plan ID is required",
        },
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body",
        },
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const validationResult = InitiateAiGenerationSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: validationResult.error.issues,
        },
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const aiService = new AiGenerationService(supabase, apiKey);
    const sessions = await aiService.generateReviewSessions(studyPlanId, validationResult.data);

    // TODO: Zapisz sesje do bazy danych jako pending
    // TODO: Zwróć ID generacji, które może być użyte do śledzenia statusu

    return new Response(
      JSON.stringify({
        generationId: "temp-id", // TODO: zwróć prawdziwe ID
        sessionsGenerated: sessions.length,
        sessions,
      }),
      {
        status: 201,
        headers: JSON_HEADERS,
      }
    );
  } catch (error) {
    return handleError(error);
  }
};
```

### Krok 9: Testy i walidacja

#### 9.1. Test konfiguracji

```typescript
// test-openrouter-config.ts (plik pomocniczy, usuń po testach)

import { OpenRouterService } from "./src/lib/services/openrouter.service";

async function testConfig() {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  console.log("Testing API key validation...");
  const isValid = await service.validateApiKey();
  console.log("API key valid:", isValid);

  if (!isValid) {
    throw new Error("Invalid API key!");
  }
}

testConfig().catch(console.error);
```

#### 9.2. Test prostego completion

```typescript
// test-openrouter-completion.ts (plik pomocniczy, usuń po testach)

import { OpenRouterService } from "./src/lib/services/openrouter.service";

async function testCompletion() {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  console.log("Testing simple completion...");
  const result = await service.generateCompletion({
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Say hello in Polish" },
    ],
    modelParams: {
      temperature: 0.7,
      maxTokens: 100,
    },
  });

  console.log("Response:", result.content);
  console.log("Tokens used:", result.usage.totalTokens);
  console.log("Model:", result.modelUsed);
}

testCompletion().catch(console.error);
```

#### 9.3. Test strukturyzowanej odpowiedzi

```typescript
// test-openrouter-structured.ts (plik pomocniczy, usuń po testach)

import { OpenRouterService } from "./src/lib/services/openrouter.service";

interface TestSchema {
  name: string;
  age: number;
  hobbies: string[];
}

async function testStructuredResponse() {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  console.log("Testing structured response...");
  const result = await service.generateCompletion<TestSchema>({
    messages: [
      { role: "system", content: "You generate sample user profiles." },
      { role: "user", content: "Generate a sample user profile" },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "user_profile",
        strict: true,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
            hobbies: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["name", "age", "hobbies"],
        },
      },
    },
  });

  console.log("Structured response:", result.content);
  console.log("Type check - name:", typeof result.content.name);
  console.log("Type check - age:", typeof result.content.age);
  console.log("Type check - hobbies:", Array.isArray(result.content.hobbies));
}

testStructuredResponse().catch(console.error);
```

### Krok 10: Monitoring i logging

#### 10.1. Dodaj logger (opcjonalnie rozbudowany)

Utwórz `src/lib/utils/logger.ts`:

```typescript
// src/lib/utils/logger.ts

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

class Logger {
  log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    logFn(JSON.stringify(entry));
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log("error", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log("debug", message, meta);
  }
}

export const logger = new Logger();
```

#### 10.2. Użyj loggera w serwisach

```typescript
// W openrouter.service.ts dodaj logging:

import { logger } from "@/lib/utils/logger";

// W generateCompletion:
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
    const response = await this.executeWithRetry(() =>
      this.httpClient.post("/chat/completions", request)
    );
    const processingTimeMs = Date.now() - startTime;
    const result = this.parseResponse(response, params.responseFormat, processingTimeMs);

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
```

### Krok 11: Dokumentacja i czyszczenie

#### 11.1. Usuń pliki testowe

Po zakończeniu testów usuń wszystkie pomocnicze pliki testowe:

- `test-openrouter-config.ts`
- `test-openrouter-completion.ts`
- `test-openrouter-structured.ts`

#### 11.2. Zaktualizuj README projektu

Dodaj sekcję w `README.md` o konfiguracji OpenRouter:

````markdown
## Konfiguracja AI (OpenRouter)

Aplikacja wykorzystuje OpenRouter do generowania treści AI.

### Wymagane zmienne środowiskowe

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```
````

### Uzyskanie klucza API

1. Zarejestruj się na [OpenRouter.ai](https://openrouter.ai/)
2. Wygeneruj nowy klucz API
3. Dodaj klucz do pliku `.env`
4. Ustaw limity finansowe w panelu OpenRouter (zalecane)

### Domyślny model

Domyślnie używamy `anthropic/claude-3.5-sonnet`.
Można to zmienić przekazując `modelName` w requestach.

```

## 8. Podsumowanie

Ten przewodnik przedstawia kompleksową implementację usługi OpenRouter dla aplikacji 10x Bloom Learning. Implementacja została zaprojektowana z uwzględnieniem:

### ✅ Zrealizowane cele:

1. **Typowanie TypeScript** - pełne wsparcie dla typów w całej usłudze
2. **Obsługa błędów** - dedykowane klasy błędów z kodami i retry logic
3. **Strukturyzowane odpowiedzi** - wsparcie dla JSON Schema z pełnym typowaniem
4. **Bezpieczeństwo** - klucze API ze zmiennych środowiskowych, walidacja inputu
5. **Konfigurowalność** - elastyczne parametry modeli i konfigurator usługi
6. **Integracja z projektem** - zgodność z architekturą Astro + React + Supabase
7. **Monitoring** - logger dla śledzenia requestów i błędów
8. **Dokumentacja** - kompletny przewodnik z przykładami

### 📁 Struktura plików do utworzenia:

```

src/
├── lib/
│ ├── clients/
│ │ └── openrouter.client.ts [NOWY]
│ ├── services/
│ │ ├── openrouter.service.ts [NOWY]
│ │ └── ai-generation.service.ts [NOWY]
│ ├── types/
│ │ └── openrouter.types.ts [NOWY]
│ └── utils/
│ ├── openrouter-errors.ts [NOWY]
│ └── logger.ts [NOWY - opcjonalny]
├── pages/
│ └── api/
│ └── study-plans/
│ └── [planId]/
│ └── ai-generations/
│ └── index.ts [NOWY]
├── types.ts [AKTUALIZACJA]
└── env.d.ts [AKTUALIZACJA]

```

### 🚀 Następne kroki po implementacji:

1. Przetestuj każdy komponent osobno
2. Przetestuj integrację end-to-end
3. Monitoruj zużycie tokenów i koszty
4. Optymalizuj prompty dla lepszej jakości odpowiedzi
5. Rozważ implementację cache'owania dla podobnych requestów
6. Dodaj metryki i dashboard monitoringu

### 🔄 Możliwe rozszerzenia przyszłościowe:

- Streaming odpowiedzi dla lepszego UX
- Fallback na alternatywne modele przy błędach
- Cache'owanie odpowiedzi dla identycznych requestów
- Fine-tuning promptów na podstawie feedbacku użytkowników
- A/B testing różnych modeli i parametrów
- Batch processing dla wielu generacji jednocześnie

```
