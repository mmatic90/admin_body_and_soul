import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSalonWorkingHours } from "@/features/settings/queries";
import SalonHoursTable from "./salon-hours-table";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsSalonHoursPage() {
  await requireAdminForSettings();

  const hours = await getSalonWorkingHours();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Radno vrijeme salona</h1>
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
          {hours.length === 0 ? (
            <EmptyStateCard
              title="Nema definiranog radnog vremena"
              description="Trenutno nema zapisa za radno vrijeme salona. Potrebno je inicijalno postaviti dane u bazi."
            />
          ) : (
            <SalonHoursTable hours={hours} />
          )}
        </div>
      </div>
    </main>
  );
}
