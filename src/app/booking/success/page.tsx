"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import PublicFooter from "@/components/public-footer";

function formatDateHr(date: string | null) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}.${month}.${year}.`;
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const service = searchParams.get("service");

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f3ef] px-4 py-10 text-[#2f2723]">
      <div className="w-full max-w-xl rounded-[2rem] border border-[#eadbd2] bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f8f3ef]">
          <CheckCircle2 className="h-9 w-9 text-[#9b6f5b]" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
          Zahtjev poslan
        </p>

        <h1 className="mt-3 text-3xl font-semibold">Hvala na rezervaciji ✨</h1>

        <p className="mt-4 leading-7 text-[#6f5a50]">
          Vaš zahtjev za rezervaciju je uspješno poslan. Salon će provjeriti
          dostupnost termina i poslati vam SMS potvrdu ili povratnu informaciju.
        </p>

        {(date || time || service) && (
          <div className="mt-8 rounded-2xl bg-[#f8f3ef] p-5 text-left">
            <h2 className="font-semibold">Detalji zahtjeva</h2>

            <div className="mt-4 space-y-2 text-sm text-[#6f5a50]">
              {service && (
                <p>
                  <span className="font-medium text-[#2f2723]">Usluga:</span>{" "}
                  {service}
                </p>
              )}

              {date && (
                <p>
                  <span className="font-medium text-[#2f2723]">Datum:</span>{" "}
                  {formatDateHr(date)}
                </p>
              )}

              {time && (
                <p>
                  <span className="font-medium text-[#2f2723]">Vrijeme:</span>{" "}
                  {time}
                </p>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-[#9b6f5b]">
          Automatski povratak na početnu stranicu za 10 sekundi.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-[#2f2723] px-6 py-3 font-semibold text-white transition hover:bg-[#4a3932]"
          >
            Povratak na početnu
          </Link>

          <Link
            href="/booking"
            className="rounded-xl border border-[#eadbd2] px-6 py-3 font-semibold text-[#2f2723] transition hover:bg-[#f8f3ef]"
          >
            Nova rezervacija
          </Link>
        </div>
      </div>
    </main>
  );
}
