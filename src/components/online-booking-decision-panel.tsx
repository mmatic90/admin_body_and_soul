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

type Option = { id: string; name: string };

type Props = {
  requestId: string;
  clientName: string;
  dateLabel: string;
  time: string;
  durationMinutes: number;
  employees: Option[];
  rooms: Option[];
  defaultEmployeeId: string;
  defaultRoomId: string;
  suggestionLabel?: string | null;
};

export default function OnlineBookingDecisionPanel({
  requestId,
  clientName,
  dateLabel,
  time,
  durationMinutes,
  employees,
  rooms,
  defaultEmployeeId,
  defaultRoomId,
  suggestionLabel,
}: Props) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [duration, setDuration] = useState(durationMinutes);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const finalReason = reason === "__other__" ? customReason.trim() : reason;
  const canAccept = Boolean(employeeId && roomId && duration > 0 && employees.length && rooms.length);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-app-soft bg-app-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-app-text">Prihvati zahtjev</h2>
            <p className="mt-2 text-sm text-app-muted">
              Provjeri djelatnika, sobu i trajanje prije potvrde.
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
            canAccept
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}>
            {canAccept ? "Spremno za potvrdu" : "Potrebna provjera"}
          </span>
        </div>

        {suggestionLabel ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Sustav predlaže: <span className="font-semibold">{suggestionLabel}</span>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Sustav trenutno nema potpuni automatski prijedlog za traženi termin.
          </div>
        )}

        {employees.length === 0 || rooms.length === 0 ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Za traženi termin nema dostupnog djelatnika ili slobodne sobe. Provjeri zahtjev ili ga odbij uz odgovarajući razlog.
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="font-medium text-app-text">Djelatnik</span>
            <select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-app-soft bg-white px-3 py-3 text-app-text outline-none transition focus:border-app-accent"
            >
              <option value="">Odaberi</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-app-text">Soba</span>
            <select
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-app-soft bg-white px-3 py-3 text-app-text outline-none transition focus:border-app-accent"
            >
              <option value="">Odaberi</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-app-text">Trajanje</span>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-app-soft bg-white px-3 py-3 text-app-text outline-none transition focus:border-app-accent"
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl bg-app-card-alt p-4 text-sm text-app-muted">
          Potvrdom će se kreirati termin u kalendaru, a klijent će dobiti SMS ili email potvrdu.
        </div>

        <button
          type="button"
          disabled={!canAccept}
          onClick={() => setConfirmAccept(true)}
          className="mt-5 rounded-xl bg-app-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prihvati i kreiraj termin
        </button>
      </section>

      <section className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <h2 className="text-xl font-semibold text-red-900">Odbij zahtjev</h2>
        <p className="mt-2 text-sm text-red-700">
          Odaberi razlog. Klijent će dobiti SMS ili email s razlogom odbijanja.
        </p>

        <select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-5 w-full rounded-xl border border-red-200 bg-white px-3 py-3 text-app-text outline-none transition focus:border-red-400"
        >
          <option value="">Odaberi razlog</option>
          {rejectionReasons.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
          <option value="__other__">Drugi razlog...</option>
        </select>

        {reason === "__other__" ? (
          <textarea
            value={customReason}
            onChange={(event) => setCustomReason(event.target.value)}
            placeholder="Upiši razlog odbijanja..."
            className="mt-3 min-h-24 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-app-text outline-none transition placeholder:text-app-muted focus:border-red-400"
          />
        ) : null}

        <form action={rejectOnlineBookingRequestAction} className="mt-5">
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="rejection_reason" value={finalReason} />
          <button
            type="submit"
            disabled={!finalReason}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Odbij i pošalji obavijest
          </button>
        </form>
      </section>

      {confirmAccept ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmAccept(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-app-soft bg-app-card p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-app-text">Potvrditi termin?</h2>
            <p className="mt-3 text-sm text-app-muted">
              {clientName} · {dateLabel} u {time}
            </p>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Termin će biti kreiran, a klijent će dobiti potvrdu.
            </div>
            <form action={acceptOnlineBookingRequestAction} className="mt-6 flex justify-end gap-3">
              <input type="hidden" name="request_id" value={requestId} />
              <input type="hidden" name="employee_id" value={employeeId} />
              <input type="hidden" name="room_id" value={roomId} />
              <input type="hidden" name="duration_minutes" value={duration} />
              <button
                type="button"
                onClick={() => setConfirmAccept(false)}
                className="rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-semibold text-app-text transition hover:bg-app-bg"
              >
                Odustani
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Da, potvrdi
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
