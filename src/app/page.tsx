import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";
import CookieConsent from "@/components/cookie-consent";
import PublicFooter from "@/components/public-footer";
import { createClient } from "@/lib/supabase/server";

type ServiceRow = {
  id: string;
  name: string;
  service_group: string | null;
  is_online_bookable?: boolean | null;
};

type WorkingHourRow = {
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
};

const content = {
  hr: {
    otherLangLabel: "EN",
    otherLangHref: "/?lang=en",
    badge: "Profesionalna njega u opuštajućem ambijentu",
    navServices: "Usluge",
    navAbout: "O nama",
    navContact: "Kontakt",
    navBook: "Rezerviraj termin",
    heroTitle: "Ljepota, njega i mir na jednom mjestu.",
    heroText:
      "Body & Soul je salon posvećen individualnom pristupu, kvalitetnim tretmanima i ugodnom iskustvu od prvog dolaska do završetka tretmana.",
    primaryCta: "Rezerviraj termin",
    secondaryCta: "Kontaktiraj salon",
    quote:
      "Mjesto gdje se profesionalna njega spaja s opuštanjem i osjećajem potpune pažnje.",
    location: "Zagrebačka ul. 12, 52210 Rovinj",
    phone: "+385 99 328 4199",
    servicesEyebrow: "Usluge",
    servicesTitle: "Najtraženiji tretmani i online rezervacije",
    servicesText:
      "Izdvojili smo popularne usluge i usluge koje su dostupne za online rezervaciju. Za tretmane koji nisu ponuđeni online najbolje je direktno kontaktirati salon radi preporuke i dogovora.",
    onlineNote:
      "Napomena: online rezervacije nisu dostupne za sve usluge. Za ostale tretmane kontaktiraj salon direktno.",
    onlineBooking: "Online rezervacije",
    directContact: "Direktan kontakt",
    aboutEyebrow: "O nama",
    aboutTitle: "Salon u kojem je svaki tretman osobno iskustvo.",
    aboutText:
      "Body & Soul vodi Elizabeth Dobrović. Pristup svakom klijentu temelji se na pažnji, iskustvu i odabiru tretmana prema stvarnim potrebama. Cilj je da se nakon svakog dolaska osjećaš njegovano, opušteno i zadovoljno.",
    ownerLabel: "Vlasnica salona",
    contactEyebrow: "Kontakt",
    contactTitle: "Želiš rezervirati termin?",
    contactText:
      "Za online dostupne usluge možeš poslati zahtjev za rezervaciju. Za sve ostale tretmane ili dodatna pitanja kontaktiraj salon direktno.",
    openBooking: "Otvori online rezervacije",
    workingHoursFallback: "Radno vrijeme prema narudžbi",
    workingHoursLabel: "Radno vrijeme",
    bookableBadge: "Online",
  },
  en: {
    otherLangLabel: "HR",
    otherLangHref: "/?lang=hr",
    badge: "Professional care in a relaxing atmosphere",
    navServices: "Services",
    navAbout: "About",
    navContact: "Contact",
    navBook: "Book appointment",
    heroTitle: "Beauty, care and calm in one place.",
    heroText:
      "Body & Soul is a beauty salon focused on a personal approach, quality treatments and a relaxing experience from the first visit to the end of every treatment.",
    primaryCta: "Book appointment",
    secondaryCta: "Contact salon",
    quote:
      "A place where professional care meets relaxation and complete attention.",
    location: "Zagrebačka St. 12, 52210 Rovinj",
    phone: "+385 99 328 4199",
    servicesEyebrow: "Services",
    servicesTitle: "Most requested treatments and online booking",
    servicesText:
      "We have highlighted popular services and services available for online booking. For treatments that are not offered online, please contact the salon directly for advice and booking.",
    onlineNote:
      "Note: online booking is not available for all services. For other treatments, please contact the salon directly.",
    onlineBooking: "Online booking",
    directContact: "Direct contact",
    aboutEyebrow: "About",
    aboutTitle: "A salon where every treatment is a personal experience.",
    aboutText:
      "Body & Soul is run by Elizabeth Dobrović. Every client is approached with care, experience and a treatment recommendation based on real needs. The goal is for you to leave feeling cared for, relaxed and satisfied.",
    ownerLabel: "Salon owner",
    contactEyebrow: "Contact",
    contactTitle: "Would you like to book an appointment?",
    contactText:
      "For selected online services, you can send a booking request. For all other treatments or additional questions, please contact the salon directly.",
    openBooking: "Open online booking",
    workingHoursFallback: "Working hours by appointment",
    workingHoursLabel: "Working hours",
    bookableBadge: "Online",
  },
};

const serviceTranslations: Record<string, string> = {
  "Njega lica": "Facial care",
  Masaža: "Massage",
  Masaže: "Massages",
  Pedikura: "Pedicure",
  Manikura: "Manicure",
  Depilacija: "Waxing",
  "Trajna epilacija laserom": "Permanent laser hair removal",
  "Lice i obrve": "Face and eyebrows",
  "Njega ruku i nogu": "Hand and foot care",
  "Body program": "Body program",
  "Body programi": "Body programs",
  "Oblikovanje tijela": "Body shaping",
};

function translateServiceName(name: string, lang: "hr" | "en") {
  if (lang === "hr") return name;

  let translated = name;

  Object.entries(serviceTranslations).forEach(([hr, en]) => {
    translated = translated.replace(new RegExp(hr, "gi"), en);
  });

  return translated;
}

function translateServiceGroup(group: string | null, lang: "hr" | "en") {
  if (!group || lang === "hr") return group;
  return serviceTranslations[group] ?? group;
}

function getLang(searchParams?: { lang?: string | string[] }) {
  const rawLang = Array.isArray(searchParams?.lang)
    ? searchParams?.lang[0]
    : searchParams?.lang;

  return rawLang === "en" ? "en" : "hr";
}

function time(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function formatWorkingHours(
  rows: WorkingHourRow[] | null | undefined,
  lang: "hr" | "en",
  fallback: string,
) {
  if (!rows || rows.length === 0) return fallback;

  const sorted = [...rows].sort((a, b) => a.day_of_week - b.day_of_week);

  const labelsHr = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];
  const labelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labels = lang === "hr" ? labelsHr : labelsEn;

  const openRows = sorted.filter(
    (row) => !row.is_closed && row.opens_at && row.closes_at,
  );

  if (openRows.length === 0) return fallback;

  const grouped: string[] = [];
  let start = openRows[0];
  let previous = openRows[0];

  for (let i = 1; i <= openRows.length; i += 1) {
    const current = openRows[i];

    const sameHours =
      current &&
      current.opens_at === previous.opens_at &&
      current.closes_at === previous.closes_at &&
      current.day_of_week === previous.day_of_week + 1;

    if (sameHours) {
      previous = current;
      continue;
    }

    const dayLabel =
      start.day_of_week === previous.day_of_week
        ? labels[start.day_of_week]
        : `${labels[start.day_of_week]}-${labels[previous.day_of_week]}`;

    grouped.push(
      `${dayLabel} ${time(start.opens_at)}-${time(start.closes_at)}`,
    );

    if (current) {
      start = current;
      previous = current;
    }
  }

  return grouped.join(" · ");
}

function pickFeaturedServices(
  services: ServiceRow[] | null | undefined,
  appointments: { service_id: string | null }[] | null | undefined,
) {
  const rows = services ?? [];
  const counts = new Map<string, number>();

  (appointments ?? []).forEach((appointment) => {
    if (!appointment.service_id) return;
    counts.set(
      appointment.service_id,
      (counts.get(appointment.service_id) ?? 0) + 1,
    );
  });

  return [...rows]
    .sort((a, b) => {
      const aBookable = a.is_online_bookable ? 1 : 0;
      const bBookable = b.is_online_bookable ? 1 : 0;

      if (aBookable !== bBookable) return bBookable - aBookable;

      return (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
    })
    .slice(0, 8);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const lang = getLang(resolvedSearchParams);
  const t = content[lang];

  const supabase = await createClient();

  const [
    { data: allServices },
    { data: appointmentRows },
    { data: workingHours },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, service_group, is_online_bookable")
      .eq("is_active", true),

    supabase
      .from("appointments")
      .select("service_id")
      .in("status", ["scheduled", "completed"])
      .limit(500),

    supabase
      .from("salon_working_hours")
      .select("day_of_week, opens_at, closes_at, is_closed"),
  ]);

  const featuredServices = pickFeaturedServices(allServices, appointmentRows);
  const workingHoursText = formatWorkingHours(
    workingHours,
    lang,
    t.workingHoursFallback,
  );

  return (
    <main className="min-h-screen bg-[#f8f3ef] text-[#2f2723]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#e8cfc0,transparent_35%),radial-gradient(circle_at_bottom_left,#d8b6a4,transparent_30%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#9b6f5b]">
                Beauty salon
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Body & Soul
              </h1>
            </div>

            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <a href="#usluge" className="hover:text-[#9b6f5b]">
                {t.navServices}
              </a>
              <a href="#o-nama" className="hover:text-[#9b6f5b]">
                {t.navAbout}
              </a>
              <a href="#kontakt" className="hover:text-[#9b6f5b]">
                {t.navContact}
              </a>
              <Link
                href={`/booking?lang=${lang}`}
                className="rounded-full bg-[#2f2723] px-5 py-2.5 text-white transition hover:bg-[#4a3932]"
              >
                {t.navBook}
              </Link>
              <Link
                href={t.otherLangHref}
                className="rounded-full border border-[#c9a997] px-4 py-2 text-sm hover:bg-white/60"
              >
                {t.otherLangLabel}
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7b9a8] bg-white/60 px-4 py-2 text-sm text-[#7b594b] shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                {t.badge}
              </div>

              <h2 className="text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                {t.heroTitle}
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f5a50]">
                {t.heroText}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/booking?lang=${lang}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2723] px-7 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#4a3932]"
                >
                  <CalendarCheck className="h-5 w-5" />
                  {t.primaryCta}
                </Link>

                <a
                  href="#kontakt"
                  className="inline-flex items-center justify-center rounded-full border border-[#c9a997] bg-white/60 px-7 py-4 font-semibold text-[#2f2723] transition hover:bg-white"
                >
                  {t.secondaryCta}
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Image
                  src="/images/salon-1.jpg"
                  alt="Body & Soul salon"
                  width={500}
                  height={600}
                  className="h-64 rounded-[2rem] object-cover shadow-xl"
                  priority
                />
                <Image
                  src="/images/salon-2.jpg"
                  alt="Beauty salon treatment space"
                  width={500}
                  height={600}
                  className="mt-10 h-64 rounded-[2rem] object-cover shadow-xl"
                  priority
                />
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-2xl backdrop-blur">
                <div className="rounded-[1.5rem] bg-[#2f2723] p-8 text-white">
                  <div className="flex items-center gap-2 text-[#e8cfc0]">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>

                  <p className="mt-6 text-xl font-medium leading-relaxed">
                    “{t.quote}”
                  </p>

                  <div className="mt-8 grid gap-4 text-sm text-[#eadbd2]">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5" />
                      {workingHoursText}
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5" />
                      {t.location}
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5" />
                      {t.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pb-10 md:hidden">
            <Link
              href={t.otherLangHref}
              className="rounded-full border border-[#c9a997] px-4 py-2 text-sm hover:bg-white/60"
            >
              {t.otherLangLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <Image
          src="/images/salon-3.jpg"
          alt="Body & Soul ambience"
          width={1400}
          height={700}
          className="h-[420px] w-full rounded-[2rem] object-cover shadow-xl"
        />
      </section>

      <section id="usluge" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
            {t.servicesEyebrow}
          </p>
          <h3 className="mt-3 text-4xl font-semibold">{t.servicesTitle}</h3>
          <p className="mt-5 text-lg leading-8 text-[#6f5a50]">
            {t.servicesText}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-3xl border border-[#eadbd2] bg-white/70 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                {service.service_group ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9b6f5b]">
                    {translateServiceGroup(service.service_group, lang)}
                  </p>
                ) : null}

                {service.is_online_bookable ? (
                  <span className="rounded-full bg-[#2f2723] px-2.5 py-1 text-xs font-semibold text-white">
                    {t.bookableBadge}
                  </span>
                ) : null}
              </div>

              <h4 className="mt-3 text-lg font-semibold">
                {translateServiceName(service.name, lang)}
              </h4>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[#eadbd2] bg-white/70 p-6">
          <p className="leading-7 text-[#6f5a50]">{t.onlineNote}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/booking?lang=${lang}`}
              className="inline-flex justify-center rounded-full bg-[#2f2723] px-6 py-3 font-semibold text-white"
            >
              {t.onlineBooking}
            </Link>
            <a
              href="#kontakt"
              className="inline-flex justify-center rounded-full border border-[#c9a997] px-6 py-3 font-semibold text-[#2f2723]"
            >
              {t.directContact}
            </a>
          </div>
        </div>
      </section>

      <section id="o-nama" className="bg-white/60 px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[#eadbd2] bg-[#f8f3ef] p-3 shadow-xl">
            <Image
              src="/images/elizabeth.jpg"
              alt="Elizabeth Dobrović"
              width={700}
              height={800}
              className="h-[520px] w-full rounded-[1.5rem] object-cover"
            />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
              {t.aboutEyebrow}
            </p>
            <h3 className="mt-3 text-4xl font-semibold">{t.aboutTitle}</h3>
            <p className="mt-6 text-lg leading-9 text-[#6f5a50]">
              {t.aboutText}
            </p>

            <div className="mt-8 rounded-3xl border border-[#eadbd2] bg-white/70 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[#9b6f5b]">
                {t.ownerLabel}
              </p>
              <p className="mt-2 text-2xl font-semibold">Elizabeth Dobrović</p>
            </div>
          </div>
        </div>
      </section>

      <section id="kontakt" className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-[2rem] bg-[#2f2723] p-8 text-white md:p-12">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#e8cfc0]">
                {t.contactEyebrow}
              </p>
              <h3 className="mt-3 text-4xl font-semibold">{t.contactTitle}</h3>
              <p className="mt-5 leading-8 text-[#eadbd2]">{t.contactText}</p>
            </div>

            <div className="space-y-4 text-[#eadbd2]">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5" />
                <span>{t.location}</span>
              </p>
              <p className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5" />
                <a href="tel:+385993284199" className="hover:underline">
                  {t.phone}
                </a>
              </p>
              <p className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5" />
                <span>
                  {t.workingHoursLabel}: {workingHoursText}
                </span>
              </p>

              <Link
                href={`/booking?lang=${lang}`}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-7 py-4 font-semibold text-[#2f2723] transition hover:bg-[#eadbd2]"
              >
                {t.openBooking}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CookieConsent />
      <PublicFooter />
    </main>
  );
}
