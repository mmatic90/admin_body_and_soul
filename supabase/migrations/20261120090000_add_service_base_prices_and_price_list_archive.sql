begin;

alter table public.services
  add column if not exists base_price_cents integer,
  add column if not exists base_price_min_cents integer,
  add column if not exists base_price_max_cents integer,
  add column if not exists base_price_reference_date date default date '2026-09-10',
  add column if not exists special_sale_name text;

create table if not exists public.price_list_publication (
  id smallint primary key default 1 check (id = 1),
  published_at timestamptz not null default now(),
  storage_number integer not null default 1 check (storage_number > 0)
);

insert into public.price_list_publication (id, published_at, storage_number)
values (1, now(), 1)
on conflict (id) do nothing;

create table if not exists public.price_list_snapshots (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null,
  storage_number integer not null,
  services jsonb not null,
  archived_at timestamptz not null default now()
);

create index if not exists price_list_snapshots_archived_at_idx
  on public.price_list_snapshots (archived_at desc);

alter table public.price_list_publication enable row level security;
alter table public.price_list_snapshots enable row level security;

comment on column public.services.base_price_reference_date is
  'Internal reference date used to establish the base price. Do not display the date in the published price list.';
comment on column public.services.special_sale_name is
  'Name of the special form of sale, when the current retail price is applied as part of one.';

commit;
