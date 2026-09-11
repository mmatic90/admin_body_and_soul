import Link from "next/link";
import { getServiceGroupLimitsData } from "@/features/settings/queries";
import GroupLimitsTable from "./group-limits-table";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsGroupLimitsPage() {
  await requireAdminForSettings();

  const { groups, limits } = await getServiceGroupLimitsData();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Paralelni termini po grupama</h1>
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
          {groups.length === 0 ? (
            <EmptyStateCard
              title="Nema grupa usluga"
              description="Kad usluge budu grupirane kroz kategoriju usluge, ovdje ćeš moći definirati maksimalan broj paralelnih termina."
            />
          ) : (
            <GroupLimitsTable groups={groups} limits={limits} />
          )}
        </div>
      </div>
    </main>
  );
}
