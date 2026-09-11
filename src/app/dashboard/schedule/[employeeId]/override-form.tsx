"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createScheduleOverrideAction,
  type ScheduleActionState,
} from "@/features/schedule/actions";

type Props = { employeeId: string };

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function OverrideForm({ employeeId }: Props) {
  const [overrideType, setOverrideType] = useState("custom_hours");
  const today = useMemo(() => getTodayLocalDate(), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const initialState: ScheduleActionState = { error: "", success: "" };
  const boundAction = createScheduleOverrideAction.bind(null, employeeId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const inputClass = "w-full rounded-xl border border-app-soft bg-white px-4 py-3 text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/10";

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
        Posebna izmjena zamjenjuje redovni raspored samo za odabrani datum ili raspon. Kod posebnog radnog vremena možeš postaviti i pauzu.
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <label htmlFor="date_from" className="mb-1.5 block text-sm font-semibold text-app-text">Od datuma</label>
          <input id="date_from" name="date_from" type="date" value={dateFrom} onChange={(e) => { const value = e.target.value; setDateFrom(value); setDateTo(value); }} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="date_to" className="mb-1.5 block text-sm font-semibold text-app-text">Do datuma</label>
          <input id="date_to" name="date_to" type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="override_type" className="mb-1.5 block text-sm font-semibold text-app-text">Vrsta izmjene</label>
          <select id="override_type" name="override_type" value={overrideType} onChange={(e) => setOverrideType(e.target.value)} className={inputClass} required>
            <option value="custom_hours">Posebno radno vrijeme</option>
            <option value="day_off">Slobodan dan</option>
            <option value="vacation">Godišnji odmor</option>
            <option value="sick_leave">Bolovanje</option>
          </select>
        </div>
      </div>

      {overrideType === "custom_hours" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-app-soft bg-app-bg/40 p-4">
            <div className="mb-3 text-sm font-semibold text-app-text">Radno vrijeme</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="start_time" className="mb-1.5 block text-sm font-medium">Početak</label>
                <input id="start_time" name="start_time" type="time" defaultValue="08:00" className={inputClass} required />
              </div>
              <div>
                <label htmlFor="end_time" className="mb-1.5 block text-sm font-medium">Kraj</label>
                <input id="end_time" name="end_time" type="time" defaultValue="16:00" className={inputClass} required />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-app-soft bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-app-text">Pauza</div>
              <span className="text-xs text-app-muted">Opcionalno</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="break_start_time" className="mb-1.5 block text-sm font-medium">Pauza od</label>
                <input id="break_start_time" name="break_start_time" type="time" className={inputClass} />
              </div>
              <div>
                <label htmlFor="break_end_time" className="mb-1.5 block text-sm font-medium">Pauza do</label>
                <input id="break_end_time" name="break_end_time" type="time" className={inputClass} />
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-app-muted">Pauza mora biti potpuno unutar radnog vremena. Ostavi prazno ako je nema.</p>
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-semibold text-app-text">Napomena</label>
        <textarea id="note" name="note" rows={3} className={inputClass} placeholder="Npr. radno vrijeme zbog edukacije ili privatne obaveze" />
      </div>

      {state.error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{state.success}</div> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="rounded-xl bg-app-accent px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          {pending ? "Spremanje..." : "Dodaj override raspon"}
        </button>
      </div>
    </form>
  );
}
