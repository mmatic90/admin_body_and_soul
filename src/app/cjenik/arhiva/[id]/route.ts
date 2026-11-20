import {
  buildPriceListCsv,
  buildPriceListFilename,
  getPriceListSnapshot,
  type PriceListServiceRow,
} from "@/lib/price-list";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const snapshot = await getPriceListSnapshot(id);

  if (!snapshot) {
    return new Response("Cjenik nije pronađen.", { status: 404 });
  }

  const rows = Array.isArray(snapshot.services)
    ? (snapshot.services as unknown as PriceListServiceRow[])
    : [];

  const csv = buildPriceListCsv(rows);
  const filename = buildPriceListFilename({
    published_at: snapshot.published_at,
    storage_number: snapshot.storage_number,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
