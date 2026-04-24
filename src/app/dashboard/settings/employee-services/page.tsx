import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeServiceMappingData } from "@/features/settings/queries";
import EmployeeServiceTable from "./employee-service-table";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsEmployeeServicesPage() {
  await requireAdminForSettings();

  const { employees, services, mappings } =
    await getEmployeeServiceMappingData();

  const activeEmployees = employees.filter((item) => item.is_active);
  const activeServices = services.filter((item) => item.is_active);

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Zaposlenici i usluge</h1>
              <p className="mt-2 text-neutral-600">
                Odredi koje usluge pojedini zaposlenik može raditi.
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
          {activeEmployees.length === 0 || activeServices.length === 0 ? (
            <EmptyStateCard
              title="Mapiranje trenutno nije dostupno"
              description="Potrebno je imati barem jednog aktivnog zaposlenika i jednu aktivnu uslugu kako bi se moglo definirati mapiranje."
            />
          ) : (
            <EmployeeServiceTable
              employees={employees}
              services={services}
              mappings={mappings}
            />
          )}
        </div>
      </div>
    </main>
  );
}
