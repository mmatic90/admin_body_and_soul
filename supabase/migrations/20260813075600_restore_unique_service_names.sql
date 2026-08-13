begin;

-- Keep semantically similar legacy services distinct so the human-readable
-- service name can remain unique without deleting any historical service IDs.

update public.services
set
  name = 'Bikini linija',
  name_en = 'Bikini Line Waxing'
where id = 'f260a358-7b93-4671-9cba-8ab8c2d558d1';

update public.services
set
  name = 'Pazusi – depilacija voskom',
  name_en = 'Underarm Waxing'
where id = '7dc7e0b8-3857-451a-af00-69067d18a5c4';

update public.services
set
  name = 'Nadusnica – depilacija voskom',
  name_en = 'Upper Lip Waxing'
where id = 'a4122728-1f54-44ec-bf6b-e55d1facfd06';

-- Fail clearly if any other duplicate names remain after normalization.
do $$
begin
  if exists (
    select 1
    from public.services
    group by name
    having count(*) > 1
  ) then
    raise exception 'Duplicate service names remain after catalog normalization. Run the duplicate-name check before restoring services_name_key.';
  end if;
end $$;

alter table public.services
  add constraint services_name_key unique (name);

commit;
