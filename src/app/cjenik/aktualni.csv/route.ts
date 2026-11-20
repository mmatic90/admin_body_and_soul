import {
  buildPriceListCsv,
  buildPriceListFilename,
  getCurrentPriceListServices,
  getPriceListPublication,
} from "@/lib/price-list";

export const dynamic = "force-dynamic";

export async function GET() {
  const [rows, publication] = await Promise.all([
    getCurrentPriceListServices(),
    getPriceListPublication(),
  ]);

  const csv = buildPriceListCsv(rows);
  const filename = buildPriceListFilename(publication);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex",
    },
  });
}
