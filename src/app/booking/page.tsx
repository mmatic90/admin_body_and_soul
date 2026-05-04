import Link from "next/link";
import { Clock } from "lucide-react";
import { getOnlineBookableServices } from "@/features/public-booking/queries";

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
            <div className="mt-10 space-y-10">
              {Object.entries(groupedServices).map(([groupName, items]) => (
                <div key={groupName}>
                  <h2 className="text-xl font-semibold">{groupName}</h2>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {items.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-5"
                      >
                        <h3 className="text-lg font-semibold">
                          {service.name}
                        </h3>

                        <div className="mt-3 flex items-center gap-2 text-sm text-[#6f5a50]">
                          <Clock className="h-4 w-4" />
                          {service.duration_minutes} min
                        </div>

                        <button
                          type="button"
                          className="mt-5 rounded-full bg-[#2f2723] px-5 py-2.5 text-sm font-semibold text-white opacity-60"
                          disabled
                        >
                          Odaberi uslugu
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
