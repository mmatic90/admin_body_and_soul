"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { deleteScheduleOverrideAction } from "@/features/schedule/actions";
import type { EmployeeScheduleOverrideItem } from "@/features/schedule/types";

type Props = {
  employeeId: string;
  overrides: EmployeeScheduleOverrideItem[];
};

function overrideLabel(value: EmployeeScheduleOverrideItem["override_type"]) {
  switch (value) {
    case "custom_hours": return "Posebno radno vrijeme";
    case "day_off": return "Slobodan dan";
    case "vacation": return "Godišnji";
    case "sick_leave": return "Bolovanje";
    default: return value;
  }
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function OverrideList({ employeeId, overrides }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedOverride, setSelectedOverride] = useState<EmployeeScheduleOverrideItem | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);

  const { recentOverrides, previousOverrides } = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 3);
    const cutoffString = formatDateOnly(cutoff);

    return {
      recentOverrides: overrides.filter((item) => item.override_date >= cutoffString),
      previousOverrides: overrides.filter((item) => item.override_date < cutoffString),
    };
  }, [overrides]);

  const visibleOverrides = showPrevious
    ? [...previousOverrides, ...recentOverrides]
    : recentOverrides;

  if (overrides.length === 0) {
    return <p className="text-app-muted">Nema overrideova.</p>;
  }

  function handleDelete() {
    if (!selectedOverride) return;
    startTransition(async () => {
      try {
        await deleteScheduleOverrideAction(employeeId, selectedOverride.id);
        setSelectedOverride(null);
        router.refresh();
      } catch (error) {
        console.error(error);
        alert("Greška pri brisanju overridea.");
      }
    });
  }

  return (
    <>
      {previousOverrides.length > 0 ? (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-app-soft bg-app-bg/40 px-4 py-3">
          <div className="text-sm text-app-muted">
            {showPrevious
              ? `Prikazani su i stariji overrideovi (${previousOverrides.length}).`
              : `${previousOverrides.length} starijih overrideova je skriveno radi preglednosti.`}
          </div>
          <button
            type="button"
            onClick={() => setShowPrevious((value) => !value)}
            className="shrink-0 rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-card-alt"
          >
            {showPrevious ? "Sakrij prethodne" : "Prikaži prethodne"}
          </button>
        </div>
      ) : null}

      {visibleOverrides.length === 0 ? (
        <div className="rounded-xl border border-app-soft bg-app-bg/40 px-4 py-5 text-sm text-app-muted">
          Nema overrideova u posljednja 3 dana niti u budućnosti.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-app-soft">
          <table className="min-w-full border-collapse">
            <thead className="bg-app-table-head">
              <tr className="text-left text-sm text-app-muted">
                <th className="px-4 py-3 font-semibold">Datum</th>
                <th className="px-4 py-3 font-semibold">Tip</th>
                <th className="px-4 py-3 font-semibold">Vrijeme</th>
                <th className="px-4 py-3 font-semibold">Pauza</th>
                <th className="px-4 py-3 font-semibold">Napomena</th>
                <th className="px-4 py-3 font-semibold">Akcije</th>
              </tr>
            </thead>
            <tbody className="bg-app-card">
              {visibleOverrides.map((override) => (
                <tr key={override.id} className="border-t border-app-soft text-sm transition hover:bg-app-card-alt">
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-app-text">{formatDate(override.override_date)}</td>
                  <td className="px-4 py-4 text-app-text">{overrideLabel(override.override_type)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-app-text">
                    {override.start_time && override.end_time
                      ? `${override.start_time.slice(0, 5)} - ${override.end_time.slice(0, 5)}`
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-app-text">
                    {override.break_start_time && override.break_end_time
                      ? `${override.break_start_time.slice(0, 5)} - ${override.break_end_time.slice(0, 5)}`
                      : "-"}
                  </td>
                  <td className="min-w-[220px] px-4 py-4 text-app-muted">{override.note || "-"}</td>
                  <td className="px-4 py-4">
                    <button type="button" disabled={pending} onClick={() => setSelectedOverride(override)} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50">
                      Obriši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmActionDialog
        open={Boolean(selectedOverride)}
        title="Obrisati override?"
        description={selectedOverride ? `Override za ${formatDate(selectedOverride.override_date)} bit će trajno obrisan. Nakon toga će ponovno vrijediti default raspored za taj datum.` : ""}
        confirmLabel="Da, obriši"
        pending={pending}
        onCancel={() => setSelectedOverride(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
