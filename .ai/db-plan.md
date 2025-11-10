1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Enum Types
| Name | Values | Notes |
| --- | --- | --- |
| taxonomy_level | `'remember'`, `'understand'`, `'apply'`, `'analyze'`, `'evaluate'`, `'create'` | Odwzorowanie poziomów taksonomii Blooma |
| review_status | `'proposed'`, `'accepted'`, `'rejected'` | Cykl życia powtórek generowanych przez AI (manualne domyślnie `accepted`) |
| ai_generation_state | `'pending'`, `'succeeded'`, `'failed'` | Status logu generowania AI |

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

### Table: exercise_templates
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK `default gen_random_uuid()` |
| name | text | `not null` |
| description | text | nullable |
| prompt | text | `not null` |
| default_taxonomy_level | taxonomy_level | nullable |
| is_predefined | boolean | `not null default false` |
| created_by | uuid | FK → `profiles(id)` `on delete set null` |
| is_active | boolean | `not null default true` |
| metadata | jsonb | `not null default '{}'::jsonb` |
| created_at | timestamptz | `not null default now()` |
| updated_at | timestamptz | `not null default now()` |
| CONSTRAINT |  | `check ((is_predefined and created_by is null) or (not is_predefined and created_by is not null))` |

### Table: ai_generation_log
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK `default gen_random_uuid()` |
| study_plan_id | uuid | FK → `study_plans(id)` `on delete cascade` |
| user_id | uuid | FK → `profiles(id)` `on delete cascade` |
| requested_at | timestamptz | `not null default now()` |
| model_name | text | nullable |
| parameters | jsonb | `not null` (wybrane poziomy, liczba powtórek, itp.) |
| response | jsonb | nullable |
| state | ai_generation_state | `not null default 'pending'` |
| error_message | text | nullable |
| created_at | timestamptz | `not null default now()` |

### Table: review_sessions
| Column | Type | Constraints / Default |
| --- | --- | --- |
| id | uuid | PK `default gen_random_uuid()` |
| study_plan_id | uuid | FK → `study_plans(id)` `on delete cascade` |
| user_id | uuid | FK → `profiles(id)` `on delete cascade` |
| exercise_template_id | uuid | FK → `exercise_templates(id)` `on delete set null` |
| ai_generation_log_id | uuid | FK → `ai_generation_log(id)` `on delete set null` |
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
- `ai_generation_log.study_plan_id` N:1 `study_plans.id`; `ai_generation_log.user_id` N:1 `profiles.id`.
- `review_sessions.study_plan_id` N:1 `study_plans.id`; `review_sessions.user_id` N:1 `profiles.id`.
- `review_sessions.exercise_template_id` N:1 `exercise_templates.id` (opcjonalnie).
- `review_sessions.ai_generation_log_id` N:1 `ai_generation_log.id` (grupowanie wygenerowanych powtórek).
- `review_session_feedback.review_session_id` N:1 `review_sessions.id`; `review_session_feedback.user_id` N:1 `profiles.id`.

3. Indeksy
- `idx_review_sessions_user_date` on `review_sessions(user_id, review_date desc)` (widok kalendarza).
- `idx_review_sessions_plan_status` on `review_sessions(study_plan_id, status)` (akceptacja/odrzucenie propozycji AI).
- `idx_study_plans_user_title` unique on `study_plans(user_id, lower(title))` (unikalne nazwy planów per użytkownik).
- `idx_exercise_templates_predefined_name` unique on `exercise_templates(lower(name)) where is_predefined`.
- `idx_ai_generation_log_plan_requested` on `ai_generation_log(study_plan_id, requested_at desc)`.
- `idx_review_session_feedback_session` on `review_session_feedback(review_session_id)`.

4. Zasady PostgreSQL (RLS)
- Włączyć RLS na `profiles`, `study_plans`, `exercise_templates`, `ai_generation_log`, `review_sessions`, `review_session_feedback`.
- Polityka `select/update/delete` na `profiles` ograniczona do `id = auth.uid()`.
- Polityka na `study_plans` ograniczająca wszystkie operacje do `user_id = auth.uid()`.
- Polityka na `exercise_templates` pozwalająca:
  - wszystkim uwierzytelnionym na odczyt rekordów `is_predefined = true`.
  - właścicielowi (`created_by = auth.uid()`) na odczyt, zapis i usuwanie własnych rekordów.
- Polityka na `ai_generation_log` z warunkiem `user_id = auth.uid()`.
- Polityka na `review_sessions` oraz `review_session_feedback` z warunkiem `user_id = auth.uid()`; dodatkowo pozwolenie na `select` rekordów powiązanych poprzez `study_plans.user_id = auth.uid()` (z widokiem lub `using` + `with check`).
- Domyślne polityki `with check` zapewniające, że nowe/aktualizowane rekordy posiadają `user_id = auth.uid()` lub inne wymagane klucze.

5. Dodatkowe uwagi lub wyjaśnienia
- Utrzymuj spójność `review_sessions.user_id` z `study_plans.user_id` na poziomie aplikacji lub poprzez trigger walidujący.
- `updated_at` może być odświeżany przy użyciu triggera `moddatetime`.
- `review_session_feedback` jest opcjonalny; można odłożyć implementację, jeśli analityka jakości nie jest potrzebna w MVP.
- Predefiniowane rekordy `exercise_templates` powinny być ładowane przez skrypt inicjalizacyjny po migracjach.
- Proces generowania planów AI powinien działać w transakcji, aktualizując `review_sessions.status` oraz `ai_generation_log.state` atomowo.

