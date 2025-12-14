1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Enum Types
| Name | Values | Notes |
| --- | --- | --- |
| taxonomy_level | `'remember'`, `'understand'`, `'apply'`, `'analyze'`, `'evaluate'`, `'create'` | Odwzorowanie poziomów taksonomii Blooma |
| review_status | `'proposed'`, `'accepted'`, `'rejected'` | Cykl życia powtórek generowanych przez AI (manualne domyślnie `accepted`) |

### Table: profiles
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK, FK → `auth.users(id)` `on delete cascade` |
| display_name | text | nullable |
| timezone | text | nullable |
| onboarding_completed_at | timestamptz | nullable |
| created_at | timestamptz | `not null default now()` |
| updated_at | timestamptz | `not null default now()` |

### Table: study_plans
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK `default gen_random_uuid()` |
| user_id | uuid | FK → `profiles(id)` `on delete cascade` |
| title | text | `not null` |
| source_material | text | `not null` |
| word_count | integer | `not null` (walidowane w aplikacji) |
| status | text | `not null default 'active'`, `check (status in ('active','archived'))` |
| created_at | timestamptz | `not null default now()` |
| updated_at | timestamptz | `not null default now()` |

### Table: exercise_templates (PREDEFINED ONLY - MVP Simplification)
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK `default gen_random_uuid()` |
| name | text | `not null unique` (globally unique) |
| description | text | nullable |
| prompt | text | `not null` (AI prompt, populated via seed, NOT exposed in API) |
| default_taxonomy_level | taxonomy_level | nullable |
| is_active | boolean | `not null default true` |
| metadata | jsonb | `not null default '{}'::jsonb` |
| created_at | timestamptz | `not null default now()` |
| updated_at | timestamptz | `not null default now()` |

**MVP Note:** Removed `is_predefined` and `created_by` fields. All templates are system-wide predefined templates populated via seed data. Users have read-only access (SELECT only via RLS).

<!-- Future v2: ai_generation_log (async AI generation log) zostało usunięte z MVP.
Można przywrócić tę tabelę w wersji asynchronicznej, jeśli zajdzie potrzeba logowania prób generowania,
statusów `pending/succeeded/failed` oraz retry. -->

### Table: review_sessions
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK `default gen_random_uuid()` |
| study_plan_id | uuid | FK → `study_plans(id)` `on delete cascade` |
| user_id | uuid | FK → `profiles(id)` `on delete cascade` |
| exercise_template_id | uuid | FK → `exercise_templates(id)` `on delete set null` |
| exercise_label | text | `not null` |
| review_date | date | `not null` |
| taxonomy_level | taxonomy_level | `not null` |
| status | review_status | `not null default 'accepted'` |
| is_ai_generated | boolean | `not null default false` |
| is_completed | boolean | `not null default false` |
| completed_at | timestamptz | nullable |
| status_changed_at | timestamptz | `not null default now()` |
| content | jsonb | `not null` (lista pytań, odpowiedzi, dodatkowe wskazówki) |
| notes | text | nullable |
| created_at | timestamptz | `not null default now()` |
| updated_at | timestamptz | `not null default now()` |

### Table: review_session_feedback
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK `default gen_random_uuid()` |
| review_session_id | uuid | FK → `review_sessions(id)` `on delete cascade` |
| user_id | uuid | FK → `profiles(id)` `on delete cascade` |
| rating | smallint | `check (rating between 1 and 5)` |
| comment | text | nullable |
| created_at | timestamptz | `not null default now()` |

2. Relacje między tabelami
- `profiles.id` 1:1 `auth.users.id` (Supabase) z kasowaniem kaskadowym.
- `study_plans.user_id` N:1 `profiles.id`.
- `exercise_templates.created_by` N:1 `profiles.id` (dla rekordów użytkownika).
- `review_sessions.study_plan_id` N:1 `study_plans.id`; `review_sessions.user_id` N:1 `profiles.id`.
- `review_sessions.exercise_template_id` N:1 `exercise_templates.id` (opcjonalnie).
- `review_session_feedback.review_session_id` N:1 `review_sessions.id`; `review_session_feedback.user_id` N:1 `profiles.id`.

3. Indeksy
- `idx_review_sessions_user_date` on `review_sessions(user_id, review_date desc)` (widok kalendarza).
- `idx_review_sessions_plan_status` on `review_sessions(study_plan_id, status)` (akceptacja/odrzucenie propozycji AI).
- `idx_study_plans_user_title` unique on `study_plans(user_id, lower(title))` (unikalne nazwy planów per użytkownik).
- `idx_exercise_templates_predefined_name` unique on `exercise_templates(lower(name)) where is_predefined`.
- `idx_review_session_feedback_session` on `review_session_feedback(review_session_id)`.

4. Zasady PostgreSQL (RLS)
- Włączyć RLS na `profiles`, `study_plans`, `exercise_templates`, `review_sessions`, `review_session_feedback`.
- Polityka `select/update/delete` na `profiles` ograniczona do `id = auth.uid()`.
- Polityka na `study_plans` ograniczająca wszystkie operacje do `user_id = auth.uid()`.
- **Polityka na `exercise_templates` (MVP - uproszczona):**
  - SELECT dla wszystkich authenticated users (WHERE `is_active = true`)
  - BRAK INSERT/UPDATE/DELETE policies dla users (tylko service role/admins)
  - Wszystkie templates są predefined, zarządzane przez seed data
- Polityka na `review_sessions` oraz `review_session_feedback` z warunkiem `user_id = auth.uid()`; dodatkowo pozwolenie na `select` rekordów powiązanych poprzez `study_plans.user_id = auth.uid()` (z widokiem lub `using` + `with check`).
- Domyślne polityki `with check` zapewniające, że nowe/aktualizowane rekordy posiadają `user_id = auth.uid()` lub inne wymagane klucze.

5. Dodatkowe uwagi lub wyjaśnienia
- Utrzymuj spójność `review_sessions.user_id` z `study_plans.user_id` na poziomie aplikacji lub poprzez trigger walidujący.
- `updated_at` może być odświeżany przy użyciu triggera `moddatetime`.
- `review_session_feedback` jest opcjonalny; można odłożyć implementację, jeśli analityka jakości nie jest potrzebna w MVP.
- **Predefiniowane rekordy `exercise_templates` (z promptami AI) muszą być ładowane przez seed migration po utworzeniu tabeli.**
- **AI generation service czyta `prompt` z DB (nie eksponowany przez API), używa do generowania pytań.**
- **[FUTURE v2]:** Można przywrócić user-created templates dodając pola `is_predefined`, `created_by` i odpowiednie policies oraz rozbudowane logowanie prób generowania (np. `ai_generation_log`). 

