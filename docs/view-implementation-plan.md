## API Endpoint Implementation Plan: POST /api/study-plans/{planId}/ai-generate

## 1. Przegląd punktu końcowego

Endpoint `POST /api/study-plans/{planId}/ai-generate` synchronizuje generowanie propozycji sesji powtórkowych przez AI dla wybranego planu nauki.  
Na podstawie materiału źródłowego z `study_plans` oraz parametrów żądania wywołuje usługę OpenRouter, a następnie zapisuje wygenerowane sesje jako rekordy w tabeli `review_sessions` ze statusem `proposed` i flagą `is_ai_generated = true`.  
Klient (UI) czeka na odpowiedź HTTP (loader), po czym prezentuje wygenerowane sesje jako propozycje w kalendarzu; późniejsza akceptacja/odrzucenie odbywa się przez istniejące endpointy dla `review_sessions`.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/study-plans/{planId}/ai-generate`
- **Parametry:**
  - **Path params (wymagane)**:
    - `planId: string` – UUID istniejącego planu nauki.
  - **Query params**: brak (w MVP).
- **Request Body (JSON)** – `InitiateAiGenerationCommand` z `src/types.ts`:

```json
{
  "requestedCount": 10,
  "taxonomyLevels": ["remember", "apply"],
  "includePredefinedTemplateIds": ["uuid"],
  "modelName": "openrouter/model-id"
}
```

- **Parametry wymagane w body**:
  - `requestedCount: number` – całkowita liczba sesji do wygenerowania (zakres 1–50).
  - `taxonomyLevels: TaxonomyLevel[]` – tablica co najmniej jednego poziomu taksonomii Blooma (enum `taxonomy_level`).
- **Parametry opcjonalne w body**:
  - `includePredefinedTemplateIds?: string[]` – lista UUID szablonów z `exercise_templates`, które mają zostać uwzględnione (opcjonalne).
  - `modelName?: string` – pełna nazwa modelu OpenRouter (`provider/model-id`); jeśli brak – używany jest domyślny model z konfiguracji `OpenRouterService`.

### 2.1. Walidacja wejścia (Zod)

W endpointcie należy zdefiniować schemat Zod:

- `requestedCount`:
  - `z.number().int().min(1).max(50)`
- `taxonomyLevels`:
  - `z.array(z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]))`
  - `.min(1)` – co najmniej jeden poziom.
- `includePredefinedTemplateIds`:
  - `z.array(z.string().uuid()).optional()`
- `modelName`:
  - `z.string().min(1).optional()`

Nieprawidłowe JSON body lub niespełniony schemat powinny skutkować odpowiedzią `400 Bad Request` w standardowym formacie błędu.

## 3. Wykorzystywane typy

### 3.1. DTO i Command modele (z `src/types.ts`)

- `InitiateAiGenerationCommand`:
  - Pola: `requestedCount: number`, `taxonomyLevels: TaxonomyLevel[]`, `includePredefinedTemplateIds?: string[]`, `modelName?: string`.
- `ReviewSessionDto`:
  - Reprezentuje pełny rekord z `review_sessions` wystawiany przez API:
    - `id: uuid`
    - `studyPlanId: uuid`
    - `exerciseTemplateId: uuid | null`
    - `exerciseLabel: string`
    - `reviewDate: date (YYYY-MM-DD)`
    - `taxonomyLevel: TaxonomyLevel`
    - `status: ReviewStatus` (`'proposed' | 'accepted' | 'rejected'`)
    - `isAiGenerated: boolean`
    - `isCompleted: boolean`
    - `content: ReviewSessionContentDto`
    - `notes: string | null`
    - `statusChangedAt, completedAt, createdAt, updatedAt`
- `ReviewSessionContentDto`:
  - `questions: string[]`
  - `answers: string[]`
  - `hints?: string[]`
- `AiGeneratedReviewSessionSchema`:
  - `questions: string[]`
  - `answers: string[]`
  - `hints: string[]`
  - `taxonomyLevel: TaxonomyLevel`
  - `exerciseLabel: string`
- `AiGeneratedSessionsSchema`:
  - `sessions: AiGeneratedReviewSessionSchema[]`
- Bazy enum:
  - `TaxonomyLevel = Enums<"taxonomy_level">`
  - `ReviewStatus = Enums<"review_status">`

### 3.2. Typy bazodanowe (z `db-plan.md`)

- `study_plans`:
  - Istotne pola: `id`, `user_id`, `title`, `source_material`, `word_count`, `status`.
- `exercise_templates`:
  - Istotne pola: `id`, `name`, `prompt`, `default_taxonomy_level`, `is_active`, `metadata`.
- `review_sessions`:
  - Istotne pola: `id`, `study_plan_id`, `user_id`, `exercise_template_id`, `exercise_label`, `review_date`, `taxonomy_level`, `status`, `is_ai_generated`, `content`, `notes`, `created_at`, `updated_at`, `status_changed_at`, `is_completed`, `completed_at`.

## 4. Szczegóły odpowiedzi

- **Status sukcesu**: `201 Created`
- **Body**:

```json
{
  "sessions": [
    {
      "id": "uuid",
      "studyPlanId": "uuid",
      "exerciseTemplateId": "uuid|null",
      "exerciseLabel": "string",
      "reviewDate": "string",
      "taxonomyLevel": "remember",
      "status": "proposed",
      "isAiGenerated": true,
      "isCompleted": false,
      "content": {
        "questions": ["string"],
        "answers": ["string"],
        "hints": ["string"]
      },
      "notes": "string|null",
      "statusChangedAt": "string",
      "completedAt": "string|null",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

- **Kody statusu**:
  - `201 Created` – poprawnie wygenerowano i zapisano sesje.
  - `400 Bad Request` – błędne dane wejściowe (JSON, Zod, niepoprawne wartości).
  - `401 Unauthorized` – brak ważnego tokena Supabase.
  - `404 Not Found` – plan nie istnieje lub nie należy do użytkownika; opcjonalnie brak któregoś z podanych `exercise_templates`.
  - `500 Internal Server Error` – błąd wewnętrzny (np. niespodziewany błąd OpenRouter, błąd DB).

## 5. Przepływ danych

### 5.1. Warstwa endpointu (Astro API Route)

1. **Auth**:
   - W `POST` handlerze wywołaj `context.locals.supabase.auth.getUser()`.
   - Jeśli brak użytkownika lub błąd – zwróć `401` z kodem `UNAUTHORIZED`.
2. **Pobranie `planId`**:
   - Z `context.params.planId`; jeśli brak / niepoprawny UUID – `400 VALIDATION_ERROR`.
3. **Parsowanie i walidacja body**:
   - Spróbuj `await context.request.json()`; jeśli błąd JSON – `400 VALIDATION_ERROR`.
   - Zweryfikuj Zod schema `InitiateAiGenerationCommand`.
4. **Wywołanie serwisu AI**:
   - Utwórz instancję `AiGenerationService` (np. w `src/lib/services/ai-generation.service.ts`), przekazując:
     - `supabase` z `context.locals.supabase`,
     - `openRouterApiKey` z `import.meta.env.OPENROUTER_API_KEY`.
   - Wywołaj `service.generateReviewSessions(user.id, planId, command)`.
5. **Zbudowanie odpowiedzi**:
   - Otrzymane z serwisu `ReviewSessionDto[]` opakuj jako `{ sessions }`.
   - Zwróć `201 Created` z `Content-Type: application/json`.

### 5.2. Warstwa serwisu: `AiGenerationService.generateReviewSessions`

Nowy lub zaktualizowany serwis w `src/lib/services/ai-generation.service.ts`:

1. **Weryfikacja planu**:
   - Zapytaj `study_plans`:
     - `select id, user_id, title, source_material from study_plans where id = :planId`
   - Sprawdź:
     - czy rekord istnieje,
     - czy `user_id === userId` (mimo RLS – jawna walidacja).
   - Jeśli nie – rzuć `ApiError("NOT_FOUND", "Study plan not found", 404)`.
2. **Opcjonalna walidacja templatek**:
   - Jeśli `includePredefinedTemplateIds` niepuste:
     - `select id from exercise_templates where id in (...) and is_active = true`
     - Zweryfikuj, że liczba znalezionych rekordów = liczba przekazanych ID; inaczej `400` lub `404`.
3. **Budowa promptów**:
   - Zbuduj `systemPrompt` (opis roli LLM, zasady taksonomii Blooma – oparty na `openrouter-service-implementation-plan.md`).
   - Zbuduj `userPrompt`, zawierający:
     - `source_material` (po sanetyzacji),
     - żądany `requestedCount`,
     - listę `taxonomyLevels`.
4. **Definicja JSON Schema**:
   - Zdefiniuj JSON schema zgodne z `AiGeneratedSessionsSchema`:
     - `type: "object"`
     - pole `sessions` typu `array` elementów `AiGeneratedReviewSessionSchema`.
5. **Wywołanie `OpenRouterService`**:
   - Utwórz `OpenRouterService` z:
     - `apiKey: OPENROUTER_API_KEY`
     - `defaultModel` oraz inne parametry (timeout, maxRetries).
   - Wywołaj:
     - `generateCompletion<AiGeneratedSessionsSchema>({ messages, modelName: command.modelName, modelParams: { temperature, maxTokens }, responseFormat: { type: "json_schema", json_schema: { name, strict: true, schema } } })`.
6. **Mapowanie odpowiedzi → rekordy `review_sessions`**:
   - Dla każdej `session` z `result.content.sessions`:
     - Zbuduj obiekt insertu:
       - `study_plan_id = planId`
       - `user_id = userId`
       - `exercise_template_id = null` lub na podstawie dopasowania templatek (MVP może ignorować).
       - `exercise_label` z AI.
       - `review_date` – logika kalendarza (np. od jutra, co 1–2 dni; decyzja biznesowa).
       - `taxonomy_level` z AI (`taxonomyLevel`).
       - `status = 'proposed'`
       - `is_ai_generated = true`
       - `is_completed = false`
       - `content = { questions, answers, hints }`
       - `notes = null`
   - Wykonaj **batch insert**:
     - `insert([...]).select().returns<ReviewSessionRow[]>`.
7. **Mapowanie DB → `ReviewSessionDto[]`**:
   - Użyj mappera (np. `review-session.mapper.ts`) by przemapować pola snake_case na camelCase.
8. **Zwrócenie danych**:
   - Zwróć `ReviewSessionDto[]` do endpointu.

### 5.3. Przepływ akceptacji/odrzucenia (poza tym endpointem)

- UI po wygenerowaniu:
  - Wyświetla sesje z `status='proposed'`.
  - Po kliknięciu „Zaakceptuj plan”:
    - Może wywołać serię `PATCH /api/review-sessions/{id}` z `status='accepted'` (lub `rejected`) dla wybranych sesji.
  - Po „Odrzuć plan”:
    - Może wywołać `DELETE /api/review-sessions/{id}` dla wszystkich propozycji.
- Ten flow nie wymaga osobnych endpointów `ai-generations/*`.

## 6. Względy bezpieczeństwa

1. **Uwierzytelnianie**:
   - Każde wywołanie endpointu wymaga ważnego tokena Supabase JWT:
     - `Authorization: Bearer <token>`.
   - Weryfikacja tokenu przez `context.locals.supabase.auth.getUser()`.
2. **Autoryzacja**:
   - RLS na tabelach:
     - `study_plans` – operacje tylko dla `user_id = auth.uid()`.
     - `review_sessions` – podobnie, plus sprawdzenie powiązania przez `study_plan_id`.
   - Dodatkowo w serwisie:
     - jawne sprawdzenie, że `study_plans.user_id === userId`.
3. **Bezpieczeństwo klucza OpenRouter**:
   - Klucz przechowywany w `import.meta.env.OPENROUTER_API_KEY`, nigdy w kodzie.
   - Endpoint nie wycieka klucza ani surowych odpowiedzi modelu.
4. **Walidacja i sanityzacja inputu**:
   - Zod dla body.
   - W razie potrzeby, sanetyzacja `source_material` przed przekazaniem do AI (usuwanie znaków kontrolnych, limit długości).
5. **Ochrona przed nadużyciami kosztowymi**:
   - Możliwość dodania prostego rate-limitingu per user (np. 5 generacji/h) po stronie aplikacji.
6. **Brak przechowywania wrażliwych danych AI**:
   - W `review_sessions.content` trzymane są tylko pytania/odpowiedzi – brak danych osobowych.

## 7. Obsługa błędów

### 7.1. Typowe scenariusze błędów

- **Brak autoryzacji (401)**:
  - Brak tokenu lub niepoprawny token:
    - Odpowiedź:
      - Status: `401`
      - Body: `{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }`
- **Niepoprawne JSON body (400)**:
  - `request.json()` rzuca błąd.
  - Odpowiedź z kodem `VALIDATION_ERROR`.
- **Walidacja Zod (400)**:
  - Nieprawidłowe `requestedCount`, `taxonomyLevels`, `includePredefinedTemplateIds`, itp.
  - Zwróć listę `issues` w `error.details`.
- **Plan nie istnieje lub nie należy do użytkownika (404)**:
  - Brak rekordu `study_plans` dla `planId` + `userId`.
- **Błąd OpenRouter**:
  - Mapowany w `OpenRouterService` do `OpenRouterError`, a następnie w serwisie AI do `ApiError`:
    - `INVALID_API_KEY` → 500 (`CONFIGURATION_ERROR`).
    - `RATE_LIMIT_EXCEEDED` → 429 (`RATE_LIMIT`).
    - `INSUFFICIENT_CREDITS` → 503 (`SERVICE_UNAVAILABLE`).
    - `TIMEOUT` → 408 (`TIMEOUT`).
    - `SCHEMA_VALIDATION_ERROR`, `RESPONSE_PARSE_ERROR` → 500 (`AI_GENERATION_ERROR`).
- **Błędy bazy danych**:
  - Obsługiwane przez `handleError`:
    - `23505` → 409 (`CONFLICT`).
    - `23503` → 404 (`NOT_FOUND`).
    - Inne → 500 (`DATABASE_ERROR` / `INTERNAL_SERVER_ERROR`).

### 7.2. Format błędu

Wszystkie błędy w formacie:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## 8. Rozważania dotyczące wydajności

1. **Batch insert**:
   - Wstawiaj wszystkie wygenerowane sesje jednym zapytaniem `insert([...]).select()` – brak iteracyjnych insertów.
2. **Limity parametrów**:
   - `requestedCount` max 50, `taxonomyLevels` max 6 – ogranicza rozmiar odpowiedzi AI.
3. **Liczba tokenów**:
   - Ustaw `maxTokens` adekwatnie (np. 3000–4000), aby uniknąć zbyt dużych odpowiedzi.
4. **Indeksy DB**:
   - Wykorzystanie istniejących indeksów:
     - `idx_review_sessions_user_date`
     - `idx_review_sessions_plan_status`
5. **Brak asynchronicznego loga**:
   - Prostszy, synchroniczny flow bez dodatkowych zapytań do `ai_generation_log`.
6. **Możliwe przyszłe optymalizacje**:
   - Cache’owanie podobnych requestów AI (np. hash `source_material` + parametry).
   - Asynchroniczny worker (future v2) gdyby czas generacji był zbyt długi.

## 9. Etapy wdrożenia

1. **Przygotowanie typów i schematów:**
   - Upewnij się, że `InitiateAiGenerationCommand`, `AiGeneratedSessionsSchema` i `AiGeneratedReviewSessionSchema` są zdefiniowane w `src/types.ts`.
   - Dodaj (lub zaktualizuj) JSON Schema dla OpenRouter w serwisie AI.
2. **Implementacja `AiGenerationService`:**
   - Utwórz/zmodyfikuj `src/lib/services/ai-generation.service.ts`:
     - dodaj metodę `generateReviewSessions(userId, planId, command)`,
     - użyj `OpenRouterService` wg `openrouter.service.ts`,
     - zaimplementuj batch insert do `review_sessions` i mapowanie do `ReviewSessionDto`.
3. **Implementacja endpointu Astro:**
   - Utwórz plik `src/pages/api/study-plans/[planId]/ai-generate.ts` (lub `index.ts` w odpowiednim katalogu).
   - Dodaj:
     - `export const prerender = false;`
     - handler `POST: APIRoute`.
   - W handlerze:
     - auth check (`getUser`),
     - parsowanie i walidacja body (Zod),
     - wywołanie `AiGenerationService`,
     - zwrócenie `201` z `{ sessions }`,
     - obsługa błędów przez `handleError`.
4. **Integracja z OpenRouterService:**
   - Upewnij się, że `OpenRouterService` i `OpenRouterHttpClient` są dostępne oraz wykorzystują `OPENROUTER_API_KEY`.
5. **Testy E2E (manualne lub automatyczne):**
   - Scenariusze:
     - poprawne wywołanie dla istniejącego planu,
     - brak autoryzacji,
     - niepoprawne body (np. `requestedCount = 0`),
     - brak planu / plan innego użytkownika,
     - symulowane błędy OpenRouter (np. nieprawidłowy klucz).
6. **Weryfikacja RLS i integracji z UI:**
   - Sprawdź, że wygenerowane sesje są widoczne w kalendarzu tylko dla właściciela planu.
   - Upewnij się, że UI korzysta z `status='proposed'` i `is_ai_generated=true` do odróżniania propozycji AI.
7. **Monitoring i logowanie:**
   - Dodaj logi na poziomie `AiGenerationService` i `OpenRouterService` (bez wrażliwych danych).
   - Ewentualnie skonfiguruj alerty na częste błędy AI (429, 500) i zbyt długie czasy odpowiedzi.


