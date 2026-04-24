import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppointmentsByDate } from "@/features/appointments/queries";
import {
  formatDateLabel,
  formatTime,
  getTodayLocalDate,
  statusLabel,
} from "@/lib/utils";
import DateQueryPicker from "@/components/date-query-picker";
import AppointmentStatusActions from "@/components/appointment-status-actions";
import EmptyStateCard from "@/components/empty-state-card";
import { formatAppointmentServicesLabel } from "@/features/appointments/format-appointment-services";
import AppointmentRowActions from "@/components/appointment-row-actions";

type SearchParams = Promise<{
  date?: string;
}>;

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

  return (
    <main className="min-h-screen bg-app-bg p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Termini</h1>
              <p className="mt-2 text-app-muted">
                Pregled termina za {formatDateLabel(selectedDate)}
              </p>
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

        <div className="overflow-hidden rounded-2xl border border-app-soft bg-app-card shadow-sm">
          {appointments.length === 0 ? (
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
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-app-table-head">
                  <tr className="text-left text-sm text-app-muted">
                    <th className="px-4 py-3 font-semibold">Vrijeme</th>
                    <th className="px-4 py-3 font-semibold">Klijent</th>
                    <th className="px-4 py-3 font-semibold">Usluga</th>
                    <th className="px-4 py-3 font-semibold">Zaposlenik</th>
                    <th className="px-4 py-3 font-semibold">Soba</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Napomena</th>
                    <th className="px-4 py-3 font-semibold">Akcije</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map((appointment) => {
                    const serviceName = formatAppointmentServicesLabel(
                      appointment.appointment_services
                        ?.slice()
                        .sort((a, b) => a.sort_order - b.sort_order),
                    );
                    const serviceGroup =
                      appointment.service?.service_group ?? null;
                    const employeeName =
                      appointment.employee?.display_name ??
                      "Nepoznati zaposlenik";
                    const employeeColor =
                      appointment.employee?.color_hex || "#999999";
                    const roomName = appointment.room?.name ?? "Nepoznata soba";

                    return (
                      <tr
                        key={appointment.id}
                        className="border-t border-app-soft text-sm transition hover:bg-app-card-alt"
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-app-text">
                            {formatTime(appointment.start_time)} -{" "}
                            {formatTime(appointment.end_time)}
                          </div>
                          <div className="mt-1 text-app-muted">
                            {appointment.duration_minutes} min
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-app-text">
                            {appointment.client_name}
                          </div>
                          {appointment.client_phone ? (
                            <div className="mt-1 text-app-muted">
                              {appointment.client_phone}
                            </div>
                          ) : null}
                          {appointment.client_email ? (
                            <div className="mt-1 text-app-muted">
                              {appointment.client_email}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-app-text">
                            {serviceName}
                          </div>
                          {serviceGroup ? (
                            <div className="mt-1 text-app-muted">
                              Grupa: {serviceGroup}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{ backgroundColor: employeeColor }}
                            />
                            <span className="font-medium text-app-text">
                              {employeeName}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top text-app-muted">
                          {roomName}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="rounded-full bg-app-bg px-3 py-1 text-xs font-medium text-app-text">
                            {statusLabel(appointment.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top text-app-muted">
                          {appointment.internal_note ||
                            appointment.client_note ||
                            "-"}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <AppointmentRowActions
                              appointmentId={appointment.id}
                              appointmentDate={appointment.appointment_date}
                            />

                            <AppointmentStatusActions
                              appointmentId={appointment.id}
                              currentStatus={appointment.status}
                              compact
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
