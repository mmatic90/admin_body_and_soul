import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoomMappingData } from "@/features/settings/queries";
import ServiceRoomTable from "./service-room-table";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsServiceRoomsPage() {
  await requireAdminForSettings();

  const { services, rooms, mappings } = await getServiceRoomMappingData();

  const activeServices = services.filter((item) => item.is_active);
  const activeRooms = rooms.filter((item) => item.is_active);

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Usluge i sobe</h1>
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
          {activeServices.length === 0 || activeRooms.length === 0 ? (
            <EmptyStateCard
              title="Mapiranje trenutno nije dostupno"
              description="Potrebno je imati barem jednu aktivnu uslugu i jednu aktivnu sobu kako bi se moglo definirati mapiranje."
            />
          ) : (
            <ServiceRoomTable
              services={services}
              rooms={rooms}
              mappings={mappings}
            />
          )}
        </div>
      </div>
    </main>
  );
}
