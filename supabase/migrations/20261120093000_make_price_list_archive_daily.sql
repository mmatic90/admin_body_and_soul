begin;

alter table public.price_list_snapshots
  add column if not exists snapshot_date date;

update public.price_list_snapshots
set snapshot_date = (archived_at at time zone 'Europe/Zagreb')::date
where snapshot_date is null;

with ranked as (
  select
    id,
    row_number() over (
      partition by snapshot_date
      order by archived_at desc, published_at desc
    ) as rn
  from public.price_list_snapshots
)
delete from public.price_list_snapshots p
using ranked r
where p.id = r.id
  and r.rn > 1;

alter table public.price_list_snapshots
  alter column snapshot_date set not null;

create unique index if not exists price_list_snapshots_snapshot_date_uidx
  on public.price_list_snapshots (snapshot_date);

create index if not exists price_list_snapshots_snapshot_date_idx
  on public.price_list_snapshots (snapshot_date desc);

commit;
