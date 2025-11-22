# REST API Implementation Plan - Complete Guide

> Kompleksowy plan implementacji wszystkich endpointów REST API dla systemu Bloom Learning

## Spis treści

1. [Study Plans Endpoints](#1-study-plans-endpoints)
2. [Exercise Templates Endpoints](#2-exercise-templates-endpoints)
3. [AI Generation Endpoints](#3-ai-generation-endpoints)
4. [Review Sessions Endpoints](#4-review-sessions-endpoints)
5. [Metrics Endpoints](#5-metrics-endpoints)
6. [Profile Endpoints](#6-profile-endpoints)
7. [Wspólne wymagania](#7-wspólne-wymagania)
8. [Architektura serwisów](#8-architektura-serwisów)
9. [Obsługa błędów](#9-obsługa-błędów)
10. [Bezpieczeństwo i wydajność](#10-bezpieczeństwo-i-wydajność)

---

## 1. Study Plans Endpoints

### 1.1. GET /api/study-plans

**Przegląd:** Zwraca paginowaną listę planów nauki dla zalogowanego użytkownika z możliwością filtrowania i sortowania.

**Request:**

- Metoda: `GET`
- URL: `/api/study-plans`
- Query params (opcjonalne):
  - `status`: `active` | `archived`
  - `search`: string (wyszukiwanie w title)
  - `page`: number (default: 1)
  - `pageSize`: number (default: 20, max: 100)
  - `sort`: `created_at` | `updated_at` | `title` (default: `created_at`)
  - `sortOrder`: `asc` | `desc` (default: `desc`)

**Response:**

- Status: `200 OK`
- Body: `Paginated<StudyPlanListItemDto>`

**Wykorzystywane typy:**

- `StudyPlanListItemDto` (z `src/types.ts`)
- `Paginated<T>` (z `src/types.ts`)

**Przepływ danych:**

1. Pobierz user_id z `context.locals.supabase.auth.getUser()`
2. Zbuduj query do `study_plans` z filtrami
3. Dla każdego planu: sprawdź czy istnieje pending AI generation (JOIN lub subquery na `ai_generation_log`)
4. Zastosuj paginację i sortowanie
5. Zmapuj wyniki do DTO (snake_case → camelCase)
6. Zwróć `{items, page, pageSize, total}`

**Bezpieczeństwo:**

- RLS automatycznie ogranicza do `user_id = auth.uid()`
- Walidacja query params z Zod

**Obsługa błędów:**

- `401 Unauthorized` - brak tokenu auth
- `400 Bad Request` - nieprawidłowe query params

**Wydajność:**

- Użyj istniejącego indexu na `user_id`
- Dla `search`: użyj `ILIKE` lub full-text search
- Cache'uj wyniki (opcjonalnie z ETag)

**Kroki implementacji:**

1. Utwórz `/src/pages/api/study-plans/index.ts`
2. Zdefiniuj Zod schema dla query params
3. Utwórz `StudyPlanService.list(userId, filters, pagination)` w `/src/lib/services/study-plan.service.ts`
4. Zaimplementuj mapping DB → DTO

---

### 1.2. POST /api/study-plans

**Przegląd:** Tworzy nowy plan nauki dla zalogowanego użytkownika.

**Request:**

- Metoda: `POST`
- URL: `/api/study-plans`
- Headers: `Content-Type: application/json`
- Body: `CreateStudyPlanCommand`

**Response:**

- Status: `201 Created`
- Body: `StudyPlanListItemDto`

**Wykorzystywane typy:**

- `CreateStudyPlanCommand` (z `src/types.ts`)
- `StudyPlanListItemDto` (z `src/types.ts`)

**Przepływ danych:**

1. Waliduj request body z Zod schema
2. Pobierz user_id
3. Trim i waliduj `title` (≤200 chars)
4. Oblicz `wordCount` z `sourceMaterial` (server-side, nie ufaj clientowi)
5. Sprawdź unique constraint: `lower(title)` per user
6. Insert do `study_plans` z `status='active'`, `user_id`
7. Zmapuj do DTO i zwróć

**Walidacja biznesowa:**

- `title`: required, trimmed, 1-200 chars
- `sourceMaterial`: required, non-empty
- `wordCount`: 200-5000 słów (obliczony server-side)
- Unique `lower(title)` per user (index: `idx_study_plans_user_title`)

**Bezpieczeństwo:**

- RLS: `user_id` auto-set to `auth.uid()`
- Sanitizacja `sourceMaterial` przed zapisem

**Obsługa błędów:**

- `400 Bad Request` - walidacja (word count, missing fields)
- `409 Conflict` - duplicate title
- `401 Unauthorized` - brak auth

**Kroki implementacji:**

1. Utwórz Zod schema dla `CreateStudyPlanCommand`
2. Implementuj `countWords(text: string): number` helper
3. Implementuj `StudyPlanService.create(userId, command)`
4. Obsłuż unique constraint error (Postgres error code 23505)
5. Dodaj error mapping do API response

---

### 1.3. GET /api/study-plans/[planId]

**Przegląd:** Zwraca szczegóły konkretnego planu nauki wraz z agregatami sesji.

**Request:**

- Metoda: `GET`
- URL: `/api/study-plans/{planId}`
- Params: `planId` (UUID)

**Response:**

- Status: `200 OK`
- Body: `StudyPlanDetailsDto`

**Wykorzystywane typy:**

- `StudyPlanDetailsDto` (extends `StudyPlanListItemDto` + aggregates)

**Przepływ danych:**

1. Waliduj `planId` (UUID format)
2. Pobierz plan z `study_plans` (RLS auto-filtruje)
3. Oblicz agregaty:
   - `totalSessions`: COUNT z `review_sessions` WHERE `study_plan_id = planId`
   - `completedSessions`: COUNT WHERE `is_completed = true`
4. Sprawdź pending AI generation
5. Zmapuj do DTO

**Bezpieczeństwo:**

- RLS zapewnia dostęp tylko do własnych planów
- 404 jeśli plan nie istnieje lub nie należy do usera

**Obsługa błędów:**

- `404 Not Found` - plan nie istnieje lub brak dostępu
- `400 Bad Request` - nieprawidłowy UUID

**Wydajność:**

- Użyj agregacji w SQL zamiast N+1 queries
- Index: `idx_review_sessions_plan_status`

**Kroki implementacji:**

1. Utwórz `/src/pages/api/study-plans/[planId]/index.ts`
2. Implementuj `StudyPlanService.getById(userId, planId)`
3. Dodaj agregację w jednym query (JOIN lub subqueries)
4. Obsłuż 404 odpowiednio

---

### 1.4. PATCH /api/study-plans/[planId]

**Przegląd:** Aktualizuje wybrany plan nauki (partial update).

**Request:**

- Metoda: `PATCH`
- URL: `/api/study-plans/{planId}`
- Body: `UpdateStudyPlanCommand` (partial)

**Response:**

- Status: `200 OK`
- Body: `StudyPlanListItemDto`

**Wykorzystywane typy:**

- `UpdateStudyPlanCommand` (z `src/types.ts`)
- `StudyPlanListItemDto`

**Przepływ danych:**

1. Waliduj `planId` i request body
2. Sprawdź czy plan istnieje i należy do usera
3. Jeśli `sourceMaterial` zmienione: przelicz `wordCount`
4. Jeśli `title` zmienione: sprawdź unique constraint
5. Update z `updated_at = now()`
6. Zwróć zaktualizowany plan

**Walidacja biznesowa:**

- Podobna do POST
- Walidacja `status`: tylko `active` | `archived`
- Unique title check (jeśli zmienione)

**Bezpieczeństwo:**

- RLS + dodatkowo sprawdź ownership
- Nie pozwól na zmianę `user_id`

**Obsługa błędów:**

- `400 Bad Request` - walidacja
- `404 Not Found` - plan nie istnieje
- `409 Conflict` - duplicate title

**Kroki implementacji:**

1. Zod schema dla partial update
2. `StudyPlanService.update(userId, planId, command)`
3. Obsługa conditional updates (tylko zmienione pola)
4. Obsługa unique constraint

---

### 1.5. DELETE /api/study-plans/[planId]

**Przegląd:** Usuwa plan nauki wraz z powiązanymi danymi (cascade).

**Request:**

- Metoda: `DELETE`
- URL: `/api/study-plans/{planId}`

**Response:**

- Status: `204 No Content`
- Body: empty

**Przepływ danych:**

1. Waliduj `planId`
2. Sprawdź czy plan należy do usera
3. Sprawdź czy nie ma active AI generation (`state = 'pending'`)
4. DELETE (cascade: `review_sessions`, `review_session_feedback`, `ai_generation_log`)
5. Zwróć 204

**Walidacja biznesowa:**

- Nie pozwól usunąć jeśli `ai_generation_log.state = 'pending'`
- Cascade delete jest obsłużony przez DB constraints

**Bezpieczeństwo:**

- RLS + ownership check
- Transakcja: abort pending AI tasks (jeśli background worker)

**Obsługa błędów:**

- `404 Not Found` - plan nie istnieje
- `409 Conflict` - active AI generation
- `401 Unauthorized`

**Kroki implementacji:**

1. `StudyPlanService.delete(userId, planId)`
2. Check pending generation przed usunięciem
3. Optional: abort background worker
4. Return proper status codes

---

## 2. Exercise Templates Endpoints

### 2.1. GET /api/exercise-templates

**Przegląd:** Zwraca listę szablonów ćwiczeń (predefined + user-owned).

**Request:**

- Metoda: `GET`
- URL: `/api/exercise-templates`
- Query params (opcjonalne):
  - `isPredefined`: boolean
  - `isActive`: boolean (default: true)
  - `taxonomyLevel`: TaxonomyLevel enum
  - `search`: string
  - `page`, `pageSize`

**Response:**

- Status: `200 OK`
- Body: `Paginated<ExerciseTemplateListItemDto>`

**Wykorzystywane typy:**

- `ExerciseTemplateListItemDto` (bez `prompt` - tylko w details)
- `TaxonomyLevel` enum

**Przepływ danych:**

1. Pobierz user_id
2. Query: `WHERE (is_predefined = true OR created_by = user_id) AND is_active = ?`
3. Zastosuj filtry i paginację
4. Zmapuj do DTO (exclude `prompt`)

**RLS:**

- Predefined templates: dostęp dla wszystkich authenticated
- User templates: tylko dla `created_by = auth.uid()`

**Kroki implementacji:**

1. `/src/pages/api/exercise-templates/index.ts`
2. `ExerciseTemplateService.list(userId, filters)`
3. Mapping bez `prompt` field

---

### 2.2. POST /api/exercise-templates

**Przegląd:** Tworzy nowy user-defined template.

**Request:**

- Metoda: `POST`
- Body: `CreateExerciseTemplateCommand`

**Response:**

- Status: `201 Created`
- Body: `ExerciseTemplateDetailsDto`

**Walidacja biznesowa:**

- `name`: required, non-empty
- `prompt`: required, non-empty
- `defaultTaxonomyLevel`: nullable, enum validation
- `isPredefined`: force to `false` (backend)
- `created_by`: auto-set to `auth.uid()`
- Unique `lower(name)` per user

**Obsługa błędów:**

- `400` - invalid taxonomy, empty fields
- `409` - duplicate name for user

**Kroki implementacji:**

1. Zod schema z enum validation
2. `ExerciseTemplateService.create(userId, command)`
3. Force `isPredefined = false`, set `created_by`

---

### 2.3. GET /api/exercise-templates/[templateId]

**Przegląd:** Zwraca szczegóły szablonu wraz z `prompt`.

**Response:**

- Body: `ExerciseTemplateDetailsDto` (includes `prompt`, `createdBy`)

**RLS:**

- Dostęp: predefined OR owned
- 404 jeśli brak dostępu

---

### 2.4. PATCH /api/exercise-templates/[templateId]

**Przegląd:** Aktualizuje user-owned template.

**Walidacja:**

- Ownership check: `created_by = auth.uid()`
- Nie pozwól zmienić `isPredefined` na `true`

**Obsługa błędów:**

- `403 Forbidden` - not owner
- `400` - invalid data
- `404` - not found

---

### 2.5. DELETE /api/exercise-templates/[templateId]

**Przegląd:** Soft-delete (set `is_active = false`).

**Walidacja:**

- Ownership check
- Soft delete preserves history

**Response:**

- Status: `204 No Content`

**Kroki implementacji:**

1. UPDATE `is_active = false` zamiast DELETE
2. Ownership check

---

## 3. AI Generation Endpoints

### 3.1. POST /api/study-plans/[planId]/ai-generations

**Przegląd:** Inicjuje asynchroniczne generowanie sesji przez AI.

**Request:**

- Metoda: `POST`
- URL: `/api/study-plans/{planId}/ai-generations`
- Body: `InitiateAiGenerationCommand`

**Response:**

- Status: `202 Accepted` (async processing)
- Body: `AiGenerationDto`

**Wykorzystywane typy:**

- `InitiateAiGenerationCommand`
- `AiGenerationDto`
- `AiGenerationParametersDto`

**Przepływ danych:**

1. Waliduj request body
2. Sprawdź ownership planu
3. Sprawdź czy nie istnieje pending generation dla tego planu
4. Utwórz wpis w `ai_generation_log` z `state='pending'`
5. Kick off background worker (Edge Function/Queue)
6. Zwróć 202 z creation response

**Walidacja biznesowa:**

- `requestedCount`: 1-50 (default range)
- `taxonomyLevels`: at least one, valid enum values
- `includePredefinedTemplateIds`: validate templates exist
- No pending generation: `SELECT WHERE study_plan_id = ? AND state = 'pending'`

**Bezpieczeństwo:**

- Idempotency key header (optional)

**Obsługa błędów:**

- `400` - invalid count/levels
- `404` - plan not found
- `409` - pending generation exists

**Kroki implementacji:**

1. Zod schema z array validation
2. `AiGenerationService.initiate(userId, planId, command)`
3. Create log entry
4. Invoke background worker (Edge Function URL)
5. Return 202 with log data

**Background Worker Flow:**

1. Fetch generation log
2. Call OpenRouter API with source material + templates
3. Parse AI response → review sessions data
4. INSERT batch do `review_sessions` z `status='proposed'`, `is_ai_generated=true`
5. UPDATE `ai_generation_log`: `state='succeeded'`, `response=json`, `completed_at=now()`
6. On error: `state='failed'`, `error_message`

---

### 3.2. GET /api/study-plans/[planId]/ai-generations

**Przegląd:** Lista prób generowania dla planu (latest first).

**Query params:**

- `state`: `pending` | `succeeded` | `failed`
- `page`, `pageSize`

**Response:**

- `Paginated<AiGenerationDto>`

**Order:** `requested_at DESC`

---

### 3.3. GET /api/ai-generations/[genId]

**Przegląd:** Szczegóły konkretnej generacji z pełnym response/error.

**Response:**

- Body: `AiGenerationDto`

**Użycie:**

- Frontend polling dla pending generations
- Wyświetlanie error messages

---

### 3.4. POST /api/ai-generations/[genId]/accept

**Przegląd:** Akceptuje wygenerowane sesje (transakcja).

**Request:**

- Body: `AcceptAiGenerationCommand` (discriminated union)
  - `{acceptAll: true}` OR
  - `{sessionIds: [...]}`

**Przepływ danych (transakcja):**

1. Sprawdź czy generation należy do usera
2. Sprawdź `state != 'succeeded'` → error
3. Sprawdź czy już zaakceptowano
4. Jeśli `acceptAll`:
   - UPDATE all sessions WHERE `ai_generation_log_id = genId` SET `status='accepted'`, `status_changed_at=now()`
5. Jeśli `sessionIds`:
   - Waliduj że sessions należą do tego generation
   - UPDATE tylko wybrane
   - Optional: mark pozostałe jako `rejected`
6. UPDATE `ai_generation_log`: może dodać flag `accepted_at`
7. COMMIT

**Obsługa błędów:**

- `400` - bad request
- `404` - generation not found
- `409` - already accepted
- `422` - session IDs mismatch

**Kroki implementacji:**

1. Zod schema dla discriminated union
2. `AiGenerationService.accept(userId, genId, command)`
3. Transaction wrapper
4. Validate session ownership

---

### 3.5. POST /api/ai-generations/[genId]/retry

**Przegląd:** Retry failed generation (optional feature).

**Request:**

- Body: `RetryAiGenerationCommand`

**Walidacja:**

- `state = 'failed'`
- Optional: same or different `modelName`

**Przepływ:**

- Create new log entry OR reset existing to `pending`
- Kick off worker again

---

## 4. Review Sessions Endpoints

### 4.1. GET /api/review-sessions

**Przegląd:** Lista sesji z zaawansowanym filtrowaniem (calendar view).

**Query params:**

- `studyPlanId`: UUID
- `dateFrom`, `dateTo`: YYYY-MM-DD
- `status`: `proposed` | `accepted` | `rejected`
- `isCompleted`: boolean
- `taxonomyLevel`: enum
- `isAiGenerated`: boolean
- `page`, `pageSize`
- `sort`: default `review_date DESC`

**Response:**

- `Paginated<ReviewSessionDto>`

**Wykorzystywane typy:**

- `ReviewSessionDto` (complete with content)
- `ReviewSessionContentDto` (nested)
- `ReviewStatus`, `TaxonomyLevel` enums

**Wydajność:**

- Index: `idx_review_sessions_user_date`
- Index: `idx_review_sessions_plan_status`
- Date range queries optimized

**Kroki implementacji:**

1. Complex query builder with filters
2. `ReviewSessionService.list(userId, filters)`
3. JSON parsing dla `content` field

---

### 4.2. POST /api/review-sessions

**Przegląd:** Tworzy manual review session.

**Request:**

- Body: `CreateReviewSessionCommand`

**Walidacja biznesowa:**

- `studyPlanId`: must exist and belong to user
- `exerciseTemplateId`: nullable, must exist if provided
- `exerciseLabel`: required, default from template name
- `reviewDate`: required, valid date format (YYYY-MM-DD)
- `taxonomyLevel`: enum validation
- `content`: validate structure (questions, answers arrays)
- Force: `isAiGenerated = false`, `status = 'accepted'`, `user_id = auth.uid()`

**Content validation:**

```typescript
{
  questions: string[] (required, min 1),
  answers: string[] (required, min 1),
  hints?: string[] (optional)
}
```

**Obsługa błędów:**

- `400` - validation (date, taxonomy, content structure)
- `404` - plan/template not found
- `409` - plan ownership mismatch

**Kroki implementacji:**

1. Zod schema z nested object validation
2. Validate plan ownership
3. Validate template existence (if provided)
4. `ReviewSessionService.create(userId, command)`
5. JSON stringify dla `content`

---

### 4.3. GET /api/review-sessions/[sessionId]

**Przegląd:** Szczegóły sesji.

**Response:**

- Body: `ReviewSessionDto`

**RLS:**

- Auto-filter by `user_id`

---

### 4.4. PATCH /api/review-sessions/[sessionId]

**Przegląd:** Aktualizuje sesję (partial).

**Request:**

- Body: `UpdateReviewSessionCommand`

**Walidacja:**

- Status transitions: logic dla `proposed` → `accepted`/`rejected`
- Update `status_changed_at` when status changes
- Validate ownership
- Enum validation

**Business rules:**

- Editing proposed sessions: allowed before acceptance
- After acceptance: limited editing (business decision)

**Kroki implementacji:**

1. Partial update schema
2. Conditional `status_changed_at` update
3. `ReviewSessionService.update(userId, sessionId, command)`

---

### 4.5. DELETE /api/review-sessions/[sessionId]

**Przegląd:** Usuwa sesję.

**Walidacja:**

- Not part of finalized AI generation (check `ai_generation_log_id`)
- Cascade: `review_session_feedback`

**Obsługa błędów:**

- `409` - part of accepted AI generation being finalized
- `404`

---

### 4.6. POST /api/review-sessions/[sessionId]/complete

**Przegląd:** Oznacza sesję jako ukończoną.

**Request:**

- Body: `CompleteReviewSessionCommand`

**Przepływ:**

1. Waliduj ownership
2. UPDATE: `is_completed = true`, `completed_at = provided || now()`
3. Return updated session

**Obsługa błędów:**

- `404`
- `409` - already completed (optional check)

**Kroki implementacji:**

1. Simple update endpoint
2. `ReviewSessionService.complete(userId, sessionId, completedAt?)`

---

### 4.7. POST /api/review-sessions/[sessionId]/feedback

**Przegląd:** Dodaje feedback do ukończonej sesji.

**Request:**

- Body: `SubmitReviewSessionFeedbackCommand`

**Walidacja:**

- `rating`: 1-5 (smallint check)
- `comment`: optional, ≤2000 chars
- Session must be completed
- No duplicate feedback from same user (unique constraint)

**Response:**

- Status: `201 Created`
- Body: `ReviewSessionFeedbackDto`

**Obsługa błędów:**

- `400` - rating out of range, comment too long
- `404` - session not found
- `409` - duplicate feedback, session not completed

**Kroki implementacji:**

1. Validate session is completed
2. Check unique constraint
3. INSERT to `review_session_feedback`
4. `ReviewSessionService.submitFeedback(userId, sessionId, command)`

---

## 5. Metrics Endpoints

### 5.1. GET /api/metrics/ai-usage

**Przegląd:** Zwraca statystyki użycia AI dla użytkownika.

**Response:**

- Status: `200 OK`
- Body: `AiUsageMetricsDto`

**Przepływ danych:**

```sql
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN is_ai_generated THEN 1 ELSE 0 END) as ai_generated,
  SUM(CASE WHEN NOT is_ai_generated THEN 1 ELSE 0 END) as manual
FROM review_sessions
WHERE user_id = ?
```

**Obliczenia:**

- `aiUsageRate = aiGeneratedSessions / totalReviewSessions` (0 if total = 0)

**Kroki implementacji:**

1. Single aggregation query
2. `MetricsService.getAiUsage(userId)`
3. Calculate rate

---

### 5.2. GET /api/metrics/ai-quality

**Przegląd:** Metryki jakości AI per plan (edit rates).

**Query params:**

- `studyPlanId`: optional filter

**Response:**

- Body: `AiQualityMetricsDto`

**Przepływ danych:**

```sql
SELECT
  study_plan_id,
  COUNT(*) FILTER (WHERE is_ai_generated) as generated,
  COUNT(*) FILTER (WHERE is_ai_generated AND status = 'accepted') as accepted,
  -- Track edited: need metadata or comparison logic
  COUNT(*) FILTER (WHERE metadata->>'edited' = 'true') as edited
FROM review_sessions
WHERE user_id = ? AND (study_plan_id = ? OR ? IS NULL)
GROUP BY study_plan_id
```

**Obliczenia:**

- `editRate = editedSessions / acceptedSessions`

**Tracking edits:**

- Option 1: Flag `metadata.edited = true` on PATCH
- Option 2: Compare with original AI response
- Option 3: Track via separate table

**Kroki implementacji:**

1. Implement edit tracking (metadata approach)
2. Aggregation query with GROUP BY
3. `MetricsService.getAiQuality(userId, studyPlanId?)`

---

## 6. Profile Endpoints

### 6.1. GET /api/profile

**Przegląd:** Zwraca profil zalogowanego użytkownika.

**Response:**

- Status: `200 OK`
- Body: `ProfileDto`

**Przepływ danych:**

1. Pobierz `user_id` z auth
2. SELECT z `profiles` WHERE `id = user_id`
3. Jeśli nie istnieje: lazy create (INSERT z defaults)
4. Return profile

**Lazy Creation:**

- Triggered on first GET after signup
- Default values: all nullable fields = null

**Obsługa błędów:**

- `401 Unauthorized`

**Kroki implementacji:**

1. `/src/pages/api/profile/index.ts`
2. `ProfileService.getOrCreate(userId)`
3. Lazy creation logic

---

### 6.2. PATCH /api/profile

**Przegląd:** Aktualizuje profil użytkownika.

**Request:**

- Body: `UpdateProfileCommand`

**Walidacja:**

- `displayName`: optional, 1-120 chars
- `timezone`: optional, valid IANA timezone
- `markOnboardingComplete`: boolean, sets `onboarding_completed_at = now()`

**Przepływ danych:**

1. Validate fields
2. Partial update
3. If `markOnboardingComplete = true`: SET `onboarding_completed_at = now()`
4. Return updated profile

**Timezone validation:**

```typescript
import { isValidTimezone } from "some-lib"; // e.g., moment-timezone
```

**Obsługa błędów:**

- `400` - invalid timezone, displayName too long
- `401`

**Kroki implementacji:**

1. Zod schema with conditional onboarding logic
2. Timezone validation helper
3. `ProfileService.update(userId, command)`

---

## 7. Wspólne wymagania

### 7.1. Astro Endpoint Structure

Wszystkie endpointy muszą:

```typescript
// src/pages/api/example.ts
export const prerender = false; // SSR mode

import type { APIRoute } from 'astro';
import { z } from 'zod';

export const GET: APIRoute = async (context) => {
  // 1. Auth check
  const supabase = context.locals.supabase;
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    }), { status: 401 });
  }

  // 2. Extract & validate params
  const schema = z.object({...});
  const validation = schema.safeParse(...);

  if (!validation.success) {
    return new Response(JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validation.error.issues
      }
    }), { status: 400 });
  }

  // 3. Call service
  try {
    const result = await SomeService.method(user.id, ...);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return handleError(error);
  }
};
```

### 7.2. Error Response Format

Standardowy format błędów:

```typescript
{
  error: {
    code: string,        // Machine-readable error code
    message: string,     // User-friendly message
    details?: any        // Optional additional context
  }
}
```

### 7.3. Authentication

- Token: `Authorization: Bearer <supabase-jwt>`
- Verify: `context.locals.supabase.auth.getUser()`
- RLS: automatycznie filtruje po `user_id = auth.uid()`

### 7.4. Validation

- Użyj Zod schemas dla wszystkich inputs
- Validate enums against database types
- Sanitize user input (especially for AI prompts)

---

## 8. Architektura serwisów

### 8.1. Service Structure

Utwórz serwisy w `/src/lib/services/`:

- `study-plan.service.ts`
- `exercise-template.service.ts`
- `ai-generation.service.ts`
- `review-session.service.ts`
- `metrics.service.ts`
- `profile.service.ts`

**Pattern:**

```typescript
// src/lib/services/example.service.ts
import { createClient } from "@/db/supabase.client";
import type { SupabaseClient } from "@/db/supabase.client";

export class ExampleService {
  constructor(private supabase: SupabaseClient) {}

  async list(userId: string, filters: Filters, pagination: Pagination) {
    // Implementation
  }

  async getById(userId: string, id: string) {
    // Implementation
  }

  async create(userId: string, command: CreateCommand) {
    // Implementation
  }

  async update(userId: string, id: string, command: UpdateCommand) {
    // Implementation
  }

  async delete(userId: string, id: string) {
    // Implementation
  }
}
```

**Usage in endpoint:**

```typescript
export const GET: APIRoute = async (context) => {
  const service = new ExampleService(context.locals.supabase);
  const result = await service.list(user.id, filters, pagination);
  return new Response(JSON.stringify(result), { status: 200 });
};
```

### 8.2. Mapping Functions

Utwórz mappers w `/src/lib/mappers/`:

```typescript
// src/lib/mappers/study-plan.mapper.ts
import type { Tables } from "@/db/database.types";
import type { StudyPlanListItemDto } from "@/types";

export function mapToStudyPlanListItemDto(
  row: Tables<"study_plans">,
  pendingAiGeneration: boolean
): StudyPlanListItemDto {
  return {
    id: row.id,
    title: row.title,
    sourceMaterial: row.source_material,
    wordCount: row.word_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingAiGeneration,
  };
}
```

### 8.3. Helper Functions

Utwórz helpers w `/src/lib/utils/`:

- `word-count.ts` - funkcja do liczenia słów
- `pagination.ts` - helper paginacji
- `date-validator.ts` - walidacja dat
- `error-handler.ts` - centralna obsługa błędów

**Przykład:**

```typescript
// src/lib/utils/word-count.ts
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
```

```typescript
// src/lib/utils/pagination.ts
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function buildPaginatedResponse<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize };
}
```

---

## 9. Obsługa błędów

### 9.1. Error Codes

Standardowe kody błędów:

- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `VALIDATION_ERROR` - 400
- `CONFLICT` - 409
- `UNPROCESSABLE_ENTITY` - 422
- `INTERNAL_SERVER_ERROR` - 500

### 9.2. Error Handler

```typescript
// src/lib/utils/error-handler.ts
import { PostgrestError } from "@supabase/supabase-js";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
  }
}

export function handleError(error: unknown): Response {
  console.error("[API Error]", error);

  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      }),
      { status: error.statusCode }
    );
  }

  if (isPostgrestError(error)) {
    return handleDatabaseError(error);
  }

  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    }),
    { status: 500 }
  );
}

function handleDatabaseError(error: PostgrestError): Response {
  // 23505: unique_violation
  if (error.code === "23505") {
    return new Response(
      JSON.stringify({
        error: {
          code: "CONFLICT",
          message: "Resource already exists",
          details: error.details,
        },
      }),
      { status: 409 }
    );
  }

  // 23503: foreign_key_violation
  if (error.code === "23503") {
    return new Response(
      JSON.stringify({
        error: {
          code: "NOT_FOUND",
          message: "Referenced resource not found",
          details: error.details,
        },
      }),
      { status: 404 }
    );
  }

  return new Response(
    JSON.stringify({
      error: {
        code: "DATABASE_ERROR",
        message: error.message,
        details: error.details,
      },
    }),
    { status: 500 }
  );
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "code" in error;
}
```

---

## 10. Bezpieczeństwo i wydajność

### 10.1. Bezpieczeństwo

**Authentication:**

- Wszystkie endpointy wymagają Supabase JWT
- Verify token: `context.locals.supabase.auth.getUser()`
- 401 jeśli brak lub invalid token

**Authorization:**

- RLS policies na poziomie bazy danych
- Additional ownership checks w service layer
- Nie ufaj client-side data (np. wordCount)

**Input Sanitization:**

- Zod validation dla wszystkich inputs
- Sanitize przed zapisem do DB (especially AI prompts)
- Limit payload size: max 200KB dla sourceMaterial

### 10.2. Wydajność

**Database:**

- Leverage existing indexes (see db-plan.md)
- Use aggregations instead of N+1 queries
- Pagination: default pageSize=20, max=100

**Caching:**

- GET endpoints: consider ETag/Last-Modified headers
- Cache predefined templates (rarely change)
- Invalidate on mutations

**Optymalizacje:**

- Lazy loading relationships
- Batch operations where possible
- Async AI generation (202 Accepted pattern)

### 10.3. Monitoring

**Logging:**

- Log all AI generation requests/responses
- Scrub sensitive data (user tokens)
- Track error rates per endpoint

**Metrics:**

- Response times
- Error rates
- AI generation success/failure rates
- User activity patterns

---

## 11. Kolejność implementacji

Rekomendowana kolejność (MVP first):

### Faza 1: Core (MVP)

1. **Profile endpoints** - fundament auth
2. **Study Plans** - główny zasób
3. **Exercise Templates GET** - potrzebne dla sesji

### Faza 2: Sessions

4. **Review Sessions** - core functionality
5. **Review Sessions complete/feedback** - user interaction

### Faza 3: AI

6. **Exercise Templates POST/PATCH/DELETE** - user templates
7. **AI Generation initiate** - generowanie
8. **AI Generation list/get** - monitoring
9. **AI Generation accept** - workflow completion

### Faza 4: Analytics

10. **Metrics** - analytics i insights

### Faza 5: Polish

11. Error handling refinement
12. Performance optimization

---

## 12. Przykład kompletnego endpointu

### Przykład: POST /api/study-plans

```typescript
// src/pages/api/study-plans/index.ts
export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { StudyPlanService } from "@/lib/services/study-plan.service";
import { handleError, ApiError } from "@/lib/utils/error-handler";

// Zod schema
const CreateStudyPlanSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sourceMaterial: z.string().min(1),
  wordCount: z.number().int().min(200).max(5000),
});

export const POST: APIRoute = async (context) => {
  // 1. Auth
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Parse body
  let body;
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
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Validate
  const validation = CreateStudyPlanSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: validation.error.issues,
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Call service
  try {
    const service = new StudyPlanService(context.locals.supabase);
    const result = await service.create(user.id, validation.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error);
  }
};
```

```typescript
// src/lib/services/study-plan.service.ts
import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateStudyPlanCommand, StudyPlanListItemDto } from "@/types";
import { countWords } from "@/lib/utils/word-count";
import { mapToStudyPlanListItemDto } from "@/lib/mappers/study-plan.mapper";
import { ApiError } from "@/lib/utils/error-handler";

export class StudyPlanService {
  constructor(private supabase: SupabaseClient) {}

  async create(userId: string, command: CreateStudyPlanCommand): Promise<StudyPlanListItemDto> {
    // Server-side word count (don't trust client)
    const actualWordCount = countWords(command.sourceMaterial);

    if (actualWordCount < 200 || actualWordCount > 5000) {
      throw new ApiError("VALIDATION_ERROR", `Word count must be between 200 and 5000 (got ${actualWordCount})`, 400);
    }

    // Check unique title
    const { data: existing } = await this.supabase
      .from("study_plans")
      .select("id")
      .eq("user_id", userId)
      .ilike("title", command.title)
      .single();

    if (existing) {
      throw new ApiError("CONFLICT", "A study plan with this title already exists", 409);
    }

    // Insert
    const { data, error } = await this.supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        title: command.title.trim(),
        source_material: command.sourceMaterial,
        word_count: actualWordCount,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return mapToStudyPlanListItemDto(data, false);
  }
}
```

---

## 13. Checklist implementacji

Dla każdego endpointu:

- [ ] Utworzono plik Astro endpoint z `prerender = false`
- [ ] Zdefiniowano Zod schema dla validation
- [ ] Zaimplementowano auth check
- [ ] Utworzono/zaktualizowano service w `/src/lib/services/`
- [ ] Dodano error handling z ApiError
- [ ] Utworzono mapper functions (DB → DTO)
- [ ] Sprawdzono RLS policies
- [ ] Dodano dokumentację (JSDoc)
- [ ] Przetestowano ręcznie z Postman/curl
- [ ] Sprawdzono linter errors
- [ ] Przetestowano edge cases (404, 409, validation)

---

## Koniec dokumentu

Ten plan implementacji zawiera wszystkie 26+ endpointów z pełnymi szczegółami technicznymi, biznesowymi i bezpieczeństwa. Gotowy do implementacji w kolejności MVP-first.
