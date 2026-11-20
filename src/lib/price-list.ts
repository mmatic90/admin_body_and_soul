import { createAdminClient } from "@/lib/supabase/admin";
import { PRICE_LIST_CONFIG } from "@/config/price-list";

export type PriceListServiceRow = {
  id: string;
  name: string;
  name_en: string | null;
  service_group: string | null;
  service_group_en: string | null;
  display_order: number | null;
  price_cents: number | null;
  base_price_cents: number | null;
  special_sale_name: string | null;
};

export type PriceListPublication = {
  published_at: string;
  storage_number: number;
};

const PRICE_LIST_SELECT = `
  id,
  name,
  name_en,
  service_group,
  service_group_en,
  display_order,
  price_cents,
  base_price_cents,
  special_sale_name
`;

function getCroatiaDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export async function getCurrentPriceListServices() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("services")
    .select(PRICE_LIST_SELECT)
    .eq("is_active", true)
    .not("price_cents", "is", null)
    .not("base_price_cents", "is", null)
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
  const cutoffDate = getCroatiaDate(
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  );

  const { data, error } = await supabase
    .from("price_list_snapshots")
    .select("id, snapshot_date, published_at, storage_number, archived_at")
    .gte("snapshot_date", cutoffDate)
    .order("snapshot_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPriceListSnapshot(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("price_list_snapshots")
    .select(
      "id, snapshot_date, published_at, storage_number, services, archived_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function saveDailyPriceListSnapshot(publication: PriceListPublication) {
  const supabase = createAdminClient();

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(PRICE_LIST_SELECT)
    .eq("is_active", true)
    .not("price_cents", "is", null)
    .not("base_price_cents", "is", null)
    .order("service_group", { ascending: true })
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (servicesError) throw new Error(servicesError.message);

  const snapshotDate = getCroatiaDate(new Date(publication.published_at));

  const { error } = await supabase.from("price_list_snapshots").upsert(
    {
      snapshot_date: snapshotDate,
      published_at: publication.published_at,
      storage_number: publication.storage_number,
      services: services ?? [],
      archived_at: new Date().toISOString(),
    },
    { onConflict: "snapshot_date" },
  );

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

  const publication: PriceListPublication = {
    published_at: new Date().toISOString(),
    storage_number: Number(current.storage_number ?? 0) + 1,
  };

  const { error } = await supabase
    .from("price_list_publication")
    .update(publication)
    .eq("id", 1);

  if (error) throw new Error(error.message);

  await saveDailyPriceListSnapshot(publication);
}

export function formatPrice(
  cents: number | null,
  locale: "hr-HR" | "en-IE" = "hr-HR",
) {
  if (cents == null) return null;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
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

  const body = rows
    .filter(
      (row) => row.price_cents !== null && row.base_price_cents !== null,
    )
    .map((row) => {
      const retail = formatPrice(row.price_cents) ?? "";
      const retailWithSale = row.special_sale_name?.trim()
        ? `${retail} (posebni oblik prodaje: ${row.special_sale_name.trim()})`
        : retail;
      const base = formatPrice(row.base_price_cents) ?? "";

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
