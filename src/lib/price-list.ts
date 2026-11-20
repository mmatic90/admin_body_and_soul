import { createAdminClient } from "@/lib/supabase/admin";
import { PRICE_LIST_CONFIG } from "@/config/price-list";

export type PriceListServiceRow = {
  id: string;
  name: string;
  service_group: string | null;
  display_order: number | null;
  price_cents: number | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  base_price_cents: number | null;
  base_price_min_cents: number | null;
  base_price_max_cents: number | null;
  special_sale_name: string | null;
};

export type PriceListPublication = {
  published_at: string;
  storage_number: number;
};

const PRICE_LIST_SELECT = `
  id,
  name,
  service_group,
  display_order,
  price_cents,
  price_min_cents,
  price_max_cents,
  base_price_cents,
  base_price_min_cents,
  base_price_max_cents,
  special_sale_name
`;

export async function getCurrentPriceListServices() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("services")
    .select(PRICE_LIST_SELECT)
    .eq("is_active", true)
    .order("service_group", { ascending: true })
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PriceListServiceRow[];
}

export async function getPriceListPublication(): Promise<PriceListPublication> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("price_list_publication")
    .select("published_at, storage_number")
    .eq("id", 1)
    .single();

  if (error) throw new Error(error.message);
  return data as PriceListPublication;
}

export async function getRecentPriceListSnapshots() {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("price_list_snapshots")
    .select("id, published_at, storage_number, archived_at")
    .gte("archived_at", cutoff)
    .order("archived_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPriceListSnapshot(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("price_list_snapshots")
    .select("id, published_at, storage_number, services, archived_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function archiveCurrentPriceList() {
  const supabase = createAdminClient();

  const [{ data: publication, error: publicationError }, { data: services, error: servicesError }] =
    await Promise.all([
      supabase
        .from("price_list_publication")
        .select("published_at, storage_number")
        .eq("id", 1)
        .single(),
      supabase
        .from("services")
        .select(PRICE_LIST_SELECT)
        .eq("is_active", true)
        .order("service_group", { ascending: true })
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true }),
    ]);

  if (publicationError) throw new Error(publicationError.message);
  if (servicesError) throw new Error(servicesError.message);

  if ((services ?? []).length === 0) return;

  const { error } = await supabase.from("price_list_snapshots").insert({
    published_at: publication.published_at,
    storage_number: publication.storage_number,
    services,
  });

  if (error) throw new Error(error.message);
}

export async function markPriceListPublished() {
  const supabase = createAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("price_list_publication")
    .select("storage_number")
    .eq("id", 1)
    .single();

  if (currentError) throw new Error(currentError.message);

  const { error } = await supabase
    .from("price_list_publication")
    .update({
      published_at: new Date().toISOString(),
      storage_number: Number(current.storage_number ?? 0) + 1,
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
}

export function formatPrice(
  fixed: number | null,
  min: number | null,
  max: number | null,
  locale: "hr-HR" | "en-IE" = "hr-HR",
) {
  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });

  if (fixed != null) return currency.format(fixed / 100);
  if (min != null && max != null) {
    return `${currency.format(min / 100)} – ${currency.format(max / 100)}`;
  }
  return null;
}

function csvEscape(value: string) {
  if (!/[;"\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildPriceListCsv(rows: PriceListServiceRow[]) {
  const header = [
    "Naziv usluge",
    "Maloprodajna cijena i posebni oblik prodaje",
    "Bazna cijena",
  ].join(";");

  const body = rows.map((row) => {
    const retail = formatPrice(
      row.price_cents,
      row.price_min_cents,
      row.price_max_cents,
    ) ?? "";

    const retailWithSale = row.special_sale_name?.trim()
      ? `${retail} (posebni oblik prodaje: ${row.special_sale_name.trim()})`
      : retail;

    const base =
      formatPrice(
        row.base_price_cents,
        row.base_price_min_cents,
        row.base_price_max_cents,
      ) ?? "";

    return [
      csvEscape(row.name),
      csvEscape(retailWithSale),
      csvEscape(base),
    ].join(";");
  });

  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}

function zagrebTimestamp(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}${map.month}${map.day}_${map.hour}${map.minute}`;
}

export function buildPriceListFilename(publication: PriceListPublication) {
  const storage = String(publication.storage_number).padStart(4, "0");
  const timestamp = zagrebTimestamp(publication.published_at);

  return [
    PRICE_LIST_CONFIG.businessId,
    PRICE_LIST_CONFIG.locationType,
    PRICE_LIST_CONFIG.addressSlug,
    PRICE_LIST_CONFIG.locationCode,
    "USLUGE",
    storage,
    timestamp,
  ].join("_") + ".csv";
}
