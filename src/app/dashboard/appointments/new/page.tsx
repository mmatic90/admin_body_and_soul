import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppointmentFormData } from "@/features/appointments/queries";
import { getTodayLocalDate } from "@/lib/utils";
import NewAppointmentForm from "./new-appointment-form";
import { getClientOptions } from "@/features/clients/queries";

type SearchParams = Promise<{
  date?: string;
}>;

export default async function NewAppointmentPage({
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

  const { services, employees, rooms, serviceRooms, employeeServices } =
    await getAppointmentFormData();

  const clients = await getClientOptions();

  const resolvedSearchParams = await searchParams;
  const defaultDate = resolvedSearchParams.date || getTodayLocalDate();

  return (
    <main className="min-h-screen bg-app-bg p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Novi termin</h1>
              <p className="mt-2 text-app-muted">
                Ručni unos novog termina u salonu.
              </p>
            </div>

            <Link
              href={`/dashboard/appointments?date=${defaultDate}`}
              className="inline-flex items-center justify-center rounded-xl border border-app-soft bg-white px-4 py-2 font-medium text-app-text transition hover:bg-app-bg"
            >
              Natrag na termine
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <NewAppointmentForm
            services={services}
            employees={employees}
            rooms={rooms}
            serviceRooms={serviceRooms}
            employeeServices={employeeServices}
            clients={clients}
            defaultDate={defaultDate}
          />
        </div>
      </div>
    </main>
  );
}
