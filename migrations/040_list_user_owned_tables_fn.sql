-- L-V392 P1-2: dynamic source of truth for "which tables hold a user's data",
-- so GDPR export/delete can never drift from the schema again.
-- Applied to prod via MCP apply_migration 2026-06-05.
-- security invoker; execute restricted to service_role (never anon/authenticated).
create or replace function public.list_user_owned_tables()
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  select c.table_name
  from information_schema.columns c
  where c.table_schema = 'public' and c.column_name = 'user_id'
  order by c.table_name;
$$;
revoke all on function public.list_user_owned_tables() from public;
grant execute on function public.list_user_owned_tables() to service_role;
