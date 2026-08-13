begin;

-- Price ranges are currently used only for Gel Extensions.
update public.services
set
  price_min_cents = null,
  price_max_cents = null
where price_min_cents is not null
   or price_max_cents is not null;

-- Configure Gel Extensions price range and localized descriptions.
update public.services
set
  name = 'Gel ekstenzije',
  name_en = 'Gel Extensions',
  description = 'Nadogradnja noktiju gelom za uredan i dugotrajan izgled. Cijena ovisi o odabranoj dužini nokta.',
  description_en = 'Gel nail extensions for a neat, long-lasting finish. The final price depends on the selected nail length.',
  price_cents = null,
  price_min_cents = 5000,
  price_max_cents = 6500
where lower(trim(coalesce(name_en, ''))) = 'gel extensions'
   or lower(trim(coalesce(name, ''))) in ('gel extensions', 'gel ekstenzije', 'gel nadogradnja', 'nadogradnja gelom');

commit;
