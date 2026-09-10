"use client";

import { useActionState, useMemo, useState } from "react";
import {
  updateDefaultScheduleAction,
  type ScheduleActionState,
} from "@/features/schedule/actions";
import type { EmployeeDefaultScheduleItem } from "@/features/schedule/types";

type Props = {
  employeeId: string;
  defaultSchedule: EmployeeDefaultScheduleItem[];
};

const dayRows = [
  { value: 1, label: "Ponedjeljak" },
  { value: 2, label: "Utorak" },
  { value: 3, label: "Srijeda" },
  { value: 4, label: "Četvrtak" },
  { value: 5, label: "Petak" },
  { value: 6, label: "Subota" },
  { value: 0, label: "Nedjelja" },
];

export default function DefaultScheduleForm({ employeeId, defaultSchedule }: Props) {
  const initialState: ScheduleActionState = { error: "", success: "" };
  const boundAction = updateDefaultScheduleAction.bind(null, employeeId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const initialWorkingMap = useMemo(() => {
    return dayRows.reduce<Record<number, boolean>>((acc, row) => {
      const item = defaultSchedule.find((schedule) => schedule.day_of_week === row.value);
      acc[row.value] = item?.is_working ?? false;
      return acc;
    }, {});
  }, [defaultSchedule]);

  const [workingMap, setWorkingMap] = useState<Record<number, boolean>>(initialWorkingMap);
  const inputClass = "w-full min-w-[125px] rounded-xl border border-app-soft bg-white px-3 py-2.5 text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/10 disabled:cursor-not-allowed disabled:bg-app-card-alt disabled:text-app-muted";

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
        Pauza je opcionalna. Ako je postaviš, termini se neće nuditi tijekom pauze. Primjer: rad 08:00–20:00, pauza 13:00–16:00 znači dostupnost 08:00–13:00 i 16:00–20:00.
      </div>

      <div className="space-y-3">
        {dayRows.map(({ label, value }) => {
          const item = defaultSchedule.find((row) => row.day_of_week === value);
          const isWorking = workingMap[value] ?? false;

          return (
            <div key={value} className="rounded-2xl border border-app-soft bg-app-bg/40 p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="font-semibold text-app-text">{label}</div>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-app-text">
                  <input
                    type="checkbox"
                    name={`is_working_${value}`}
                    checked={isWorking}
                    onChange={(e) => setWorkingMap((prev) => ({ ...prev, [value]: e.target.checked }))}
                    className="h-4 w-4 rounded border-app-soft accent-app-accent"
                  />
                  Radi
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-app-muted">Početak rada</label>
                  <input type="time" name={`start_time_${value}`} defaultValue={item?.is_working ? item.start_time.slice(0, 5) : ""} disabled={!isWorking} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-app-muted">Kraj rada</label>
                  <input type="time" name={`end_time_${value}`} defaultValue={item?.is_working ? item.end_time.slice(0, 5) : ""} disabled={!isWorking} className={inputClass} />
                </div>
                <div className="rounded-xl border border-dashed border-app-soft bg-white/70 p-3">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-app-muted">Pauza od</label>
                  <input type="time" name={`break_start_time_${value}`} defaultValue={item?.is_working && item.break_start_time ? item.break_start_time.slice(0, 5) : ""} disabled={!isWorking} className={inputClass} />
                </div>
                <div className="rounded-xl border border-dashed border-app-soft bg-white/70 p-3">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-app-muted">Pauza do</label>
                  <input type="time" name={`break_end_time_${value}`} defaultValue={item?.is_working && item.break_end_time ? item.break_end_time.slice(0, 5) : ""} disabled={!isWorking} className={inputClass} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{state.success}</div> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="rounded-xl bg-app-accent px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          {pending ? "Spremanje..." : "Spremi default raspored"}
        </button>
      </div>
    </form>
  );
}
