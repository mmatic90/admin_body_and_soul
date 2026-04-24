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
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Radno vrijeme salona</h1>
              <p className="mt-2 text-neutral-600">
                Uredi radno vrijeme salona po danima u tjednu.
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
