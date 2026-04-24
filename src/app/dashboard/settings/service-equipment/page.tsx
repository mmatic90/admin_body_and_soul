import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServiceEquipmentMappingData } from "@/features/settings/queries";
import ServiceEquipmentTable from "./service-equipment-table";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsServiceEquipmentPage() {
  await requireAdminForSettings();

  const { services, equipment, mappings } =
    await getServiceEquipmentMappingData();

  const activeServices = services.filter((item) => item.is_active);
  const activeEquipment = equipment.filter((item) => item.is_active);

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Usluge i oprema</h1>
              <p className="mt-2 text-neutral-600">
                Odredi koja je oprema potrebna za pojedinu uslugu.
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
          {activeServices.length === 0 || activeEquipment.length === 0 ? (
            <EmptyStateCard
              title="Mapiranje trenutno nije dostupno"
              description="Potrebno je imati barem jednu aktivnu uslugu i jednu aktivnu opremu kako bi se moglo definirati mapiranje."
            />
          ) : (
            <ServiceEquipmentTable
              services={services}
              equipment={equipment}
              mappings={mappings}
            />
          )}
        </div>
      </div>
    </main>
  );
}
