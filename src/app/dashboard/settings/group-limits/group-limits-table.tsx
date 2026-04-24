"use client";

import { useMemo, useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import type { ServiceGroupLimitItem } from "@/features/settings/types";
import { bulkUpdateServiceGroupLimitsAction } from "@/features/settings/actions";
import { toast } from "sonner";

type Props = {
  groups: string[];
  limits: ServiceGroupLimitItem[];
};

type EditableLimit = {
  group_name: string;
  max_parallel: number;
};

export default function GroupLimitsTable({ groups, limits }: Props) {
  const initialItems = useMemo<EditableLimit[]>(
    () =>
      groups.map((group) => {
        const existing = limits.find((item) => item.group_name === group);

        return {
          group_name: group,
          max_parallel: existing?.max_parallel ?? 1,
        };
      }),
    [groups, limits],
  );

  const [items, setItems] = useState<EditableLimit[]>(initialItems);
  const [pending, startTransition] = useTransition();

  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems);

  function updateItem(group: string, value: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.group_name === group ? { ...item, max_parallel: value } : item,
      ),
    );
  }

  function resetChanges() {
    setItems(initialItems);
  }

  function saveChanges() {
    startTransition(async () => {
      const result = await bulkUpdateServiceGroupLimitsAction(items);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-app-muted">
          Postavi koliko termina iz iste grupe može ići paralelno pa klikni{" "}
          <span className="font-medium text-app-text">Spremi izmjene</span>.
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetChanges}
            disabled={pending || !hasChanges}
            className="inline-flex items-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Poništi
          </button>

          <button
            type="button"
            onClick={saveChanges}
            disabled={pending || !hasChanges}
            className="rounded-xl bg-app-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Spremanje..." : "Spremi izmjene"}
          </button>
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full border-collapse">
          <thead className="bg-app-table-head">
            <tr className="text-left text-sm text-app-muted">
              <th className="px-4 py-3 font-semibold">Grupa usluge</th>
              <th className="px-4 py-3 font-semibold">Maksimalno paralelno</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.group_name}
                className="border-t border-app-soft text-sm transition hover:bg-app-card-alt"
              >
                <td className="px-4 py-4 font-medium text-app-text">
                  {item.group_name}
                </td>
                <td className="px-4 py-4">
                  <input
                    type="number"
                    min={1}
                    value={item.max_parallel}
                    onChange={(e) =>
                      updateItem(item.group_name, Number(e.target.value))
                    }
                    className="w-28 rounded-lg border border-app-soft bg-white px-3 py-2 text-app-text outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 lg:hidden">
        {items.map((item) => (
          <div
            key={item.group_name}
            className="rounded-2xl border border-app-soft bg-app-card p-4"
          >
            <div className="font-medium text-app-text">{item.group_name}</div>

            <div className="mt-3">
              <label className="mb-1 block text-sm text-app-muted">
                Maksimalno paralelno
              </label>
              <input
                type="number"
                min={1}
                value={item.max_parallel}
                onChange={(e) =>
                  updateItem(item.group_name, Number(e.target.value))
                }
                className="w-full rounded-lg border border-app-soft bg-white px-3 py-2 text-app-text outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
