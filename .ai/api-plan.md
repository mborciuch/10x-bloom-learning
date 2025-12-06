# REST API Plan

## 1. Zasoby

- `studyPlans` → `study_plans`
- `exerciseTemplates` → `exercise_templates`
- `reviewSessions` → `review_sessions`
- `reviewSessionFeedback` → `review_session_feedback`
- `auth` (user metadata) → Supabase Auth `auth.users` (pole `user_metadata`)

## 2. Endpoints

### Study Plans

| Method | Path                        | Description                         |
| ------ | --------------------------- | ----------------------------------- |
| GET    | `/api/study-plans`          | List plans for current user         |
| POST   | `/api/study-plans`          | Create new plan                     |
| GET    | `/api/study-plans/{planId}` | Fetch plan details                  |
| PATCH  | `/api/study-plans/{planId}` | Update title/source material/status |
| DELETE | `/api/study-plans/{planId}` | Delete plan (cascade sessions)      |

**GET /api/study-plans**

- Query Params: `status`, `search`, `page`, `pageSize`, `sort` (`created_at`, `updated_at`, `title`)
- Response:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "sourceMaterial": "string",
        "wordCount": 1234,
        "status": "active",
        "createdAt": "string",
        "updatedAt": "string",
        "pendingAiGeneration": "boolean"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 5
  }
  ```
- Success: `200 OK`

**POST /api/study-plans**

- Request:
  ```json
  {
    "title": "string",
    "sourceMaterial": "string",
    "wordCount": 1200
  }
  ```
- Response:
  ```json
  {
    "id": "uuid",
    "title": "string",
    "sourceMaterial": "string",
    "wordCount": 1200,
    "status": "active",
    "createdAt": "string",
    "updatedAt": "string"
  }
  ```
- Success: `201 Created`
- Errors: `400 Bad Request` (word count, missing fields), `409 Conflict` (duplicate title), `401 Unauthorized`

**GET /api/study-plans/{planId}**

- Response extends POST response with aggregated session counts (`totalSessions`, `completedSessions`)
- Errors: `404 Not Found` if plan ID inaccessible

**PATCH /api/study-plans/{planId}**

- Request:
  ```json
  {
    "title": "string",
    "sourceMaterial": "string",
    "status": "active|archived"
  }
  ```
- Partial updates allowed
- Success: `200 OK`
- Errors: `400`, `409`, `404`

**DELETE /api/study-plans/{planId}**

- Success: `204 No Content`
- Errors: `409` (if active AI generation), `404`, `401`

### Exercise Templates

**MVP Simplification:** Exercise templates are PREDEFINED ONLY (system-wide, read-only for users).
Templates with AI prompts are populated via seed data. Users cannot create/edit/delete templates in MVP.

| Method | Path                           | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/api/exercise-templates`      | List predefined templates only |
| GET    | `/api/exercise-templates/{id}` | Get single template (optional) |

**GET /api/exercise-templates**

- Query Params: `isActive`, `taxonomyLevel`, `search`, `page`, `pageSize`
- Response:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string|null",
        "defaultTaxonomyLevel": "remember|understand|...",
        "metadata": {},
        "isActive": true,
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "total": 15
  }
  ```
- Note: `prompt` field exists in DB (populated via seed) but is NOT exposed in API response
- AI generation backend reads prompts directly from DB when generating sessions

**GET /api/exercise-templates/{templateId}** (Optional)

- Response: Same as list item
- Use case: Detail view if needed by frontend

### AI Generation

| Method | Path                                    | Description                                  |
| ------ | --------------------------------------- | -------------------------------------------- |
| POST   | `/api/study-plans/{planId}/ai-generate` | Synchronous AI generation of review sessions |

**POST /api/study-plans/{planId}/ai-generate**

- Request:
  ```json
  {
    "requestedCount": 10,
    "taxonomyLevels": ["remember", "apply"],
    "includePredefinedTemplateIds": ["uuid"],
    "modelName": "openrouter/model-id"
  }
  ```
- Behavior:
  - Backend:
    - Pobiera materiał źródłowy planu nauki z `study_plans`.
    - Wywołuje OpenRouter (zgodnie z `OpenRouterService`).
    - Na podstawie odpowiedzi tworzy rekordy w `review_sessions` z:
      - `is_ai_generated = true`
      - `status = 'proposed'`
      - poprawnie ustawionym `taxonomy_level`, `exercise_label`, `content`.
  - UI:
    - Czeka synchronicznie na odpowiedź (loader).
    - Po sukcesie wyświetla wygenerowane sesje w kalendarzu jako propozycje.
- Response:
  ```json
  {
    "sessions": [
      {
        "id": "uuid",
        "studyPlanId": "uuid",
        "exerciseTemplateId": "uuid|null",
        "exerciseLabel": "string",
        "reviewDate": "string",
        "taxonomyLevel": "remember|...",
        "status": "proposed",
        "isAiGenerated": true,
        "isCompleted": false,
        "content": {
          "questions": [],
          "answers": [],
          "hints": []
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
- Success: `201 Created`
- Errors: `400` (no levels/count out of range), `404` (plan not found / ownership), `401` (unauthorized)

> **Future v2 (async mode, nie implementować teraz):**
> Asynchroniczne logowanie prób generowania (tabela `ai_generation_log`, endpointy listujące, retry, accept itp.) zostało usunięte z aktualnego planu API i może wrócić w przyszłej wersji.

### Review Sessions

| Method | Path                                        | Description                           |
| ------ | ------------------------------------------- | ------------------------------------- |
| GET    | `/api/review-sessions`                      | List sessions with filters (calendar) |
| POST   | `/api/review-sessions`                      | Create manual session                 |
| GET    | `/api/review-sessions/{sessionId}`          | Fetch session detail                  |
| PATCH  | `/api/review-sessions/{sessionId}`          | Update date/content/status            |
| DELETE | `/api/review-sessions/{sessionId}`          | Delete session                        |
| POST   | `/api/review-sessions/{sessionId}/complete` | Mark completed                        |
| POST   | `/api/review-sessions/{sessionId}/feedback` | Submit feedback                       |

**GET /api/review-sessions**

- Query Params:
  - `studyPlanId`
  - `dateFrom`, `dateTo`
  - `status` (`proposed`, `accepted`, `rejected`)
  - `isCompleted`
  - `taxonomyLevel`
  - `isAiGenerated`
  - `page`, `pageSize`
  - `sort` (default `review_date` desc)
- Response:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "studyPlanId": "uuid",
        "exerciseTemplateId": "uuid|null",
        "exerciseLabel": "string",
        "reviewDate": "string",
        "taxonomyLevel": "remember|...",
        "status": "proposed|accepted|rejected",
        "isAiGenerated": true,
        "isCompleted": false,
        "content": {
          "questions": [],
          "answers": []
        },
        "notes": "string|null",
        "statusChangedAt": "string",
        "completedAt": "string|null",
        "createdAt": "string",
        "updatedAt": "string",
        "aiGenerationLogId": "uuid|null"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "total": 120
  }
  ```
- Success: `200 OK`

**POST /api/review-sessions**

- Request:
  ```json
  {
    "studyPlanId": "uuid",
    "exerciseTemplateId": "uuid|null",
    "exerciseLabel": "string",
    "reviewDate": "string (YYYY-MM-DD)",
    "taxonomyLevel": "remember|understand|apply|analyze|evaluate|create",
    "content": {
      "questions": ["string"],
      "answers": ["string"],
      "hints": ["string"]
    },
    "notes": "string|null"
  }
  ```
- `isAiGenerated` set to `false`
- Response: created session object
- Success: `201 Created`
- Errors: `400` (missing fields, invalid date, taxonomy), `404` (plan/template not found), `409` (plan ownership mismatch)

**PATCH /api/review-sessions/{sessionId}**

- Request:
  ```json
  {
    "reviewDate": "string",
    "exerciseTemplateId": "uuid|null",
    "exerciseLabel": "string",
    "taxonomyLevel": "remember|...|create",
    "status": "proposed|accepted|rejected",
    "content": {
      "questions": ["string"],
      "answers": ["string"],
      "hints": ["string"]
    },
    "notes": "string|null"
  }
  ```
- When status transitions to `accepted`, ensure same user as plan owner; when `rejected`, optionally cascade to log update.
- Success: `200 OK`

**DELETE /api/review-sessions/{sessionId}**

- Success: `204 No Content`
- Errors: `409` if part of accepted AI generation being finalized; `404`

**POST /api/review-sessions/{sessionId}/complete**

- Request:
  ```json
  {
    "completedAt": "string|null"
  }
  ```
- Sets `isCompleted=true`, `completedAt`
- Success: `200 OK`

### Review Session Feedback

**POST /api/review-sessions/{sessionId}/feedback**

- Request:
  ```json
  {
    "rating": 4,
    "comment": "string|null"
  }
  ```
- Response:
  ```json
  {
    "id": "uuid",
    "reviewSessionId": "uuid",
    "rating": 4,
    "comment": "string|null",
    "createdAt": "string"
  }
  ```
- Success: `201 Created`
- Errors: `400` (rating outside 1-5), `409` (duplicate feedback from same user), `404`

**GET /api/review-sessions/{sessionId}/feedback**

- Optional list endpoint for analytics; paginated.

### Metrics

| Method | Path                      | Description                             |
| ------ | ------------------------- | --------------------------------------- |
| GET    | `/api/metrics/ai-usage`   | Return AI usage ratios for current user |
| GET    | `/api/metrics/ai-quality` | Return plan-level editing percentages   |

**GET /api/metrics/ai-usage**

- Response:
  ```json
  {
    "totalReviewSessions": 40,
    "aiGeneratedSessions": 30,
    "manualSessions": 10,
    "aiUsageRate": 0.75
  }
  ```

**GET /api/metrics/ai-quality**

- Query: `studyPlanId` (optional)
- Response:
  ```json
  {
    "studyPlans": [
      {
        "studyPlanId": "uuid",
        "generatedSessions": 10,
        "acceptedSessions": 8,
        "editedSessions": 4,
        "editRate": 0.4
      }
    ]
  }
  ```

### Onboarding

Przechowywane w `auth.users.user_metadata.onboardingCompletedAt`; frontend odczytuje oraz aktualizuje dane bezpośrednio przez Supabase Auth.

## 3. Authentication and Authorization

- Primary authentication uses Supabase JWT access tokens. Requests include `Authorization: Bearer <token>` verified via Supabase GoTrue.
- Authorization enforced via Supabase Row Level Security: each table restricts operations to `auth.uid()`.
- Backend validates ownership before performing non-RLS operations (e.g., aggregated metrics).
- Role separation: default user role only; admin endpoints (future) require elevated service role key.
- Rate limiting: API gateway (Astro middleware) enforces per-user and per-IP quotas (e.g., 60 requests/min) to protect AI generation and prevent abuse.
- AI generation endpoints require additional rate limiting (e.g., 5 per hour) to control OpenRouter costs.

## 4. Walidacja i logika biznesowa

### User Metadata (Supabase Auth)

- `displayName` przechowywany w `auth.users.user_metadata.displayName` (1-120 znaków, opcjonalnie).
- `timezone` zapisywany w `auth.users.user_metadata.timezone`; waliduj względem listy stref IANA.
- `onboardingCompletedAt` ustawiany w metadanych użytkownika (ISO string) podczas zakończenia onboardingu.
- Aktualizacje wykonuj przez `supabase.auth.updateUser`, bez tworzenia rekordów w dodatkowych tabelach.

### Study Plans

- `title` required, trimmed, <= 200 chars.
- `sourceMaterial` required; server computes `wordCount`.
- Word count must be between 200 and 5000 words.
- Enforce unique `lower(title)` per user (`idx_study_plans_user_title`).
- `status` limited to `active`/`archived`; archived plans hidden by default in list.
- Deletion cascades `review_sessions`, `review_session_feedback`, `ai_generation_log`.

### Exercise Templates

- **MVP: Predefined only** - no user-created templates
- `prompt` exists in DB (populated by seed data) but NOT exposed via API
- `name` unique globally (not per user)
- `defaultTaxonomyLevel` constrained to enum; nullable
- `isActive` for soft-delete; managed only by admins via migrations
- Users have read-only access; no INSERT/UPDATE/DELETE permissions via API
- AI generation service reads prompts directly from DB internally

### AI Generation

- Validate `requestedCount` (1-50 default).
- Ensure at least one taxonomy level selected.
- Persist `parameters` JSON schema (`requestedCount`, `taxonomyLevels`, `templateIds`). // TODO: updated in new sync flow
- On generation request:
  - Create `ai_generation_log` with `state=pending`.
  - Kick off background worker (Edge Function/Queue) to call OpenRouter.
  - On success:
    - Upsert `review_sessions` with `status=proposed`, `is_ai_generated=true`, `ai_generation_log_id`.
    - Update log `state=succeeded` and store AI response (JSON).
  - On failure:
    - Update log `state=failed`, `error_message`.
- Accept endpoint transitions statuses:
  - All proposed sessions linked to log -> `accepted`.
  - Update `status_changed_at`.
  - Remove or mark as `rejected` any excluded sessions.
- Ensure acceptance transactionally updates both `review_sessions` and `ai_generation_log`.

### Review Sessions

- `exerciseLabel` required; default from template name when present.
- `reviewDate` required (UTC date). Validate not past date when proposed by AI (business decision optional).
- `taxonomyLevel` must match enum.
- Manual creation sets `status=accepted`, `is_ai_generated=false`.
- Editing proposed sessions allowed before acceptance; after acceptance editing limited.
- Prevent mismatched `user_id` vs `study_plans.user_id` by validating before insert.
- `notes` optional text.
- Completion endpoint sets `is_completed=true`, `completed_at=provided_or_now`.

### Review Session Feedback

- `rating` integer 1-5 enforced.
- One feedback per user per session.
- Optional `comment` length <= 2000.
- Only allowed once session is completed.

### Metrics

- Computed using aggregated queries with RLS; ensure indexes (`idx_review_sessions_user_date`, `idx_review_sessions_plan_status`) leveraged.
- For edit rate: compare generated count vs modifications (flag sessions with content/date edited; track via `metadata` or diff logic).

### Additional Business Rules

- On study plan deletion, ensure background tasks abort pending AI generations.
- On onboarding: when user has zero study plans and `onboarding_completed_at` null, frontend shows empty state.
- Error handling:
  ```json
  {
    "error": {
      "code": "string",
      "message": "string",
      "details": {}
    }
  }
  ```
- Logging: capture AI generation requests/responses (scrub sensitive info) for observability and quality metrics.

### Security & Performance Enhancements

- All endpoints require HTTPS.
- Input sanitization to prevent prompt injection.
- For large `sourceMaterial`, limit payload size (max 200 KB).
- Cache GET endpoints with ETags/Last-Modified where feasible (`study-plans`, `exercise-templates`).
- Use pagination defaults (`pageSize=20` for plans, `50` for sessions).
- Implement idempotency key header for AI generation initiation to prevent duplicates.
