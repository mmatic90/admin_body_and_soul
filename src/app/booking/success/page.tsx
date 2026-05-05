"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type Lang = "hr" | "en";

const content = {
  hr: {
    status: "Zahtjev poslan",
    title: "Hvala na rezervaciji ✨",
    text: "Vaš zahtjev za rezervaciju je uspješno poslan. Salon će provjeriti dostupnost termina i poslati vam potvrdu ili povratnu informaciju.",
    smsNote:
      "SMS potvrde šalju se samo na hrvatske brojeve. Ako nemate hrvatski broj, molimo unesite email kako bismo vam potvrdu mogli poslati emailom.",
    details: "Detalji zahtjeva",
    service: "Usluga",
    date: "Datum",
    time: "Vrijeme",
    redirect: "Automatski povratak na početnu stranicu za 10 sekundi.",
    home: "Povratak na početnu",
    newBooking: "Nova rezervacija",
  },
  en: {
    status: "Request sent",
    title: "Thank you for your booking ✨",
    text: "Your booking request has been sent successfully. The salon will review the appointment availability and send you a confirmation or feedback.",
    smsNote:
      "SMS notifications are available only for Croatian phone numbers. If you do not have a Croatian number, please enter your email so we can send the appointment confirmation by email.",
    details: "Request details",
    service: "Service",
    date: "Date",
    time: "Time",
    redirect: "You will be redirected to the homepage in 10 seconds.",
    home: "Back to homepage",
    newBooking: "New booking",
  },
};

function getLang(value: string | null): Lang {
  return value === "en" ? "en" : "hr";
}

function formatDate(date: string | null, lang: Lang) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;

  return lang === "en" ? `${day}/${month}/${year}` : `${day}.${month}.${year}.`;
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = getLang(searchParams.get("lang"));
  const t = content[lang];

  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const service = searchParams.get("service");

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/?lang=${lang}`);
    }, 10000);

    return () => clearTimeout(timer);
  }, [router, lang]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f3ef] px-4 py-10 text-[#2f2723]">
      <div className="w-full max-w-xl rounded-[2rem] border border-[#eadbd2] bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8f3ef]">
          <CheckCircle2 className="h-9 w-9 text-[#9b6f5b]" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
          {t.status}
        </p>

        <h1 className="mt-3 text-3xl font-semibold">{t.title}</h1>

        <p className="mt-4 leading-7 text-[#6f5a50]">{t.text}</p>

        <div className="mt-6 rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-4 text-sm leading-6 text-[#6f5a50]">
          {t.smsNote}
        </div>

        {(date || time || service) && (
          <div className="mt-8 rounded-2xl bg-[#f8f3ef] p-5 text-left">
            <h2 className="font-semibold">{t.details}</h2>

            <div className="mt-4 space-y-2 text-sm text-[#6f5a50]">
              {service && (
                <p>
                  <span className="font-medium text-[#2f2723]">
                    {t.service}:
                  </span>{" "}
                  {service}
                </p>
              )}

              {date && (
                <p>
                  <span className="font-medium text-[#2f2723]">{t.date}:</span>{" "}
                  {formatDate(date, lang)}
                </p>
              )}

              {time && (
                <p>
                  <span className="font-medium text-[#2f2723]">{t.time}:</span>{" "}
                  {time}
                </p>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-[#9b6f5b]">{t.redirect}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/?lang=${lang}`}
            className="rounded-xl bg-[#2f2723] px-6 py-3 font-semibold text-white transition hover:bg-[#4a3932]"
          >
            {t.home}
          </Link>

          <Link
            href={`/booking?lang=${lang}`}
            className="rounded-xl border border-[#eadbd2] px-6 py-3 font-semibold text-[#2f2723] transition hover:bg-[#f8f3ef]"
          >
            {t.newBooking}
          </Link>
        </div>
      </div>
    </main>
  );
}
