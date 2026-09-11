"use client";

import { useState } from "react";
import {
  acceptOnlineBookingRequestAction,
  rejectOnlineBookingRequestAction,
} from "@/features/online-bookings/actions";

const rejectionReasons = [
  "Termin je u međuvremenu zauzet.",
  "Termin više nije dostupan.",
  "Odabrana usluga nije dostupna u tom terminu.",
  "Potreban je drugi termin zbog rasporeda djelatnika.",
  "Odabrani termin nije moguće organizirati zbog zauzetosti sobe.",
  "Molimo kontaktirajte salon radi dogovora.",
];

type Props = {
  requestId: string;
  clientName: string;
  dateLabel: string;
  time: string;
  employeeId?: string | null;
  roomId?: string | null;
  durationMinutes?: number | null;
  canAccept: boolean;
};

export default function OnlineBookingQuickActions({
  requestId,
  clientName,
  dateLabel,
  time,
  employeeId,
  roomId,
  durationMinutes,
  canAccept,
}: Props) {
  const [mode, setMode] = useState<"accept" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const finalReason = reason === "__other__" ? customReason.trim() : reason;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canAccept && employeeId && roomId && durationMinutes ? (
          <button
            type="button"
            onClick={() => setMode("accept")}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Prihvati
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setMode("reject")}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Odbij
        </button>
      </div>

      {mode ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMode(null);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-app-soft bg-app-card p-6 shadow-xl">
            {mode === "accept" ? (
              <>
                <h2 className="text-xl font-semibold text-app-text">
                  Potvrditi online rezervaciju?
                </h2>
                <p className="mt-3 text-sm text-app-muted">
                  Potvrdit ćeš termin za <strong className="text-app-text">{clientName}</strong>,{" "}
                  {dateLabel} u {time}.
                </p>
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Termin će biti kreiran u kalendaru, a klijent će dobiti SMS ili email potvrdu.
                </div>

                <form action={acceptOnlineBookingRequestAction} className="mt-6 flex justify-end gap-3">
                  <input type="hidden" name="request_id" value={requestId} />
                  <input type="hidden" name="employee_id" value={employeeId ?? ""} />
                  <input type="hidden" name="room_id" value={roomId ?? ""} />
                  <input type="hidden" name="duration_minutes" value={durationMinutes ?? ""} />
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-semibold text-app-text transition hover:bg-app-bg"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Da, potvrdi termin
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-app-text">Odbiti online rezervaciju?</h2>
                <p className="mt-2 text-sm text-app-muted">
                  Razlog je obavezan jer će biti uključen u poruku klijentu.
                </p>

                <div className="mt-5 space-y-2">
                  {rejectionReasons.map((item) => (
                    <label
                      key={item}
                      className="flex cursor-pointer gap-3 rounded-xl border border-app-soft bg-white p-3 text-sm text-app-text transition hover:bg-app-bg"
                    >
                      <input
                        type="radio"
                        name="reason-choice"
                        value={item}
                        checked={reason === item}
                        onChange={() => setReason(item)}
                        className="mt-0.5"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                  <label className="flex cursor-pointer gap-3 rounded-xl border border-app-soft bg-white p-3 text-sm text-app-text">
                    <input
                      type="radio"
                      name="reason-choice"
                      value="__other__"
                      checked={reason === "__other__"}
                      onChange={() => setReason("__other__")}
                      className="mt-0.5"
                    />
                    <span>Drugi razlog</span>
                  </label>
                </div>

                {reason === "__other__" ? (
                  <textarea
                    value={customReason}
                    onChange={(event) => setCustomReason(event.target.value)}
                    placeholder="Upiši razlog odbijanja..."
                    className="mt-3 min-h-24 w-full rounded-xl border border-app-soft bg-white px-4 py-3 text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent"
                  />
                ) : null}

                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  Klijent će nakon odbijanja dobiti SMS ili email s odabranim razlogom.
                </div>

                <form action={rejectOnlineBookingRequestAction} className="mt-6 flex justify-end gap-3">
                  <input type="hidden" name="request_id" value={requestId} />
                  <input type="hidden" name="rejection_reason" value={finalReason} />
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-semibold text-app-text transition hover:bg-app-bg"
                  >
                    Odustani
                  </button>
                  <button
                    type="submit"
                    disabled={!finalReason}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Potvrdi odbijanje
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
