import { getPendingOnlineBookings } from "@/features/online-bookings/queries";

function formatDateHr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}.`;
}

export default async function OnlineBookingsPage() {
  const bookings = await getPendingOnlineBookings();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <p className="text-sm font-medium text-app-muted">
            Zahtjevi s javne web stranice
          </p>

          <h1 className="mt-2 text-3xl font-bold text-app-text">
            Online rezervacije
          </h1>

          <p className="mt-2 text-app-muted">
            Ovdje se prikazuju novi zahtjevi koje admin može provjeriti,
            prihvatiti ili odbiti.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-app-soft bg-app-card p-8 text-center text-app-muted">
            Trenutno nema novih online rezervacija.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-app-text">
                        {booking.client_full_name}
                      </h2>

                      <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Na čekanju
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-app-muted">
                      {booking.services?.name ?? "Nepoznata usluga"} ·{" "}
                      {formatDateHr(booking.requested_date)} u{" "}
                      {booking.start_time?.slice(0, 5)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-app-accent px-4 py-2 text-sm font-semibold text-white opacity-60"
                      disabled
                    >
                      Prihvati uskoro
                    </button>

                    <button
                      type="button"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 opacity-60"
                      disabled
                    >
                      Odbij uskoro
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-app-card-alt p-4">
                    <div className="text-app-muted">Telefon</div>
                    <div className="mt-1 font-medium text-app-text">
                      {booking.client_phone}
                    </div>
                  </div>

                  <div className="rounded-xl bg-app-card-alt p-4">
                    <div className="text-app-muted">Email</div>
                    <div className="mt-1 font-medium text-app-text">
                      {booking.client_email || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-app-card-alt p-4">
                    <div className="text-app-muted">Trajanje</div>
                    <div className="mt-1 font-medium text-app-text">
                      {booking.final_duration_minutes ??
                        booking.duration_minutes}{" "}
                      min
                    </div>
                  </div>

                  <div className="rounded-xl bg-app-card-alt p-4">
                    <div className="text-app-muted">Status</div>
                    <div className="mt-1 font-medium text-app-text">
                      {booking.status}
                    </div>
                  </div>
                </div>

                {booking.client_note ? (
                  <div className="mt-4 rounded-xl bg-app-card-alt p-4 text-sm">
                    <div className="font-medium text-app-text">Napomena</div>
                    <p className="mt-1 text-app-muted">{booking.client_note}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
