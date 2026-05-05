import Link from "next/link";
import { CalendarCheck, Clock, Languages, Phone } from "lucide-react";
import { getOnlineBookableServices } from "@/features/public-booking/queries";
import BookingClient from "./booking-client";
import CookieConsent from "@/components/cookie-consent";
import PublicFooter from "@/components/public-footer";

function getLang(searchParams?: { lang?: string | string[] }) {
  const rawLang = Array.isArray(searchParams?.lang)
    ? searchParams?.lang[0]
    : searchParams?.lang;

  return rawLang === "en" ? "en" : "hr";
}

const content = {
  hr: {
    back: "← Povratak na početnu",
    eyebrow: "Online rezervacije",
    title: "Pošalji zahtjev za termin",
    intro:
      "Odaberi uslugu, datum i slobodan sat. Salon će provjeriti zahtjev i poslati ti SMS potvrdu ili povratnu informaciju.",
    note: "Prikazane su samo usluge koje je salon označio kao dostupne za online rezervaciju. Za ostale tretmane kontaktiraj salon direktno.",
    noServices:
      "Trenutno nema usluga dostupnih za online rezervaciju. Molimo kontaktiraj salon direktno.",
    contact: "Kontakt salona",
    phone: "+385 99 328 4199",
    workingHours: "Radno vrijeme prema narudžbi",
    switchLabel: "English",
    switchHref: "/booking?lang=en",
  },
  en: {
    back: "← Back to homepage",
    eyebrow: "Online booking",
    title: "Send an appointment request",
    intro:
      "Choose a service, date and available time. The salon will review your request and send you an SMS confirmation or feedback.",
    note: "Only services marked as available for online booking are shown. For other treatments, please contact the salon directly.",
    noServices:
      "There are currently no services available for online booking. Please contact the salon directly.",
    contact: "Salon contact",
    phone: "+385 99 328 4199",
    workingHours: "Working hours by appointment",
    switchLabel: "Hrvatski",
    switchHref: "/booking?lang=hr",
  },
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const lang = getLang(resolvedSearchParams);
  const t = content[lang];

  const services = await getOnlineBookableServices();

  return (
    <main className="min-h-screen bg-[#f8f3ef] px-6 py-10 text-[#2f2723]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/?lang=${lang}`}
            className="text-sm font-medium text-[#9b6f5b]"
          >
            {t.back}
          </Link>

          <Link
            href={t.switchHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8b6a4] bg-white/70 px-4 py-2 text-sm font-semibold text-[#2f2723] transition hover:bg-white"
          >
            <Languages className="h-4 w-4" />
            {t.switchLabel}
          </Link>
        </div>

        <section className="mt-10 overflow-hidden rounded-[2rem] bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="bg-[#2f2723] p-8 text-white md:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-[#eadbd2]">
                <CalendarCheck className="h-4 w-4" />
                {t.eyebrow}
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
                {t.title}
              </h1>

              <p className="mt-5 leading-8 text-[#eadbd2]">{t.intro}</p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm leading-7 text-[#eadbd2]">{t.note}</p>
              </div>

              <div className="mt-8 space-y-4 text-sm text-[#eadbd2]">
                <p className="font-semibold text-white">{t.contact}</p>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <a href="tel:+385993284199" className="hover:underline">
                    {t.phone}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" />
                  {t.workingHours}
                </div>
              </div>
            </aside>

            <div className="p-6 md:p-10">
              {services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8b6a4] bg-[#f8f3ef] p-6 text-sm text-[#6f5a50]">
                  {t.noServices}
                </div>
              ) : (
                <BookingClient services={services} lang={lang} />
              )}
            </div>
          </div>
        </section>
      </div>

      <CookieConsent />
      <PublicFooter />
    </main>
  );
}
