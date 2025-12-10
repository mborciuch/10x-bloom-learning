-- migration: ai quality metrics rpc helper
-- description: aggregates generated, accepted and edited sessions per plan

create or replace function public.get_ai_quality_metrics(
  p_user_id uuid,
  p_study_plan_id uuid default null
)
returns table (
  study_plan_id uuid,
  generated bigint,
  accepted bigint,
  edited bigint
)
language sql
stable
as $$
  select
    study_plan_id,
    count(*) filter (where is_ai_generated) as generated,
    count(*) filter (where is_ai_generated and status = 'accepted') as accepted,
    count(*) filter (
      where is_ai_generated
        and status = 'accepted'
        and coalesce(metadata->>'edited', 'false') = 'true'
    ) as edited
  from public.review_sessions
  where user_id = p_user_id
    and (p_study_plan_id is null or study_plan_id = p_study_plan_id)
  group by study_plan_id
  order by study_plan_id;
$$;



