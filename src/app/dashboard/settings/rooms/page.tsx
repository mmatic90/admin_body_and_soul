import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRooms } from "@/features/settings/queries";
import { createRoomAction } from "@/features/settings/actions";
import RoomsTable from "./rooms-table";
import RoomCreateForm from "./room-create-form";
import { requireAdminForSettings } from "@/lib/page-guards";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsRoomsPage() {
  await requireAdminForSettings();

  const rooms = await getRooms();

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Sobe</h1>
              <p className="mt-2 text-neutral-600">Dodaj i upravljaj sobama.</p>
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
          <h2 className="text-xl font-semibold">Nova soba</h2>
          <div className="mt-4">
            <RoomCreateForm />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold">Popis soba</h2>
          <div className="mt-4">
            {rooms.length === 0 ? (
              <EmptyStateCard
                title="Nema soba"
                description="Dodaj prvu sobu kako bi se mogla koristiti u rasporedu i terminima."
              />
            ) : (
              <RoomsTable rooms={rooms} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
