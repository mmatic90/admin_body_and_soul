import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientById } from "@/features/clients/queries";
import { formatTime } from "@/lib/utils";
import EmptyStateCard from "@/components/empty-state-card";
import { formatAppointmentServicesLabel } from "@/features/appointments/format-appointment-services";

type Params = Promise<{
  id: string;
}>;

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function segmentLabel(segment: string) {
  switch (segment) {
    case "new":
      return "Novi klijent";
    case "active":
      return "Aktivan";
    case "regular":
      return "Redovan";
    case "at_risk":
      return "Rizičan";
    case "lost":
      return "Izgubljen";
    default:
      return segment;
  }
}

function segmentClasses(segment: string) {
  switch (segment) {
    case "new":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "active":
      return "border-green-200 bg-green-50 text-green-700";
    case "regular":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "at_risk":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "lost":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-app-soft bg-app-bg text-app-text";
  }
}

function InsightCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
      <div className="text-sm text-app-muted">{label}</div>
      <div className="mt-2 text-lg font-semibold text-app-text">{value}</div>
    </div>
  );
}

export default async function ClientDetailsPage({
  params,
}: {
  params: Params;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-app-text">
                  {client.full_name}
                </h1>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${segmentClasses(
                    client.insights.segment,
                  )}`}
                >
                  {segmentLabel(client.insights.segment)}
                </span>
              </div>

              <p className="mt-2 text-app-muted">
                Pregled podataka, inteligencije klijenta i povijesti termina.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/dashboard/clients/${client.id}/edit`}
                className="rounded-xl border border-app-soft bg-white px-4 py-2 font-medium text-app-text transition hover:bg-app-bg"
              >
                Uredi
              </Link>
              <Link
                href="/dashboard/clients"
                className="rounded-xl border border-app-soft bg-white px-4 py-2 font-medium text-app-text transition hover:bg-app-bg"
              >
                Natrag
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard label="Telefon" value={client.phone || "-"} />
          <InsightCard label="Email" value={client.email || "-"} />
          <InsightCard label="Broj termina" value={client.appointments_count} />
          <InsightCard
            label="Sljedeći termin"
            value={formatDate(client.next_appointment)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            label="Odrađeni termini"
            value={client.insights.completed_appointments}
          />
          <InsightCard
            label="Otkazani termini"
            value={client.insights.cancelled_appointments}
          />
          <InsightCard
            label="No-show termini"
            value={client.insights.no_show_appointments}
          />
          <InsightCard
            label="Zadnji dolazak"
            value={formatDate(client.insights.last_completed_appointment)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            label="No-show rate"
            value={`${client.insights.no_show_rate}%`}
          />
          <InsightCard
            label="Cancellation rate"
            value={`${client.insights.cancellation_rate}%`}
          />
          <InsightCard
            label="Najčešća usluga"
            value={client.insights.favorite_service || "-"}
          />
          <InsightCard
            label="Omiljeni zaposlenik"
            value={client.insights.favorite_employee || "-"}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-app-text">
              Inteligencija klijenta
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text">
                Prosječan razmak između dolazaka:{" "}
                <span className="font-semibold">
                  {client.insights.average_days_between_visits !== null
                    ? `${client.insights.average_days_between_visits} dana`
                    : "-"}
                </span>
              </div>

              <div className="rounded-xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text">
                Segment klijenta:{" "}
                <span className="font-semibold">
                  {segmentLabel(client.insights.segment)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-app-text">Upozorenja</h2>

            <div className="mt-4 space-y-3">
              {client.insights.alerts.length > 0 ? (
                client.insights.alerts.map((alert, index) => (
                  <div
                    key={`${alert}-${index}`}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  >
                    {alert}
                  </div>
                ))
              ) : (
                <EmptyStateCard
                  title="Nema upozorenja"
                  description="Za ovog klijenta trenutno nema posebnih upozorenja."
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-app-text">
              Budući termini
            </h2>

            <div className="mt-4 space-y-3">
              {client.upcomingAppointments.length > 0 ? (
                client.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-app-soft bg-white px-4 py-3"
                  >
                    <div className="font-medium text-app-text">
                      {formatDate(appointment.appointment_date)} ·{" "}
                      {formatTime(appointment.start_time)} -{" "}
                      {formatTime(appointment.end_time)}
                    </div>
                    <div className="mt-1 text-sm text-app-muted">
                      {formatAppointmentServicesLabel(
                        appointment.appointment_services
                          ?.slice()
                          .sort((a, b) => a.sort_order - b.sort_order),
                      )}{" "}
                      · {appointment.employee?.display_name || "-"} ·{" "}
                      {appointment.room?.name || "-"}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyStateCard
                  title="Nema budućih termina"
                  description="Za ovog klijenta trenutno nema nadolazećih rezervacija."
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-app-text">Bilješke</h2>

            <div className="mt-4 space-y-3">
              {client.note ? (
                <div className="rounded-xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text">
                  {client.note}
                </div>
              ) : (
                <EmptyStateCard
                  title="Nema bilješke"
                  description="Za ovog klijenta još nije spremljena korisnička bilješka."
                />
              )}

              {client.internal_note ? (
                <div className="rounded-xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text">
                  {client.internal_note}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-app-text">
            Povijest termina
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-app-table-head">
                <tr className="text-left text-sm text-app-muted">
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Vrijeme</th>
                  <th className="px-4 py-3 font-semibold">Usluga</th>
                  <th className="px-4 py-3 font-semibold">Zaposlenik</th>
                  <th className="px-4 py-3 font-semibold">Soba</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {client.pastAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-t border-app-soft text-sm transition hover:bg-app-card-alt"
                  >
                    <td className="px-4 py-4 text-app-text">
                      {formatDate(appointment.appointment_date)}
                    </td>
                    <td className="px-4 py-4 text-app-text">
                      {formatTime(appointment.start_time)} -{" "}
                      {formatTime(appointment.end_time)}
                    </td>
                    <td className="px-4 py-4 text-app-text">
                      {formatAppointmentServicesLabel(
                        appointment.appointment_services
                          ?.slice()
                          .sort((a, b) => a.sort_order - b.sort_order),
                      )}
                    </td>
                    <td className="px-4 py-4 text-app-text">
                      {appointment.employee?.display_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-app-text">
                      {appointment.room?.name || "-"}
                    </td>
                    <td className="px-4 py-4 text-app-muted">
                      {appointment.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {client.pastAppointments.length === 0 ? (
            <div className="mt-4">
              <EmptyStateCard
                title="Nema povijesti termina"
                description="Ovaj klijent još nema završenih ili prošlih termina u evidenciji."
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
