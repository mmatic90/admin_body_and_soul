import Link from "next/link";
import { Clock } from "lucide-react";
import { getOnlineBookableServices } from "@/features/public-booking/queries";
import BookingClient from "./booking-client";
import CookieConsent from "@/components/cookie-consent";
import PublicFooter from "@/components/public-footer";

function groupServices(
  services: Awaited<ReturnType<typeof getOnlineBookableServices>>,
) {
  return services.reduce<Record<string, typeof services>>((acc, service) => {
    const groupName = service.service_group || "Ostalo";
    acc[groupName] ??= [];
    acc[groupName].push(service);
    return acc;
  }, {});
}

export default async function BookingPage() {
  const services = await getOnlineBookableServices();
  const groupedServices = groupServices(services);

  return (
    <main className="min-h-screen bg-[#f8f3ef] px-6 py-10 text-[#2f2723]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-[#9b6f5b]">
          ← Povratak na početnu
        </Link>

        <section className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
            Online rezervacije
          </p>

          <h1 className="mt-3 text-4xl font-semibold">Odaberi uslugu</h1>

          <p className="mt-5 max-w-2xl leading-8 text-[#6f5a50]">
            Prikazane su samo usluge koje je salon označio kao dostupne za
            online rezervaciju.
          </p>

          {services.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#d8b6a4] bg-[#f8f3ef] p-6 text-sm text-[#6f5a50]">
              Trenutno nema usluga dostupnih za online rezervaciju. U adminu
              označi barem jednu uslugu kao dostupnu za online rezervacije.
            </div>
          ) : (
            <BookingClient services={services} />
          )}
        </section>
      </div>
      <CookieConsent />
      <PublicFooter />
    </main>
  );
}
