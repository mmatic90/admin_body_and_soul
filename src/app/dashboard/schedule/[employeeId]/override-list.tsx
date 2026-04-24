"use client";

import { useTransition } from "react";
import { deleteScheduleOverrideAction } from "@/features/schedule/actions";
import type { EmployeeScheduleOverrideItem } from "@/features/schedule/types";
import { useRouter } from "next/navigation";

type Props = {
  employeeId: string;
  overrides: EmployeeScheduleOverrideItem[];
};

function overrideLabel(value: EmployeeScheduleOverrideItem["override_type"]) {
  switch (value) {
    case "custom_hours":
      return "Custom hours";
    case "day_off":
      return "Slobodan dan";
    case "vacation":
      return "Godišnji";
    case "sick_leave":
      return "Bolovanje";
    default:
      return value;
  }
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function OverrideList({ employeeId, overrides }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (overrides.length === 0) {
    return <p className="text-neutral-600">Nema overrideova.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="bg-neutral-50">
          <tr className="text-left text-sm text-neutral-600">
            <th className="px-4 py-3 font-semibold">Datum</th>
            <th className="px-4 py-3 font-semibold">Tip</th>
            <th className="px-4 py-3 font-semibold">Vrijeme</th>
            <th className="px-4 py-3 font-semibold">Napomena</th>
            <th className="px-4 py-3 font-semibold">Akcije</th>
          </tr>
        </thead>

        <tbody>
          {overrides.map((override) => (
            <tr
              key={override.id}
              className="border-t border-neutral-200 text-sm"
            >
              <td className="px-4 py-4">
                {formatDate(override.override_date)}
              </td>
              <td className="px-4 py-4">
                {overrideLabel(override.override_type)}
              </td>
              <td className="px-4 py-4">
                {override.start_time && override.end_time
                  ? `${override.start_time.slice(0, 5)} - ${override.end_time.slice(0, 5)}`
                  : "-"}
              </td>
              <td className="px-4 py-4">{override.note || "-"}</td>
              <td className="px-4 py-4">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteScheduleOverrideAction(
                          employeeId,
                          override.id,
                        );
                        router.refresh();
                      } catch (error) {
                        console.error(error);
                        alert("Greška pri brisanju overridea.");
                      }
                    })
                  }
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                >
                  Obriši
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
