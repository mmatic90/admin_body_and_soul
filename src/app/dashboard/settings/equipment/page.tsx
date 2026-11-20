import Link from "next/link";
import { getEquipment } from "@/features/settings/queries";
import EquipmentTable from "./equipment-table";
import EquipmentCreateForm from "./equipment-create-form";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsPage() {
  await requireAdminForSettings();

  const equipment = await getEquipment();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Oprema</h1>
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
            <span>+ Nova oprema</span>
            <span className="text-sm font-normal text-app-muted group-open:hidden">Otvori formu</span>
            <span className="hidden text-sm font-normal text-app-muted group-open:inline">Sakrij formu</span>
          </summary>
          <div className="border-t border-app-soft p-5">
            <EquipmentCreateForm />
          </div>
        </details>

        <div className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm md:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-app-text">Popis opreme</h2>
          </div>

          {equipment.length === 0 ? (
            <EmptyStateCard
              title="Nema opreme"
              description="Dodaj prvu stavku opreme kako bi se mogla povezivati s uslugama."
            />
          ) : (
            <EquipmentTable equipment={equipment} />
          )}
        </div>
      </div>
    </main>
  );
}
