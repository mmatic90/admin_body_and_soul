import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppointmentsByDate } from "@/features/appointments/queries";
import { getTodayLocalDate } from "@/lib/utils";
import DateQueryPicker from "@/components/date-query-picker";
import EmptyStateCard from "@/components/empty-state-card";
import AppointmentsListView from "./appointments-list-view";

type SearchParams = Promise<{
  date?: string;
}>;

function getZagrebNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const selectedDate = resolvedSearchParams.date || getTodayLocalDate();
  const appointments = await getAppointmentsByDate(selectedDate);
  const zagrebNow = getZagrebNow();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Termini</h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <DateQueryPicker
                value={selectedDate}
                basePath="/dashboard/appointments"
              />

              <Link
                href={`/dashboard/appointments/new?date=${selectedDate}`}
                className="inline-flex h-[42px] items-center justify-center rounded-xl bg-app-accent px-4 py-2 font-medium text-white transition hover:opacity-90"
              >
                Novi termin
              </Link>
            </div>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <EmptyStateCard
              title="Nema termina za odabrani datum"
              description="Promijeni datum ili dodaj novi termin kako bi se prikazao sadržaj."
              action={
                <Link
                  href={`/dashboard/appointments/new?date=${selectedDate}`}
                  className="inline-flex rounded-xl bg-app-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Dodaj novi termin
                </Link>
              }
            />
          </div>
        ) : (
          <AppointmentsListView
            appointments={appointments}
            isToday={selectedDate === zagrebNow.date}
            isPastDay={selectedDate < zagrebNow.date}
            currentMinutes={zagrebNow.minutes}
          />
        )}
      </div>
    </main>
  );
}
