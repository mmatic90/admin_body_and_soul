begin;

-- The catalog normalization renames several legacy services. Some of the
-- target names temporarily collide with existing legacy names while the
-- bulk update is running, so remove the old uniqueness constraint first.
-- A follow-up migration restores uniqueness after the duplicate legacy
-- labels have been given distinct, user-friendly Croatian names.

alter table public.services
  drop constraint if exists services_name_key;

commit;
