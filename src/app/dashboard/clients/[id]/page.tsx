import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarPlus,
  Mail,
  Pencil,
  Phone,
  Repeat2,
  UserRound,
} from "lucide-react";
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
      return "Neaktivan";
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

function statusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "Zakazano";
    case "completed":
      return "Odrađeno";
    case "cancelled":
      return "Otkazano";
    case "no_show":
      return "No-show";
    default:
      return status;
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "no_show":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-blue-100 text-blue-700";
  }
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

  const repeatCandidate =
    client.pastAppointments.find((appointment) => appointment.status === "completed") ??
    client.pastAppointments[0] ??
    null;

  const nextAppointment = client.upcomingAppointments[0] ?? null;

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-app-soft bg-app-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="rounded-2xl bg-app-card-alt p-3 text-app-accent">
                <UserRound className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-3xl font-bold text-app-text">
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

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-app-muted">
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center gap-2 font-medium text-app-text hover:text-app-accent"
                    >
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </a>
                  ) : (
                    <span>Telefon nije upisan</span>
                  )}

                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="inline-flex items-center gap-2 font-medium text-app-text hover:text-app-accent"
                    >
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/appointments/new?client=${client.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-app-accent px-4 py-2.5 font-medium text-white transition hover:opacity-90"
              >
                <CalendarPlus className="h-4 w-4" />
                Novi termin
              </Link>

              {repeatCandidate ? (
                <Link
                  href={`/dashboard/appointments/new?repeat=${repeatCandidate.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-2.5 font-medium text-app-text transition hover:bg-app-bg"
                >
                  <Repeat2 className="h-4 w-4" />
                  Ponovi zadnji
                </Link>
              ) : null}

              <Link
                href={`/dashboard/clients/${client.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-2.5 font-medium text-app-text transition hover:bg-app-bg"
              >
                <Pencil className="h-4 w-4" />
                Uredi
              </Link>

              <Link
                href="/dashboard/clients"
                className="rounded-xl border border-app-soft bg-white px-4 py-2.5 font-medium text-app-text transition hover:bg-app-bg"
              >
                Natrag
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-app-text">Sljedeći termin</h2>
                <p className="mt-1 text-sm text-app-muted">Najbliža nadolazeća rezervacija.</p>
              </div>
              {nextAppointment ? (
                <Link
                  href={`/dashboard/appointments/${nextAppointment.id}/edit`}
                  className="text-sm font-semibold text-app-accent"
                >
                  Otvori termin
                </Link>
              ) : null}
            </div>

            {nextAppointment ? (
              <div className="mt-5 rounded-2xl border border-app-soft bg-white p-5">
                <div className="text-lg font-semibold text-app-text">
                  {formatDate(nextAppointment.appointment_date)} ·{" "}
                  {formatTime(nextAppointment.start_time)} -{" "}
                  {formatTime(nextAppointment.end_time)}
                </div>
                <div className="mt-2 text-sm text-app-muted">
                  {formatAppointmentServicesLabel(
                    nextAppointment.appointment_services
                      ?.slice()
                      .sort((a, b) => a.sort_order - b.sort_order),
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-app-muted">
                  <span>{nextAppointment.employee?.display_name || "-"}</span>
                  <span>{nextAppointment.room?.name || "-"}</span>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyStateCard
                  title="Nema budućih termina"
                  description="Za ovog klijenta trenutno nema nadolazećih rezervacija."
                />
              </div>
            )}

            {client.upcomingAppointments.length > 1 ? (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold text-app-text">
                  Ostali budući termini
                </div>
                {client.upcomingAppointments.slice(1).map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/dashboard/appointments/${appointment.id}/edit`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-app-soft bg-white px-4 py-3 transition hover:bg-app-bg"
                  >
                    <div>
                      <div className="font-medium text-app-text">
                        {formatDate(appointment.appointment_date)} ·{" "}
                        {formatTime(appointment.start_time)}
                      </div>
                      <div className="mt-1 text-sm text-app-muted">
                        {formatAppointmentServicesLabel(
                          appointment.appointment_services
                            ?.slice()
                            .sort((a, b) => a.sort_order - b.sort_order),
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-app-accent">Otvori</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-app-text">Važno za klijenta</h2>

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
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Nema posebnih upozorenja za ovog klijenta.
                </div>
              )}

              {client.note ? (
                <div className="rounded-xl border border-app-soft bg-white px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                    Bilješka o klijentu
                  </div>
                  <div className="mt-1 text-sm text-app-text">{client.note}</div>
                </div>
              ) : null}

              {client.internal_note ? (
                <div className="rounded-xl border border-app-soft bg-white px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                    Interna bilješka
                  </div>
                  <div className="mt-1 text-sm text-app-text">{client.internal_note}</div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-app-text">Sažetak klijenta</h2>
              <p className="mt-1 text-sm text-app-muted">Najkorisnije informacije bez dodatne statističke gužve.</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${segmentClasses(
                client.insights.segment,
              )}`}
            >
              {segmentLabel(client.insights.segment)}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-app-card-alt p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">Zadnji dolazak</div>
              <div className="mt-1 font-semibold text-app-text">
                {formatDate(client.insights.last_completed_appointment)}
              </div>
            </div>
            <div className="rounded-xl bg-app-card-alt p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">Odrađeno</div>
              <div className="mt-1 font-semibold text-app-text">
                {client.insights.completed_appointments}
              </div>
            </div>
            <div className="rounded-xl bg-app-card-alt p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">No-show / otkazano</div>
              <div className="mt-1 font-semibold text-app-text">
                {client.insights.no_show_appointments} / {client.insights.cancelled_appointments}
              </div>
            </div>
            <div className="rounded-xl bg-app-card-alt p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">Najčešća usluga</div>
              <div className="mt-1 font-semibold text-app-text">
                {client.insights.favorite_service || "-"}
              </div>
            </div>
          </div>

          <details className="mt-4 rounded-xl border border-app-soft bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-app-text">
              Prikaži dodatne informacije
            </summary>
            <div className="grid gap-4 border-t border-app-soft p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-app-muted">Ukupno termina</div>
                <div className="mt-1 font-semibold text-app-text">{client.appointments_count}</div>
              </div>
              <div>
                <div className="text-xs text-app-muted">No-show stopa</div>
                <div className="mt-1 font-semibold text-app-text">{client.insights.no_show_rate}%</div>
              </div>
              <div>
                <div className="text-xs text-app-muted">Stopa otkazivanja</div>
                <div className="mt-1 font-semibold text-app-text">{client.insights.cancellation_rate}%</div>
              </div>
              <div>
                <div className="text-xs text-app-muted">Omiljeni zaposlenik</div>
                <div className="mt-1 font-semibold text-app-text">{client.insights.favorite_employee || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-app-muted">Prosjek između dolazaka</div>
                <div className="mt-1 font-semibold text-app-text">
                  {client.insights.average_days_between_visits !== null
                    ? `${client.insights.average_days_between_visits} dana`
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-app-muted">Zakazano</div>
                <div className="mt-1 font-semibold text-app-text">{client.insights.scheduled_appointments}</div>
              </div>
            </div>
          </details>
        </section>

        <section className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-app-text">Povijest termina</h2>
              <p className="mt-1 text-sm text-app-muted">Prethodni termini i brza mogućnost ponavljanja.</p>
            </div>
            {repeatCandidate ? (
              <Link
                href={`/dashboard/appointments/new?repeat=${repeatCandidate.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-semibold text-app-text transition hover:bg-app-bg"
              >
                <Repeat2 className="h-4 w-4" />
                Ponovi zadnji
              </Link>
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-app-table-head">
                <tr className="text-left text-sm text-app-muted">
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Vrijeme</th>
                  <th className="px-4 py-3 font-semibold">Usluga</th>
                  <th className="px-4 py-3 font-semibold">Zaposlenik</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Akcija</th>
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
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(appointment.status)}`}>
                        {statusLabel(appointment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/dashboard/appointments/new?repeat=${appointment.id}`}
                        className="inline-flex rounded-lg border border-app-soft bg-white px-3 py-2 text-xs font-semibold text-app-text transition hover:bg-app-bg"
                      >
                        Ponovi
                      </Link>
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
                description="Ovaj klijent još nema prošlih termina u evidenciji."
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
