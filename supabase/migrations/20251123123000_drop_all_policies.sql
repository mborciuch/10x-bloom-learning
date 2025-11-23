-- migration: drop all row level security policies from initial schema
-- warning: leaving row level security enabled without policies blocks access

drop policy if exists study_plans_select_authenticated on public.study_plans;
drop policy if exists study_plans_select_anon on public.study_plans;
drop policy if exists study_plans_insert_authenticated on public.study_plans;
drop policy if exists study_plans_insert_anon on public.study_plans;
drop policy if exists study_plans_update_authenticated on public.study_plans;
drop policy if exists study_plans_update_anon on public.study_plans;
drop policy if exists study_plans_delete_authenticated on public.study_plans;
drop policy if exists study_plans_delete_anon on public.study_plans;

drop policy if exists exercise_templates_select_authenticated on public.exercise_templates;
drop policy if exists exercise_templates_select_anon on public.exercise_templates;
drop policy if exists exercise_templates_insert_authenticated on public.exercise_templates;
drop policy if exists exercise_templates_insert_anon on public.exercise_templates;
drop policy if exists exercise_templates_update_authenticated on public.exercise_templates;
drop policy if exists exercise_templates_update_anon on public.exercise_templates;
drop policy if exists exercise_templates_delete_authenticated on public.exercise_templates;
drop policy if exists exercise_templates_delete_anon on public.exercise_templates;

drop policy if exists ai_generation_log_select_authenticated on public.ai_generation_log;
drop policy if exists ai_generation_log_select_anon on public.ai_generation_log;
drop policy if exists ai_generation_log_insert_authenticated on public.ai_generation_log;
drop policy if exists ai_generation_log_insert_anon on public.ai_generation_log;
drop policy if exists ai_generation_log_update_authenticated on public.ai_generation_log;
drop policy if exists ai_generation_log_update_anon on public.ai_generation_log;
drop policy if exists ai_generation_log_delete_authenticated on public.ai_generation_log;
drop policy if exists ai_generation_log_delete_anon on public.ai_generation_log;

drop policy if exists review_sessions_select_authenticated on public.review_sessions;
drop policy if exists review_sessions_select_anon on public.review_sessions;
drop policy if exists review_sessions_insert_authenticated on public.review_sessions;
drop policy if exists review_sessions_insert_anon on public.review_sessions;
drop policy if exists review_sessions_update_authenticated on public.review_sessions;
drop policy if exists review_sessions_update_anon on public.review_sessions;
drop policy if exists review_sessions_delete_authenticated on public.review_sessions;
drop policy if exists review_sessions_delete_anon on public.review_sessions;

drop policy if exists review_session_feedback_select_authenticated on public.review_session_feedback;
drop policy if exists review_session_feedback_select_anon on public.review_session_feedback;
drop policy if exists review_session_feedback_insert_authenticated on public.review_session_feedback;
drop policy if exists review_session_feedback_insert_anon on public.review_session_feedback;
drop policy if exists review_session_feedback_update_authenticated on public.review_session_feedback;
drop policy if exists review_session_feedback_update_anon on public.review_session_feedback;
drop policy if exists review_session_feedback_delete_authenticated on public.review_session_feedback;
drop policy if exists review_session_feedback_delete_anon on public.review_session_feedback;

alter table public.study_plans disable row level security;
alter table public.exercise_templates disable row level security;
alter table public.ai_generation_log disable row level security;
alter table public.review_sessions disable row level security;
alter table public.review_session_feedback disable row level security;

