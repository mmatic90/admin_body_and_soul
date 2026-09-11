import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOnlineBookingAcceptOptions,
  getOnlineBookingAutoSuggestion,
  getOnlineBookingRequestById,
} from "@/features/online-bookings/queries";
import OnlineBookingDecisionPanel from "@/components/online-booking-decision-panel";

function formatDateHr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}.`;
}

function statusLabel(status: string) {
  if (status === "pending") return "Na čekanju";
  if (status === "accepted") return "Prihvaćeno";
  if (status === "rejected") return "Odbijeno";
  return status;
}

function statusClass(status: string) {
  if (status === "accepted") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "border-red-200 bg-red-100 text-red-800";
  return "border-amber-200 bg-amber-100 text-amber-800";
}

export default async function OnlineBookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getOnlineBookingRequestById(id);

  if (!request) notFound();

  const defaultDuration =
    request.final_duration_minutes ||
    request.duration_minutes ||
    request.services?.duration_minutes ||
    30;

  const [options, autoSuggestion] =
    request.status === "pending"
      ? await Promise.all([
          getOnlineBookingAcceptOptions({
            serviceId: request.service_id,
            date: request.requested_date,
            startTime: String(request.start_time).slice(0, 5),
            durationMinutes: defaultDuration,
          }),
          getOnlineBookingAutoSuggestion({
            date: request.requested_date,
            serviceId: request.service_id,
            durationMinutes: defaultDuration,
            requestedStartTime: String(request.start_time).slice(0, 5),
          }),
        ])
      : [{ employees: [], rooms: [] }, { suggestion: null, reason: null }];

  const defaultEmployeeId =
    autoSuggestion.suggestion?.employee_id ||
    request.final_employee_id ||
    request.suggested_employee_id ||
    "";

  const defaultRoomId =
    autoSuggestion.suggestion?.room_id ||
    request.final_room_id ||
    request.suggested_room_id ||
    "";

  const suggestionLabel = autoSuggestion.suggestion
    ? `${autoSuggestion.suggestion.employee_name} · ${autoSuggestion.suggestion.room_name} · ${autoSuggestion.suggestion.start_time} - ${autoSuggestion.suggestion.end_time}`
    : null;

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/dashboard/online-bookings"
          className="text-sm font-medium text-app-muted hover:text-app-text"
        >
          ← Nazad na online rezervacije
        </Link>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-app-muted">Online zahtjev za rezervaciju</p>
              <h1 className="mt-2 text-3xl font-bold text-app-text">{request.client_full_name}</h1>
              <p className="mt-2 text-app-muted">
                {request.services?.name ?? "Nepoznata usluga"} · {formatDateHr(request.requested_date)} u{" "}
                {String(request.start_time).slice(0, 5)}
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(request.status)}`}>
              {statusLabel(request.status)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-app-text">Podaci zahtjeva</h2>
            <div className="mt-5 space-y-5 text-sm">
              <div>
                <div className="text-app-muted">Klijent</div>
                <div className="mt-1 font-medium text-app-text">{request.client_full_name}</div>
              </div>
              <div>
                <div className="text-app-muted">Telefon</div>
                <a href={`tel:${request.client_phone}`} className="mt-1 block font-medium text-app-text hover:underline">
                  {request.client_phone}
                </a>
              </div>
              <div>
                <div className="text-app-muted">Email</div>
                {request.client_email ? (
                  <a href={`mailto:${request.client_email}`} className="mt-1 block font-medium text-app-text hover:underline">
                    {request.client_email}
                  </a>
                ) : (
                  <div className="mt-1 font-medium text-app-text">-</div>
                )}
              </div>
              <div>
                <div className="text-app-muted">Usluga</div>
                <div className="mt-1 font-medium text-app-text">{request.services?.name ?? "-"}</div>
              </div>
              <div>
                <div className="text-app-muted">Datum i početak</div>
                <div className="mt-1 font-medium text-app-text">
                  {formatDateHr(request.requested_date)} · {String(request.start_time).slice(0, 5)}
                </div>
              </div>
              <div>
                <div className="text-app-muted">Trajanje</div>
                <div className="mt-1 font-medium text-app-text">{defaultDuration} min</div>
              </div>
              {request.client_note ? (
                <div className="rounded-xl bg-app-card-alt p-4">
                  <div className="font-medium text-app-text">Napomena klijenta</div>
                  <p className="mt-1 text-app-muted">{request.client_note}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section>
            {request.status === "pending" ? (
              <OnlineBookingDecisionPanel
                requestId={request.id}
                clientName={request.client_full_name}
                dateLabel={formatDateHr(request.requested_date)}
                time={String(request.start_time).slice(0, 5)}
                durationMinutes={defaultDuration}
                employees={options.employees.map((employee) => ({
                  id: employee.id,
                  name: employee.display_name,
                }))}
                rooms={options.rooms.map((room) => ({
                  id: room.id,
                  name: room.name,
                }))}
                defaultEmployeeId={defaultEmployeeId}
                defaultRoomId={defaultRoomId}
                suggestionLabel={suggestionLabel}
              />
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-app-text">Zahtjev je obrađen</h2>
                  <p className="mt-2 text-app-muted">
                    Status: <span className="font-semibold text-app-text">{statusLabel(request.status)}</span>
                  </p>

                  {request.status === "accepted" && request.appointment_id ? (
                    <Link
                      href={`/dashboard/appointments?date=${request.requested_date}`}
                      className="mt-5 inline-flex rounded-xl bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Otvori kreirani termin
                    </Link>
                  ) : null}
                </div>

                {request.rejection_reason ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
                    <h2 className="font-semibold text-red-900">Razlog odbijanja</h2>
                    <p className="mt-2 text-sm text-red-700">{request.rejection_reason}</p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
