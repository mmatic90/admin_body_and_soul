import Link from "next/link";
import { getServicesWithPriceRange } from "@/features/settings/service-pricing-queries";
import ServicesTable from "./services-table";
import ServiceCreateForm from "./service-create-form";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsServicesPage() {
  await requireAdminForSettings();

  const services = await getServicesWithPriceRange();

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Usluge</h1>
              <p className="mt-2 text-neutral-600">
                Dodaj i upravljaj uslugama, opisima i cijenama.
              </p>
            </div>

            <Link
              href="/dashboard/settings"
              className="rounded-xl border border-neutral-300 px-4 py-2 font-medium"
            >
              Natrag
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold">Nova usluga</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Za cijenu unesi ili fiksnu cijenu ili minimalnu i maksimalnu cijenu.
          </p>
          <div className="mt-4">
            <ServiceCreateForm />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold">Popis usluga</h2>
          <div className="mt-4">
            {services.length === 0 ? (
              <EmptyStateCard
                title="Nema usluga"
                description="Dodaj prvu uslugu kako bi se pojavila u popisu i mogla koristiti u terminima."
              />
            ) : (
              <ServicesTable services={services} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
