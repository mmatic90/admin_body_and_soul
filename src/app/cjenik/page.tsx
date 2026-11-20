import Link from "next/link";
import { Download, FileClock } from "lucide-react";
import PublicFooter from "@/components/public-footer";
import CookieConsent from "@/components/cookie-consent";
import {
  formatPrice,
  getCurrentPriceListServices,
  getPriceListPublication,
  getRecentPriceListSnapshots,
} from "@/lib/price-list";

type Lang = "hr" | "en";

const copy = {
  hr: {
    back: "← Povratak na početnu",
    title: "Cjenik usluga",
    intro:
      "Aktualne maloprodajne i bazne cijene usluga Body & Soul salona.",
    current: "Aktualna cijena",
    base: "Bazna cijena",
    special: "Posebni oblik prodaje",
    download: "Preuzmi aktualni cjenik (CSV)",
    archive: "Arhiva cjenika",
    archiveText:
      "Prethodne verzije cjenika dostupne su najmanje 15 dana nakon zamjene novom verzijom.",
    published: "Objavljeno",
    noArchive: "Trenutno nema arhivskih verzija cjenika.",
    unavailable: "—",
    lang: "EN",
    langHref: "/cjenik?lang=en",
  },
  en: {
    back: "← Back to homepage",
    title: "Service price list",
    intro:
      "Current retail and base prices for Body & Soul salon services.",
    current: "Current price",
    base: "Base price",
    special: "Special form of sale",
    download: "Download current price list (CSV)",
    archive: "Price list archive",
    archiveText:
      "Previous price-list versions remain available for at least 15 days after replacement.",
    published: "Published",
    noArchive: "There are currently no archived price lists.",
    unavailable: "—",
    lang: "HR",
    langHref: "/cjenik?lang=hr",
  },
};

function getLang(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "en" ? "en" : "hr";
}

function formatPublished(value: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "hr-HR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Zagreb",
  }).format(new Date(value));
}

function formatArchiveDate(value: string, lang: Lang) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "hr-HR", {
    dateStyle: "medium",
  }).format(new Date(year, month - 1, day));
}

export const dynamic = "force-dynamic";

export default async function PriceListPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await searchParams;
  const lang = getLang(resolved?.lang);
  const t = copy[lang];

  const [services, publication, snapshots] = await Promise.all([
    getCurrentPriceListServices(),
    getPriceListPublication(),
    getRecentPriceListSnapshots(),
  ]);

  const grouped = new Map<string, typeof services>();
  for (const service of services) {
    const group =
      (lang === "en"
        ? service.service_group_en?.trim() || service.service_group?.trim()
        : service.service_group?.trim()) || (lang === "en" ? "Other" : "Ostalo");
    const current = grouped.get(group) ?? [];
    current.push(service);
    grouped.set(group, current);
  }

  return (
    <main className="min-h-screen bg-[#f8f3ef] text-[#2f2723]">
      <div className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={lang === "en" ? "/?lang=en" : "/"} className="text-sm font-medium text-[#9b6f5b]">
            {t.back}
          </Link>
          <Link href={t.langHref} className="rounded-full border border-[#c9a997] px-4 py-2 text-sm font-semibold">
            {t.lang}
          </Link>
        </div>

        <section className="mt-10 rounded-[2rem] bg-[#2f2723] p-8 text-white md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#e8cfc0]">
            Body & Soul
          </p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{t.title}</h1>
          <p className="mt-5 max-w-3xl leading-8 text-[#eadbd2]">{t.intro}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/cjenik/aktualni.csv"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[#2f2723]"
            >
              <Download className="h-4 w-4" />
              {t.download}
            </a>
            <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-3 text-sm text-[#eadbd2]">
              {t.published}: {formatPublished(publication.published_at, lang)}
            </span>
          </div>
        </section>

        <div className="mt-10 space-y-8">
          {[...grouped.entries()].map(([group, rows]) => (
            <section key={group} className="overflow-hidden rounded-[1.75rem] border border-[#eadbd2] bg-white shadow-sm">
              <div className="border-b border-[#eadbd2] bg-[#fffaf7] px-6 py-4">
                <h2 className="text-xl font-semibold">{group}</h2>
              </div>

              <div className="divide-y divide-[#eadbd2]">
                {rows.map((service) => {
                  const current = formatPrice(
                    service.price_cents,
                    lang === "en" ? "en-IE" : "hr-HR",
                  );
                  const base = formatPrice(
                    service.base_price_cents,
                    lang === "en" ? "en-IE" : "hr-HR",
                  );
                  const name =
                    lang === "en" && service.name_en?.trim()
                      ? service.name_en
                      : service.name;

                  return (
                    <div key={service.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_180px_180px] md:items-center">
                      <div>
                        <h3 className="font-semibold">{name}</h3>
                        {service.special_sale_name?.trim() ? (
                          <p className="mt-1 text-sm text-[#9b6f5b]">
                            {t.special}: {service.special_sale_name}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#8b776d]">{t.current}</p>
                        <p className="mt-1 text-lg font-semibold">{current ?? t.unavailable}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#8b776d]">{t.base}</p>
                        <p className="mt-1 text-lg font-semibold">{base ?? t.unavailable}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-[1.75rem] border border-[#eadbd2] bg-white p-6 md:p-8">
          <div className="flex items-start gap-3">
            <FileClock className="mt-1 h-5 w-5 shrink-0 text-[#9b6f5b]" />
            <div>
              <h2 className="text-xl font-semibold">{t.archive}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f5a50]">{t.archiveText}</p>
            </div>
          </div>

          {snapshots.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {snapshots.map((snapshot) => (
                <a
                  key={snapshot.id}
                  href={`/cjenik/arhiva/${snapshot.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadbd2] px-4 py-3 transition hover:bg-[#fffaf7]"
                >
                  <span className="text-sm font-medium">
                    {formatArchiveDate(snapshot.archive_date, lang)}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#9b6f5b]">
                    <Download className="h-4 w-4" /> CSV
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#6f5a50]">{t.noArchive}</p>
          )}
        </section>
      </div>

      <PublicFooter />
      <CookieConsent />
    </main>
  );
}
