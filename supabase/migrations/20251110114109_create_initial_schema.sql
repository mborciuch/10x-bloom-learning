-- migration: create initial bloom learning schema
-- description: create core study planning tables, supporting enums, indexes, triggers, and row level security policies
-- tables: public.study_plans, public.exercise_templates, public.ai_generation_log, public.review_sessions, public.review_session_feedback
-- enums: public.taxonomy_level, public.review_status, public.ai_generation_state
-- notes: ensure pgcrypto extension for uuid generation and document all security controls
-- simplified: exercise_templates are PREDEFINED ONLY (no user-created templates in MVP)

-- ensure pgcrypto extension is available for gen_random_uuid function usage
create extension if not exists "pgcrypto";

-- create enums representing bloom taxonomy levels, review statuses, and ai generation states
create type public.taxonomy_level as enum ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create');
create type public.review_status as enum ('proposed', 'accepted', 'rejected');
create type public.ai_generation_state as enum ('pending', 'succeeded', 'failed');

-- helper function to keep updated_at columns in sync with the current timestamp
create or replace function public.set_updated_at()
returns trigger
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- table describing user-authored study plans
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_material text not null,
  word_count integer not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- table storing PREDEFINED exercise templates (system-wide, no user ownership)
-- simplified for MVP: only admin/seed data can populate this table
create table if not exists public.exercise_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  default_taxonomy_level public.taxonomy_level,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- table logging ai generation requests and outcomes
create table if not exists public.ai_generation_log (
  id uuid primary key default gen_random_uuid(),
  study_plan_id uuid not null references public.study_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  model_name text,
  parameters jsonb not null,
  response jsonb,
  state public.ai_generation_state not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

-- table storing individual review sessions linked to study plans and templates
create table if not exists public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  study_plan_id uuid not null references public.study_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_template_id uuid references public.exercise_templates (id) on delete set null,
  ai_generation_log_id uuid references public.ai_generation_log (id) on delete set null,
  exercise_label text not null,
  review_date date not null,
  taxonomy_level public.taxonomy_level not null,
  status public.review_status not null default 'accepted',
  is_ai_generated boolean not null default false,
  is_completed boolean not null default false,
  completed_at timestamptz,
  status_changed_at timestamptz not null default now(),
  content jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- optional feedback captured for review sessions
create table if not exists public.review_session_feedback (
  id uuid primary key default gen_random_uuid(),
  review_session_id uuid not null references public.review_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create trigger set_study_plans_updated_at
before update on public.study_plans
for each row
execute function public.set_updated_at();

create trigger set_exercise_templates_updated_at
before update on public.exercise_templates
for each row
execute function public.set_updated_at();

create trigger set_review_sessions_updated_at
before update on public.review_sessions
for each row
execute function public.set_updated_at();

-- indexes supporting frequent lookup patterns
create index idx_review_sessions_user_date on public.review_sessions (user_id, review_date desc);
create index idx_review_sessions_plan_status on public.review_sessions (study_plan_id, status);
create unique index idx_study_plans_user_title on public.study_plans (user_id, lower(title));
create index idx_ai_generation_log_plan_requested on public.ai_generation_log (study_plan_id, requested_at desc);
create index idx_review_session_feedback_session on public.review_session_feedback (review_session_id);

alter table public.study_plans enable row level security;
alter table public.exercise_templates enable row level security;
alter table public.ai_generation_log enable row level security;
alter table public.review_sessions enable row level security;
alter table public.review_session_feedback enable row level security;

-- row level security policies for table public.study_plans
create policy study_plans_select_authenticated on public.study_plans
  for select
  to authenticated
  using (user_id = auth.uid());

create policy study_plans_select_anon on public.study_plans
  for select
  to anon
  using (false);

create policy study_plans_insert_authenticated on public.study_plans
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy study_plans_insert_anon on public.study_plans
  for insert
  to anon
  with check (false);

create policy study_plans_update_authenticated on public.study_plans
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy study_plans_update_anon on public.study_plans
  for update
  to anon
  using (false)
  with check (false);

create policy study_plans_delete_authenticated on public.study_plans
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy study_plans_delete_anon on public.study_plans
  for delete
  to anon
  using (false);

-- row level security policies for table public.exercise_templates
-- SIMPLIFIED: all authenticated users can read predefined templates, no INSERT/UPDATE/DELETE for users
create policy exercise_templates_select_authenticated on public.exercise_templates
  for select
  to authenticated
  using (is_active = true);

create policy exercise_templates_select_anon on public.exercise_templates
  for select
  to anon
  using (false);

-- No user INSERT/UPDATE/DELETE policies - only service role can manage templates

-- row level security policies for table public.ai_generation_log
create policy ai_generation_log_select_authenticated on public.ai_generation_log
  for select
  to authenticated
  using (user_id = auth.uid());

create policy ai_generation_log_select_anon on public.ai_generation_log
  for select
  to anon
  using (false);

create policy ai_generation_log_insert_authenticated on public.ai_generation_log
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy ai_generation_log_insert_anon on public.ai_generation_log
  for insert
  to anon
  with check (false);

create policy ai_generation_log_update_authenticated on public.ai_generation_log
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy ai_generation_log_update_anon on public.ai_generation_log
  for update
  to anon
  using (false)
  with check (false);

create policy ai_generation_log_delete_authenticated on public.ai_generation_log
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy ai_generation_log_delete_anon on public.ai_generation_log
  for delete
  to anon
  using (false);

-- row level security policies for table public.review_sessions
create policy review_sessions_select_authenticated on public.review_sessions
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.study_plans sp
      where sp.id = study_plan_id
        and sp.user_id = auth.uid()
    )
  );

create policy review_sessions_select_anon on public.review_sessions
  for select
  to anon
  using (false);

create policy review_sessions_insert_authenticated on public.review_sessions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.study_plans sp
      where sp.id = study_plan_id
        and sp.user_id = auth.uid()
    )
  );

create policy review_sessions_insert_anon on public.review_sessions
  for insert
  to anon
  with check (false);

create policy review_sessions_update_authenticated on public.review_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.study_plans sp
      where sp.id = study_plan_id
        and sp.user_id = auth.uid()
    )
  );

create policy review_sessions_update_anon on public.review_sessions
  for update
  to anon
  using (false)
  with check (false);

create policy review_sessions_delete_authenticated on public.review_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy review_sessions_delete_anon on public.review_sessions
  for delete
  to anon
  using (false);

-- row level security policies for table public.review_session_feedback
create policy review_session_feedback_select_authenticated on public.review_session_feedback
  for select
  to authenticated
  using (user_id = auth.uid());

create policy review_session_feedback_select_anon on public.review_session_feedback
  for select
  to anon
  using (false);

create policy review_session_feedback_insert_authenticated on public.review_session_feedback
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy review_session_feedback_insert_anon on public.review_session_feedback
  for insert
  to anon
  with check (false);

create policy review_session_feedback_update_authenticated on public.review_session_feedback
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy review_session_feedback_update_anon on public.review_session_feedback
  for update
  to anon
  using (false)
  with check (false);

create policy review_session_feedback_delete_authenticated on public.review_session_feedback
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy review_session_feedback_delete_anon on public.review_session_feedback
  for delete
  to anon
  using (false);

