import Link from "next/link";
import { notFound } from "next/navigation";
import {
  acceptOnlineBookingRequestAction,
  rejectOnlineBookingRequestAction,
} from "@/features/online-bookings/actions";
import {
  getOnlineBookingAcceptOptions,
  getOnlineBookingAutoSuggestion,
  getOnlineBookingRequestById,
} from "@/features/online-bookings/queries";

function formatDateHr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}.`;
}

const rejectionReasons = [
  "Termin je u međuvremenu zauzet.",
  "Termin više nije dostupan.",
  "Odabrana usluga nije dostupna u tom terminu.",
  "Potreban je drugi termin zbog rasporeda djelatnika.",
  "Odabrani termin nije moguće organizirati zbog zauzetosti sobe.",
  "Molimo kontaktirajte salon radi dogovora.",
];

export default async function OnlineBookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const request = await getOnlineBookingRequestById(id);

  if (!request) {
    notFound();
  }

  const options = await getOnlineBookingAcceptOptions(request.service_id);

  const autoSuggestion = await getOnlineBookingAutoSuggestion({
    date: request.requested_date,
    serviceId: request.service_id,
    durationMinutes:
      request.final_duration_minutes ||
      request.duration_minutes ||
      request.services?.duration_minutes ||
      30,
    requestedStartTime: String(request.start_time).slice(0, 5),
  });

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

  const defaultDuration =
    request.final_duration_minutes ||
    request.duration_minutes ||
    request.services?.duration_minutes ||
    30;

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/online-bookings"
          className="text-sm font-medium text-app-muted hover:text-app-text"
        >
          ← Nazad na online rezervacije
        </Link>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <p className="text-sm font-medium text-app-muted">
            Online zahtjev za rezervaciju
          </p>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app-text">
                {request.client_full_name}
              </h1>

              <p className="mt-2 text-app-muted">
                {request.services?.name ?? "Nepoznata usluga"} ·{" "}
                {formatDateHr(request.requested_date)} u{" "}
                {String(request.start_time).slice(0, 5)}
              </p>
            </div>

            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {request.status === "pending" ? "Na čekanju" : request.status}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-app-soft bg-app-card p-6">
            <h2 className="text-xl font-semibold text-app-text">
              Podaci zahtjeva
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <div className="text-app-muted">Klijent</div>
                <div className="font-medium text-app-text">
                  {request.client_full_name}
                </div>
              </div>

              <div>
                <div className="text-app-muted">Telefon</div>
                <div className="font-medium text-app-text">
                  {request.client_phone}
                </div>
              </div>

              <div>
                <div className="text-app-muted">Email</div>
                <div className="font-medium text-app-text">
                  {request.client_email || "-"}
                </div>
              </div>

              <div>
                <div className="text-app-muted">Usluga</div>
                <div className="font-medium text-app-text">
                  {request.services?.name ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-app-muted">Datum i početak</div>
                <div className="font-medium text-app-text">
                  {formatDateHr(request.requested_date)} ·{" "}
                  {String(request.start_time).slice(0, 5)}
                </div>
              </div>

              {request.client_note ? (
                <div>
                  <div className="text-app-muted">Napomena</div>
                  <div className="font-medium text-app-text">
                    {request.client_note}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-6">
            {request.status === "pending" ? (
              <>
                <form
                  action={acceptOnlineBookingRequestAction}
                  className="rounded-2xl border border-app-soft bg-app-card p-6"
                >
                  <input type="hidden" name="request_id" value={request.id} />

                  <h2 className="text-xl font-semibold text-app-text">
                    Prihvati zahtjev
                  </h2>

                  <p className="mt-2 text-sm text-app-muted">
                    Možeš promijeniti samo djelatnika, sobu i trajanje tretmana.
                    Datum, vrijeme početka, usluga i klijent ostaju fiksni.
                  </p>

                  {autoSuggestion.suggestion ? (
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      Sustav predlaže:{" "}
                      <span className="font-semibold">
                        {autoSuggestion.suggestion.employee_name}
                      </span>{" "}
                      ·{" "}
                      <span className="font-semibold">
                        {autoSuggestion.suggestion.room_name}
                      </span>{" "}
                      · {autoSuggestion.suggestion.start_time} -{" "}
                      {autoSuggestion.suggestion.end_time}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Sustav trenutno ne nalazi automatski prijedlog za ovaj
                      termin. Možeš ručno odabrati djelatnika, sobu i trajanje.
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <label className="text-sm">
                      <span className="font-medium text-app-text">
                        Djelatnik
                      </span>
                      <select
                        name="employee_id"
                        defaultValue={defaultEmployeeId}
                        className="mt-2 w-full rounded-xl border border-app-soft bg-white px-3 py-3 outline-none"
                        required
                      >
                        <option value="">Odaberi</option>
                        {options.employees.map((employee: any) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.display_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="font-medium text-app-text">Soba</span>
                      <select
                        name="room_id"
                        defaultValue={defaultRoomId}
                        className="mt-2 w-full rounded-xl border border-app-soft bg-white px-3 py-3 outline-none"
                        required
                      >
                        <option value="">Odaberi</option>
                        {options.rooms.map((room: any) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="font-medium text-app-text">
                        Trajanje
                      </span>
                      <input
                        name="duration_minutes"
                        type="number"
                        min={1}
                        defaultValue={defaultDuration}
                        className="mt-2 w-full rounded-xl border border-app-soft bg-white px-3 py-3 outline-none"
                        required
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="mt-6 rounded-xl bg-app-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Prihvati i kreiraj termin
                  </button>
                </form>

                <form
                  action={rejectOnlineBookingRequestAction}
                  className="rounded-2xl border border-red-100 bg-red-50 p-6"
                >
                  <input type="hidden" name="request_id" value={request.id} />

                  <h2 className="text-xl font-semibold text-red-900">
                    Odbij zahtjev
                  </h2>

                  <p className="mt-2 text-sm text-red-700">
                    Klijent će dobiti SMS s odabranim razlogom odbijanja.
                  </p>

                  <label className="mt-5 block text-sm">
                    <span className="font-medium text-red-900">
                      Razlog odbijanja
                    </span>
                    <select
                      name="rejection_reason"
                      className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-3 outline-none"
                      required
                    >
                      <option value="">Odaberi razlog</option>
                      {rejectionReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Odbij i pošalji SMS
                  </button>
                </form>
              </>
            ) : (
              <div className="rounded-2xl border border-app-soft bg-app-card p-6 text-app-muted">
                Ovaj zahtjev je već obrađen.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
