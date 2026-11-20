do $$
begin
  if exists (
    select 1
    from public.services
    where price_cents is null
      and (price_min_cents is not null or price_max_cents is not null)
  ) then
    raise exception
      'Price range cleanup blocked: assign one fixed price_cents value to every service that still uses min/max pricing.';
  end if;
end
$$;

alter table public.services
  drop column if exists price_min_cents,
  drop column if exists price_max_cents;
