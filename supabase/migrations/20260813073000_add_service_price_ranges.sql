begin;

alter table public.services
  add column if not exists price_min_cents integer,
  add column if not exists price_max_cents integer;

alter table public.services
  drop constraint if exists services_price_min_nonnegative,
  drop constraint if exists services_price_max_nonnegative,
  drop constraint if exists services_price_range_complete,
  drop constraint if exists services_price_range_order;

alter table public.services
  add constraint services_price_min_nonnegative
    check (price_min_cents is null or price_min_cents >= 0),
  add constraint services_price_max_nonnegative
    check (price_max_cents is null or price_max_cents >= 0),
  add constraint services_price_range_complete
    check (
      (price_min_cents is null and price_max_cents is null)
      or
      (price_min_cents is not null and price_max_cents is not null)
    ),
  add constraint services_price_range_order
    check (
      price_min_cents is null
      or price_max_cents is null
      or price_max_cents >= price_min_cents
    );

comment on column public.services.price_min_cents is
  'Optional minimum price in cents for services with a price range.';
comment on column public.services.price_max_cents is
  'Optional maximum price in cents for services with a price range.';

commit;
