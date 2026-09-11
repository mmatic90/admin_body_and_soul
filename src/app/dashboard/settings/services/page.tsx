import Link from "next/link";
import { getServicesWithPriceRange } from "@/features/settings/service-pricing-queries";
import {
  getEmployeeServiceMappingData,
  getServiceRoomMappingData,
} from "@/features/settings/queries";
import ServicesTable from "./services-table";
import ServiceCreateForm from "./service-create-form";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsServicesPage() {
  await requireAdminForSettings();

  const [services, employeeMappings, roomMappings] = await Promise.all([
    getServicesWithPriceRange(),
    getEmployeeServiceMappingData(),
    getServiceRoomMappingData(),
  ]);

  const configuration = Object.fromEntries(
    services.map((service) => [
      service.id,
      {
        employeeCount: employeeMappings.mappings.filter(
          (item) => item.service_id === service.id,
        ).length,
        roomCount: roomMappings.mappings.filter(
          (item) => item.service_id === service.id,
        ).length,
      },
    ]),
  );

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Usluge</h1>
              <p className="mt-2 text-app-muted">
                Upravljaj uslugama, opisima, trajanjem, cijenama i dostupnošću.
              </p>
            </div>

            <Link
              href="/dashboard/settings"
              className="rounded-xl border border-app-soft bg-white px-4 py-2 font-medium text-app-text transition hover:bg-app-bg"
            >
              Natrag
            </Link>
          </div>
        </div>

        <details className="group rounded-2xl border border-app-soft bg-app-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-app-text">
            <span>+ Nova usluga</span>
            <span className="text-sm font-normal text-app-muted group-open:hidden">
              Otvori formu
            </span>
            <span className="hidden text-sm font-normal text-app-muted group-open:inline">
              Sakrij formu
            </span>
          </summary>
          <div className="border-t border-app-soft p-5">
            <p className="mb-4 text-sm text-app-muted">
              Za cijenu unesi ili fiksnu cijenu ili minimalnu i maksimalnu cijenu.
            </p>
            <ServiceCreateForm />
          </div>
        </details>

        <div className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm md:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-app-text">Popis usluga</h2>
            <p className="mt-1 text-sm text-app-muted">
              Zaglavlje tablice i gumbi za spremanje ostaju vidljivi dok pregledavaš dugačak popis.
            </p>
          </div>

          {services.length === 0 ? (
            <EmptyStateCard
              title="Nema usluga"
              description="Dodaj prvu uslugu kako bi se pojavila u popisu i mogla koristiti u terminima."
            />
          ) : (
            <ServicesTable services={services} configuration={configuration} />
          )}
        </div>
      </div>
    </main>
  );
}
