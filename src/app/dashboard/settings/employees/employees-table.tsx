"use client";

import { useMemo, useState, useTransition } from "react";
import { RotateCcw, KeyRound, UserX } from "lucide-react";
import type { EmployeeItem } from "@/features/settings/types";
import {
  bulkUpdateEmployeesAction,
  deactivateEmployeeAction,
  resetEmployeePasswordAction,
} from "@/features/settings/actions";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/confirm-action-dialog";

type Props = {
  employees: EmployeeItem[];
};

type EditableEmployee = {
  id: string;
  display_name: string;
  email: string;
  phone: string;
  color_hex: string;
  is_active: boolean;
};

function toEditable(employee: EmployeeItem): EditableEmployee {
  return {
    id: employee.id,
    display_name: employee.display_name,
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    color_hex: employee.color_hex ?? "",
    is_active: employee.is_active,
  };
}

export default function EmployeesTable({ employees }: Props) {
  const initialItems = useMemo(() => employees.map(toEditable), [employees]);

  const [items, setItems] = useState<EditableEmployee[]>(initialItems);
  const [pending, startTransition] = useTransition();
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<EditableEmployee | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<EditableEmployee | null>(null);

  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems);

  function updateItem(
    id: string,
    field: keyof EditableEmployee,
    value: string | boolean,
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function resetChanges() {
    setItems(initialItems);
  }

  function saveChanges() {
    startTransition(async () => {
      const result = await bulkUpdateEmployeesAction(
        items.map((item) => ({
          ...item,
          email: item.email.trim() || null,
          phone: item.phone.trim() || null,
          color_hex: item.color_hex.trim() || null,
        })),
      );

      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function resetPassword(employeeId: string) {
    setActionPendingId(employeeId);

    startTransition(async () => {
      const result = await resetEmployeePasswordAction(employeeId);

      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      setActionPendingId(null);
    });
  }

  function deactivateEmployee(employeeId: string) {
    setActionPendingId(employeeId);

    startTransition(async () => {
      const result = await deactivateEmployeeAction(employeeId);

      if (result.ok) {
        toast.success(result.message);
        setItems((prev) =>
          prev.map((item) =>
            item.id === employeeId ? { ...item, is_active: false } : item,
          ),
        );
      } else {
        toast.error(result.message);
      }

      setActionPendingId(null);
    });
  }

  function requestActiveToggle(employee: EditableEmployee) {
    if (employee.is_active) {
      setDeactivateTarget(employee);
      return;
    }

    updateItem(employee.id, "is_active", true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-app-muted">
            Uredi djelatnike pa klikni{" "}
            <span className="font-medium text-app-text">Spremi izmjene</span>.
          </div>
          {hasChanges ? (
            <div className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              Imaš nespremljene promjene
            </div>
          ) : null}
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

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-app-table-head">
            <tr className="text-left text-sm text-app-muted">
              <th className="px-4 py-3 font-semibold">Ime</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Telefon</th>
              <th className="px-4 py-3 font-semibold">Boja</th>
              <th className="px-4 py-3 font-semibold">Aktivno</th>
              <th className="px-4 py-3 font-semibold">Akcije</th>
            </tr>
          </thead>

          <tbody>
            {items.map((employee) => (
              <tr
                key={employee.id}
                className="border-t border-app-soft text-sm transition hover:bg-app-card-alt"
              >
                <td className="px-4 py-4">
                  <input
                    value={employee.display_name}
                    onChange={(e) =>
                      updateItem(employee.id, "display_name", e.target.value)
                    }
                    className="min-w-[220px] rounded-lg border border-app-soft bg-white px-3 py-2 text-app-text outline-none"
                  />
                </td>

                <td className="px-4 py-4">
                  <input
                    value={employee.email}
                    onChange={(e) =>
                      updateItem(employee.id, "email", e.target.value)
                    }
                    className="min-w-[240px] rounded-lg border border-app-soft bg-white px-3 py-2 text-app-text outline-none"
                  />
                </td>

                <td className="px-4 py-4">
                  <input
                    value={employee.phone}
                    onChange={(e) =>
                      updateItem(employee.id, "phone", e.target.value)
                    }
                    className="min-w-[180px] rounded-lg border border-app-soft bg-white px-3 py-2 text-app-text outline-none"
                  />
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={employee.color_hex || "#C084FC"}
                      onChange={(e) =>
                        updateItem(employee.id, "color_hex", e.target.value)
                      }
                      className="h-10 w-14 cursor-pointer rounded-lg border border-app-soft bg-white p-1"
                    />

                    <span className="text-xs text-app-muted">
                      {employee.color_hex || "#C084FC"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={employee.is_active}
                    onClick={() => requestActiveToggle(employee)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                      employee.is_active ? "bg-app-accent" : "bg-app-soft"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        employee.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResetPasswordTarget(employee)}
                      disabled={pending || actionPendingId === employee.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-app-soft bg-white px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg disabled:opacity-50"
                    >
                      <KeyRound className="h-4 w-4" />
                      Reset lozinke
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeactivateTarget(employee)}
                      disabled={
                        pending ||
                        actionPendingId === employee.id ||
                        !employee.is_active
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <UserX className="h-4 w-4" />
                      Deaktiviraj
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmActionDialog
        open={Boolean(deactivateTarget)}
        title="Deaktivirati zaposlenika?"
        description={
          deactivateTarget
            ? `${deactivateTarget.display_name} više neće biti aktivan zaposlenik i neće se nuditi u novim terminima. Postojeći podaci i povijest ostaju sačuvani.`
            : ""
        }
        confirmLabel="Da, deaktiviraj"
        pending={Boolean(actionPendingId && deactivateTarget?.id === actionPendingId)}
        pendingLabel="Deaktiviranje..."
        tone="danger"
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (!deactivateTarget) return;
          const id = deactivateTarget.id;
          setDeactivateTarget(null);
          deactivateEmployee(id);
        }}
      />

      <ConfirmActionDialog
        open={Boolean(resetPasswordTarget)}
        title="Resetirati lozinku?"
        description={
          resetPasswordTarget
            ? `Resetirat će se lozinka za ${resetPasswordTarget.display_name}. Korisnik će nakon toga morati koristiti novu pristupnu lozinku.`
            : ""
        }
        confirmLabel="Resetiraj lozinku"
        pending={Boolean(actionPendingId && resetPasswordTarget?.id === actionPendingId)}
        pendingLabel="Resetiranje..."
        tone="primary"
        onCancel={() => setResetPasswordTarget(null)}
        onConfirm={() => {
          if (!resetPasswordTarget) return;
          const id = resetPasswordTarget.id;
          setResetPasswordTarget(null);
          resetPassword(id);
        }}
      />
    </div>
  );
}
