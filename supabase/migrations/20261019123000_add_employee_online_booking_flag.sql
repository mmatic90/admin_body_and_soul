begin;

alter table public.employees
  add column if not exists is_online_bookable boolean not null default true;

comment on column public.employees.is_online_bookable is
  'Controls whether an active employee can be selected in public/online booking flows. Manual/admin appointment creation is unaffected.';

commit;
