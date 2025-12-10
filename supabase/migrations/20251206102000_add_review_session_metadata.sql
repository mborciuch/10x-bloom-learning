-- migration: add review session metadata
-- description: stores edit tracking flags for AI quality metrics

alter table if exists public.review_sessions
add column if not exists metadata jsonb not null default '{}'::jsonb;



