# REST API Plan

## 1. Zasoby

- `studyPlans` → `study_plans`
- `exerciseTemplates` → `exercise_templates`
- `aiGenerations` → `ai_generation_log`
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

| Method | Path                                   | Description                        |
| ------ | -------------------------------------- | ---------------------------------- |
| GET    | `/api/exercise-templates`              | List predefined and user templates |
| POST   | `/api/exercise-templates`              | Create user template               |
| GET    | `/api/exercise-templates/{templateId}` | Get template                       |
| PATCH  | `/api/exercise-templates/{templateId}` | Update (user-owned only)           |
| DELETE | `/api/exercise-templates/{templateId}` | Soft-delete (user-owned)           |

**GET /api/exercise-templates**

- Query Params: `isPredefined`, `isActive`, `taxonomyLevel`, `search`, `page`, `pageSize`
- Response:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string|null",
        "prompt": "string",
        "defaultTaxonomyLevel": "remember|understand|...",
        "isPredefined": true,
        "metadata": {},
        "isActive": true,
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "total": 120
  }
  ```

**POST /api/exercise-templates**

- Request:
  ```json
  {
    "name": "string",
    "description": "string|null",
    "prompt": "string",
    "defaultTaxonomyLevel": "remember|understand|apply|analyze|evaluate|create",
    "metadata": {}
  }
  ```
- Response: created resource
- Constraints: `isPredefined` forced to `false`; `created_by` set to current user
- Success: `201 Created`
- Errors: `400` (invalid taxonomy), `409` (duplicate name for user), `401`

**PATCH/DELETE** follow similar structure; `DELETE` returns `204 No Content`.

### AI Generation

| Method | Path                                       | Description                             |
| ------ | ------------------------------------------ | --------------------------------------- |
| POST   | `/api/study-plans/{planId}/ai-generations` | Initiate AI generation                  |
| GET    | `/api/study-plans/{planId}/ai-generations` | List generation attempts (latest first) |
| GET    | `/api/ai-generations/{genId}`              | Fetch generation status/details         |
| POST   | `/api/ai-generations/{genId}/accept`       | Accept generated sessions               |
| POST   | `/api/ai-generations/{genId}/retry`        | Retry failed generation (optional)      |

**POST /api/study-plans/{planId}/ai-generations**

- Request:
  ```json
  {
    "requestedCount": 10,
    "taxonomyLevels": ["remember", "apply"],
    "includePredefinedTemplateIds": ["uuid"],
    "modelName": "openrouter/model-id"
  }
  ```
- Response:
  ```json
  {
    "id": "uuid",
    "studyPlanId": "uuid",
    "state": "pending",
    "requestedAt": "string",
    "modelName": "string|null",
    "parameters": {
      "requestedCount": 10,
      "taxonomyLevels": ["remember", "apply"],
      "templateIds": ["uuid"]
    }
  }
  ```
- Success: `202 Accepted` (async processing)
- Errors: `400` (no levels/count out of range), `409` (pending generation already exists)

**GET /api/study-plans/{planId}/ai-generations**

- Query: `state`, `page`, `pageSize`
- Response: paginated list with `response` summary, `errorMessage`

**POST /api/ai-generations/{genId}/accept**

- Request (optional adjustments):
  ```json
  {
    "sessionIds": ["uuid"],
    "acceptAll": true
  }
  ```
- Effect: Marks associated `review_sessions` as `accepted`, sets `ai_generation_log.state` to `succeeded`
- Success: `200 OK`
- Errors: `400`, `404`, `409` (already accepted), `422` (session IDs mismatch)

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

- `prompt` non-empty.
- `defaultTaxonomyLevel` constrained to enum; nullable.
- `isPredefined` derived from server logic; user cannot change to `true`.
- Update/delete allowed only when `created_by` equals `auth.uid()`.
- Soft-delete (set `is_active=false`) recommended to preserve history.

### AI Generation

- Validate `requestedCount` (1-50 default).
- Ensure at least one taxonomy level selected.
- Persist `parameters` JSON schema (`requestedCount`, `taxonomyLevels`, `templateIds`).
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
