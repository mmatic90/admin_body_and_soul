"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Phone, X, XCircle, UserX } from "lucide-react";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { quickUpdateAppointmentStatusAction } from "@/features/appointments/actions";
import {
  getAppointmentCardClass,
  getAppointmentStatusLabel,
} from "@/features/appointments/status-ui";

type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  client_name: string;
  client_phone: string | null;
  service: { name: string; service_group: string | null } | null;
  appointment_services?: {
    id: string;
    duration_minutes: number;
    sort_order: number;
    service: {
      id: string;
      name: string;
      service_group: string | null;
    } | null;
  }[];
  metaLabel?: string;
};

type Props = {
  appointment: Appointment;
  serviceLabel: string;
  isCurrent?: boolean;
};

export default function CalendarAppointmentCard({
  appointment,
  serviceLabel,
  isCurrent = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"cancelled" | "no_show" | null>(null);
  const [pending, startTransition] = useTransition();

  function updateStatus(status: "completed" | "cancelled" | "no_show") {
    startTransition(async () => {
      const result = await quickUpdateAppointmentStatusAction(appointment.id, status);

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setConfirmAction(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative block w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${getAppointmentCardClass(
          appointment.status,
        )} ${isCurrent ? "ring-2 ring-app-accent ring-offset-2" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-app-text">
              {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
            </div>
            <div className="mt-1 text-sm text-app-muted">
              {appointment.duration_minutes} min
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-1.5">
            {isCurrent ? (
              <span className="rounded-full bg-app-accent px-2.5 py-1 text-xs font-semibold text-white">
                U tijeku
              </span>
            ) : null}
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-app-text">
              {getAppointmentStatusLabel(appointment.status)}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-medium text-app-text">{appointment.client_name}</div>
          <div className="mt-1 text-sm text-app-text">{serviceLabel}</div>

          {appointment.service?.service_group ? (
            <div className="mt-1 text-xs text-app-muted">
              {appointment.service.service_group}
            </div>
          ) : null}
        </div>

        {appointment.metaLabel ? (
          <div className="mt-3 text-sm text-app-muted">{appointment.metaLabel}</div>
        ) : null}

        {appointment.client_phone ? (
          <div className="mt-2 text-xs text-app-muted">{appointment.client_phone}</div>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-app-soft bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-app-accent">Brzi pregled termina</p>
                  {isCurrent ? (
                    <span className="rounded-full bg-app-accent px-2 py-0.5 text-xs font-semibold text-white">
                      U tijeku
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 text-2xl font-bold text-app-text">{appointment.client_name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                  {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Status</p>
                <p className="mt-1 font-semibold text-app-text">{getAppointmentStatusLabel(appointment.status)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usluga</p>
                <p className="mt-1 text-app-text">{serviceLabel}</p>
              </div>
              {appointment.metaLabel ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Detalji</p>
                  <p className="mt-1 text-app-text">{appointment.metaLabel}</p>
                </div>
              ) : null}
            </div>

            {appointment.client_phone ? (
              <a
                href={`tel:${appointment.client_phone.replace(/\s+/g, "")}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-app-accent"
              >
                <Phone className="h-4 w-4" /> {appointment.client_phone}
              </a>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link
                href={`/dashboard/appointments/${appointment.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-soft px-4 py-3 font-semibold text-app-text transition hover:bg-app-bg"
              >
                <Pencil className="h-4 w-4" /> Uredi
              </Link>

              {appointment.status === "scheduled" ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => updateStatus("completed")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Odrađeno
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmAction("no_show")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-3 font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" /> No-show
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmAction("cancelled")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Otkaži
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={confirmAction === "no_show"}
        title="Označiti kao no-show?"
        description={`${appointment.client_name} bit će označen/a kao da nije došao/la na termin u ${appointment.start_time.slice(0, 5)}.`}
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
        description={`Termin za ${appointment.client_name} u ${appointment.start_time.slice(0, 5)} bit će označen kao otkazan.`}
        confirmLabel="Da, otkaži"
        pending={pending}
        pendingLabel="Otkazivanje..."
        tone="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => updateStatus("cancelled")}
      />
    </>
  );
}
