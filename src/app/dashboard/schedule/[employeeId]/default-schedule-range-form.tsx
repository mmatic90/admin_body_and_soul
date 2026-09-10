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

  const inputClass = "w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="day_from" className="mb-1 block text-sm font-medium">Od dana</label>
          <select id="day_from" name="day_from" defaultValue={String(suggestedRange.dayFrom)} className={inputClass}>
            {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="day_to" className="mb-1 block text-sm font-medium">Do dana</label>
          <select id="day_to" name="day_to" defaultValue={String(suggestedRange.dayTo)} className={inputClass}>
            {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="range_is_working" defaultChecked={suggestedRange.isWorking} />
        Radi u ovom rasponu dana
      </label>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="range_start_time" className="mb-1 block text-sm font-medium">Početak</label>
          <input id="range_start_time" name="range_start_time" type="time" defaultValue={suggestedRange.startTime} className={inputClass} />
        </div>
        <div>
          <label htmlFor="range_break_start_time" className="mb-1 block text-sm font-medium">Pauza od <span className="font-normal text-neutral-500">(opcionalno)</span></label>
          <input id="range_break_start_time" name="range_break_start_time" type="time" defaultValue={suggestedRange.breakStartTime} className={inputClass} />
        </div>
        <div>
          <label htmlFor="range_break_end_time" className="mb-1 block text-sm font-medium">Pauza do <span className="font-normal text-neutral-500">(opcionalno)</span></label>
          <input id="range_break_end_time" name="range_break_end_time" type="time" defaultValue={suggestedRange.breakEndTime} className={inputClass} />
        </div>
        <div>
          <label htmlFor="range_end_time" className="mb-1 block text-sm font-medium">Kraj</label>
          <input id="range_end_time" name="range_end_time" type="time" defaultValue={suggestedRange.endTime} className={inputClass} />
        </div>
      </div>

      <p className="text-sm text-neutral-500">Ako ostaviš oba polja pauze prazna, radno vrijeme ostaje jednokratno.</p>

      {state.error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{state.success}</div> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="rounded-xl bg-black px-5 py-3 font-medium text-white disabled:opacity-50">
          {pending ? "Primjenjujem..." : "Primijeni na raspon dana"}
        </button>
      </div>
    </form>
  );
}
