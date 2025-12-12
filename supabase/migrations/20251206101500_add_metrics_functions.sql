-- migration: metrics helper functions
-- description: aggregate AI usage metrics via single RPC-friendly query

create or replace function public.get_ai_usage_metrics(p_user_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total', count(*)::bigint,
    'ai_generated', count(*) filter (where is_ai_generated)::bigint,
    'manual', count(*) filter (where not is_ai_generated)::bigint
  )
  into result
  from public.review_sessions
  where user_id = p_user_id;

  if result is null then
    result := jsonb_build_object(
      'total', 0,
      'ai_generated', 0,
      'manual', 0
    );
  end if;

  return result;
end;
$$;




