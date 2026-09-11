"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import {
  deleteAppointmentAction,
  quickUpdateAppointmentStatusAction,
} from "@/features/appointments/actions";
import { formatAppointmentServicesLabel } from "@/features/appointments/format-appointment-services";
import type { AppointmentListItem } from "@/features/appointments/types";

type Props = {
  appointments: AppointmentListItem[];
  isToday: boolean;
  currentMinutes: number;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function getServiceLabel(item: AppointmentListItem) {
  return formatAppointmentServicesLabel(
    item.appointment_services
      ?.slice()
      .sort((a, b) => a.sort_order - b.sort_order),
  );
}

function getStatusLabel(status: AppointmentListItem["status"]) {
  switch (status) {
    case "scheduled":
      return "Zakazano";
    case "completed":
      return "Odrađeno";
    case "cancelled":
      return "Otkazano";
    case "no_show":
      return "No-show";
  }
}

function getStatusClasses(status: AppointmentListItem["status"]) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "no_show":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function AppointmentsListView({
  appointments,
  isToday,
  currentMinutes,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<AppointmentListItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "no_show" | "cancelled" | "delete" | null
  >(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      appointments.map((appointment) => {
        const start = timeToMinutes(appointment.start_time);
        const end = timeToMinutes(appointment.end_time);
        const isCurrent =
          isToday &&
          appointment.status === "scheduled" &&
          start <= currentMinutes &&
          currentMinutes < end;
        const waitsForStatus =
          isToday &&
          appointment.status === "scheduled" &&
          end <= currentMinutes;

        return {
          appointment,
          isCurrent,
          waitsForStatus,
          serviceLabel: getServiceLabel(appointment),
        };
      }),
    [appointments, currentMinutes, isToday],
  );

  function updateStatus(status: "completed" | "no_show" | "cancelled") {
    if (!selected) return;

    startTransition(async () => {
      const result = await quickUpdateAppointmentStatusAction(
        selected.id,
        status,
      );

      if (result.ok) {
        toast.success(result.message);
        setSelected(null);
        setConfirmAction(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function deleteSelected() {
    if (!selected) return;

    startTransition(async () => {
      const result = await deleteAppointmentAction(
        selected.id,
        selected.appointment_date,
      );

      if (result.ok) {
        toast.success(result.message);
        setSelected(null);
        setConfirmAction(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function RowStatus({
    appointment,
    isCurrent,
    waitsForStatus,
  }: {
    appointment: AppointmentListItem;
    isCurrent: boolean;
    waitsForStatus: boolean;
  }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {isCurrent ? (
          <span className="rounded-full bg-app-accent px-2.5 py-1 text-xs font-semibold text-white">
            U tijeku
          </span>
        ) : null}
        {waitsForStatus ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            Čeka status
          </span>
        ) : null}
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
            appointment.status,
          )}`}
        >
          {getStatusLabel(appointment.status)}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-app-soft bg-app-card shadow-sm md:block">
        <table className="min-w-full border-collapse">
          <thead className="bg-app-table-head">
            <tr className="text-left text-sm text-app-muted">
              <th className="px-4 py-3 font-semibold">Vrijeme</th>
              <th className="px-4 py-3 font-semibold">Klijent</th>
              <th className="px-4 py-3 font-semibold">Usluga</th>
              <th className="px-4 py-3 font-semibold">Zaposlenik</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ appointment, isCurrent, waitsForStatus, serviceLabel }) => (
              <tr
                key={appointment.id}
                className={`cursor-pointer border-t border-app-soft text-sm transition hover:bg-app-card-alt ${
                  isCurrent ? "bg-app-card-alt/70" : ""
                }`}
                onClick={() => setSelected(appointment)}
              >
                <td className="px-4 py-4 align-top">
                  <div className="font-semibold text-app-text">
                    {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                  </div>
                  <div className="mt-1 text-app-muted">
                    {appointment.duration_minutes} min
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="font-medium text-app-text">{appointment.client_name}</div>
                </td>
                <td className="max-w-[320px] px-4 py-4 align-top">
                  <div className="font-medium text-app-text">{serviceLabel}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: appointment.employee?.color_hex || "#999999",
                      }}
                    />
                    <span className="font-medium text-app-text">
                      {appointment.employee?.display_name ?? "-"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <RowStatus
                    appointment={appointment}
                    isCurrent={isCurrent}
                    waitsForStatus={waitsForStatus}
                  />
                </td>
                <td className="px-4 py-4 align-top text-right">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelected(appointment);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-app-soft bg-white px-3 py-2 text-xs font-semibold text-app-text transition hover:bg-app-bg"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Otvori
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map(({ appointment, isCurrent, waitsForStatus, serviceLabel }) => (
          <button
            key={appointment.id}
            type="button"
            onClick={() => setSelected(appointment)}
            className={`w-full rounded-2xl border border-app-soft bg-app-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              isCurrent ? "ring-2 ring-app-accent ring-offset-2" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-app-text">
                  {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                </div>
                <div className="mt-1 text-sm text-app-muted">
                  {appointment.duration_minutes} min
                </div>
              </div>
              <RowStatus
                appointment={appointment}
                isCurrent={isCurrent}
                waitsForStatus={waitsForStatus}
              />
            </div>
            <div className="mt-4">
              <div className="font-semibold text-app-text">{appointment.client_name}</div>
              <div className="mt-1 text-sm text-app-muted">{serviceLabel}</div>
              <div className="mt-2 text-xs text-app-muted">
                {appointment.employee?.display_name ?? "-"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) {
              setSelected(null);
              setConfirmAction(null);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-app-soft bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-app-accent">
                  Brzi pregled termina
                </p>
                <h2 className="mt-1 text-2xl font-bold text-app-text">
                  {selected.client_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={pending}
                className="rounded-full p-2 text-app-muted transition hover:bg-app-bg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-app-card-alt p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Vrijeme</p>
                <p className="mt-1 font-semibold text-app-text">
                  {selected.start_time.slice(0, 5)} - {selected.end_time.slice(0, 5)}
                </p>
                <p className="mt-1 text-sm text-app-muted">{selected.duration_minutes} min</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Status</p>
                <p className="mt-1 font-semibold text-app-text">{getStatusLabel(selected.status)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usluga</p>
                <p className="mt-1 text-app-text">{getServiceLabel(selected)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Zaposlenik</p>
                <p className="mt-1 text-app-text">{selected.employee?.display_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Soba</p>
                <p className="mt-1 text-app-text">{selected.room?.name ?? "-"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {selected.client_phone ? (
                <a
                  href={`tel:${selected.client_phone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-2 font-semibold text-app-accent"
                >
                  <Phone className="h-4 w-4" />
                  {selected.client_phone}
                </a>
              ) : null}
              {selected.client_email ? (
                <a
                  href={`mailto:${selected.client_email}`}
                  className="inline-flex items-center gap-2 font-semibold text-app-accent"
                >
                  <Mail className="h-4 w-4" />
                  {selected.client_email}
                </a>
              ) : null}
            </div>

            {(selected.client_note || selected.internal_note) ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selected.client_note ? (
                  <div className="rounded-xl border border-app-soft bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                      Napomena klijenta
                    </div>
                    <p className="mt-2 text-sm text-app-text">{selected.client_note}</p>
                  </div>
                ) : null}
                {selected.internal_note ? (
                  <div className="rounded-xl border border-app-soft bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                      Interna napomena
                    </div>
                    <p className="mt-2 text-sm text-app-text">{selected.internal_note}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link
                href={`/dashboard/appointments/${selected.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-soft px-4 py-3 font-semibold text-app-text transition hover:bg-app-bg"
              >
                <Pencil className="h-4 w-4" />
                Uredi
              </Link>

              {selected.status === "scheduled" ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => updateStatus("completed")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Odrađeno
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmAction("no_show")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-3 font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" />
                    No-show
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmAction("cancelled")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Otkaži
                  </button>
                </>
              ) : null}
            </div>

            <div className="mt-5 border-t border-app-soft pt-4">
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmAction("delete")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:underline disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Obriši termin
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={confirmAction === "no_show"}
        title="Označiti kao no-show?"
        description={
          selected
            ? `${selected.client_name} bit će označen/a kao da nije došao/la na termin u ${selected.start_time.slice(0, 5)}.`
            : ""
        }
        confirmLabel="Da, označi no-show"
        pending={pending}
        pendingLabel="Spremanje..."
        tone="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => updateStatus("no_show")}
      />

      <ConfirmActionDialog
        open={confirmAction === "cancelled"}
        title="Otkazati termin?"
        description={
          selected
            ? `Termin za ${selected.client_name} u ${selected.start_time.slice(0, 5)} bit će označen kao otkazan.`
            : ""
        }
        confirmLabel="Da, otkaži"
        pending={pending}
        pendingLabel="Otkazivanje..."
        tone="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => updateStatus("cancelled")}
      />

      <ConfirmActionDialog
        open={confirmAction === "delete"}
        title="Obrisati termin?"
        description={
          selected
            ? `Termin za ${selected.client_name} bit će trajno obrisan. Ova radnja se ne može lako vratiti.`
            : ""
        }
        confirmLabel="Da, obriši"
        pending={pending}
        pendingLabel="Brisanje..."
        tone="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={deleteSelected}
      />
    </>
  );
}
