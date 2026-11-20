import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppointmentById, getAppointmentFormData } from "@/features/appointments/queries";
import { getTodayLocalDate } from "@/lib/utils";
import NewAppointmentForm from "./new-appointment-form";
import { getClientOptions } from "@/features/clients/queries";

type SearchParams = Promise<{
  date?: string;
  repeat?: string;
  client?: string;
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
  const repeatSource = resolvedSearchParams.repeat
    ? await getAppointmentById(resolvedSearchParams.repeat)
    : null;

  const repeatServices = repeatSource
    ? repeatSource.appointment_services?.length
      ? repeatSource.appointment_services
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            service_id: item.service_id,
            duration_minutes: item.duration_minutes,
          }))
      : repeatSource.service_id
        ? [{
            service_id: repeatSource.service_id,
            duration_minutes: repeatSource.duration_minutes,
          }]
        : []
    : [];

  const repeatPrefill = repeatSource
    ? {
        sourceAppointmentId: repeatSource.id,
        clientId: repeatSource.client_id ?? "",
        clientName: repeatSource.client_name,
        clientPhone: repeatSource.client_phone ?? "",
        clientEmail: repeatSource.client_email ?? "",
        clientNote: "",
        internalNote: "",
        employeeId: repeatSource.employee_id,
        roomId: repeatSource.room_id,
        services: repeatServices,
      }
    : undefined;

  const selectedClient = resolvedSearchParams.client
    ? clients.find((client) => client.id === resolvedSearchParams.client) ?? null
    : null;

  const clientPrefill = selectedClient
    ? {
        clientId: selectedClient.id,
        clientName: selectedClient.full_name,
        clientPhone: selectedClient.phone ?? "",
        clientEmail: selectedClient.email ?? "",
      }
    : undefined;

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
            repeatPrefill={repeatPrefill}
            clientPrefill={clientPrefill}
          />
        </div>
      </div>
    </main>
  );
}
