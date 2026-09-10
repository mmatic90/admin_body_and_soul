"use client";

import { useActionState, useMemo } from "react";
import {
  applyDefaultScheduleRangeAction,
  type ScheduleActionState,
} from "@/features/schedule/actions";
import type { EmployeeDefaultScheduleItem } from "@/features/schedule/types";

type Props = {
  employeeId: string;
  defaultSchedule: EmployeeDefaultScheduleItem[];
};

const dayOptions = [
  { value: 1, label: "Ponedjeljak" },
  { value: 2, label: "Utorak" },
  { value: 3, label: "Srijeda" },
  { value: 4, label: "Četvrtak" },
  { value: 5, label: "Petak" },
  { value: 6, label: "Subota" },
  { value: 0, label: "Nedjelja" },
];

export default function DefaultScheduleRangeForm({ employeeId, defaultSchedule }: Props) {
  const initialState: ScheduleActionState = { error: "", success: "" };
  const boundAction = applyDefaultScheduleRangeAction.bind(null, employeeId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const suggestedRange = useMemo(() => {
    const workingDays = defaultSchedule.filter((item) => item.is_working);
    if (workingDays.length === 0) {
      return { dayFrom: 1, dayTo: 5, isWorking: true, startTime: "08:00", endTime: "16:00", breakStartTime: "", breakEndTime: "" };
    }

    return {
      dayFrom: Math.min(...workingDays.map((item) => item.day_of_week)),
      dayTo: Math.max(...workingDays.map((item) => item.day_of_week)),
      isWorking: true,
      startTime: workingDays[0].start_time.slice(0, 5),
      endTime: workingDays[0].end_time.slice(0, 5),
      breakStartTime: workingDays[0].break_start_time?.slice(0, 5) ?? "",
      breakEndTime: workingDays[0].break_end_time?.slice(0, 5) ?? "",
    };
  }, [defaultSchedule]);

  const inputClass = "w-full rounded-xl border border-app-soft bg-white px-4 py-3 text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/10";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="day_from" className="mb-1.5 block text-sm font-semibold text-app-text">Od dana</label>
          <select id="day_from" name="day_from" defaultValue={String(suggestedRange.dayFrom)} className={inputClass}>
            {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="day_to" className="mb-1.5 block text-sm font-semibold text-app-text">Do dana</label>
          <select id="day_to" name="day_to" defaultValue={String(suggestedRange.dayTo)} className={inputClass}>
            {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </div>
        <label className="flex min-h-[50px] items-center gap-2 rounded-xl border border-app-soft bg-app-bg/50 px-4 text-sm font-medium text-app-text">
          <input type="checkbox" name="range_is_working" defaultChecked={suggestedRange.isWorking} className="h-4 w-4 accent-app-accent" />
          Radi u ovom rasponu
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-app-soft bg-app-bg/40 p-4">
          <div className="mb-3 text-sm font-semibold text-app-text">Radno vrijeme</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="range_start_time" className="mb-1.5 block text-sm font-medium">Početak</label>
              <input id="range_start_time" name="range_start_time" type="time" defaultValue={suggestedRange.startTime} className={inputClass} />
            </div>
            <div>
              <label htmlFor="range_end_time" className="mb-1.5 block text-sm font-medium">Kraj</label>
              <input id="range_end_time" name="range_end_time" type="time" defaultValue={suggestedRange.endTime} className={inputClass} />
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
              <label htmlFor="range_break_start_time" className="mb-1.5 block text-sm font-medium">Pauza od</label>
              <input id="range_break_start_time" name="range_break_start_time" type="time" defaultValue={suggestedRange.breakStartTime} className={inputClass} />
            </div>
            <div>
              <label htmlFor="range_break_end_time" className="mb-1.5 block text-sm font-medium">Pauza do</label>
              <input id="range_break_end_time" name="range_break_end_time" type="time" defaultValue={suggestedRange.breakEndTime} className={inputClass} />
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-app-muted">Ostavi oba polja prazna ako zaposlenica radi bez pauze.</p>
        </div>
      </div>

      {state.error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{state.success}</div> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="rounded-xl bg-app-accent px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          {pending ? "Primjenjujem..." : "Primijeni na raspon dana"}
        </button>
      </div>
    </form>
  );
}
