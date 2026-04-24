import Link from "next/link";
import { getEquipment } from "@/features/settings/queries";
import EquipmentTable from "./equipment-table";
import EquipmentCreateForm from "./equipment-create-form";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsEquipmentPage() {
  await requireAdminForSettings();

  const equipment = await getEquipment();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Oprema</h1>
              <p className="mt-2 text-app-muted">
                Dodaj i upravljaj opremom salona.
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

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-app-text">Nova oprema</h2>
          <div className="mt-4">
            <EquipmentCreateForm />
          </div>
        </div>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-app-text">Popis opreme</h2>
          <div className="mt-4">
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
      </div>
    </main>
  );
}
