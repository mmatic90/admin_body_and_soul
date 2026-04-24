import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServiceGroupLimitsData } from "@/features/settings/queries";
import GroupLimitsTable from "./group-limits-table";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsGroupLimitsPage() {
  await requireAdminForSettings();

  const { groups, limits } = await getServiceGroupLimitsData();

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Group limits</h1>
              <p className="mt-2 text-neutral-600">
                Odredi koliko termina iz iste grupe može ići paralelno.
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
          {groups.length === 0 ? (
            <EmptyStateCard
              title="Nema grupa usluga"
              description="Kad usluge budu grupirane kroz service_group polje, ovdje ćeš moći definirati maksimalan broj paralelnih termina."
            />
          ) : (
            <GroupLimitsTable groups={groups} limits={limits} />
          )}
        </div>
      </div>
    </main>
  );
}
