begin;

alter table public.online_booking_requests enable row level security;

revoke all privileges on table public.online_booking_requests from anon;

-- Remove any policies that explicitly grant access to anonymous or public roles.
-- Authenticated/admin policies are preserved.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'online_booking_requests'
      and (
        'anon' = any (roles)
        or 'public' = any (roles)
      )
  loop
    execute format(
      'drop policy if exists %I on public.online_booking_requests',
      policy_record.policyname
    );
  end loop;
end
$$;

commit;
