"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Phone, X, XCircle, UserX } from "lucide-react";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { quickUpdateAppointmentStatusAction } from "@/features/appointments/actions";
import type { TimeGridAppointment } from "@/features/calendar/time-grid-queries";

type Props = {
  appointment: TimeGridAppointment;
  top: number;
  height: number;
  isCurrent?: boolean;
};

function statusClasses(status: string) {
  switch (status) {
    case "scheduled":
      return "border-[#c7bcad] bg-[#ebe3d6]";
    case "completed":
      return "border-green-300 bg-green-50";
    case "cancelled":
      return "border-red-200 bg-red-50 opacity-90";
    case "no_show":
      return "border-amber-300 bg-amber-50";
    default:
      return "border-app-soft bg-white";
  }
}

function statusAccent(status: string) {
  switch (status) {
    case "scheduled":
      return "bg-[#B0A695]";
    case "completed":
      return "bg-green-600";
    case "cancelled":
      return "bg-red-400";
    case "no_show":
      return "bg-amber-500";
    default:
      return "bg-app-muted";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "Zakazan";
    case "completed":
      return "Odrađen";
    case "cancelled":
      return "Otkazan";
    case "no_show":
      return "No-show";
    default:
      return status;
  }
}

export default function TimeGridAppointmentBlock({
  appointment,
  top,
  height,
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
        className={`absolute left-2 right-2 overflow-hidden rounded-2xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusClasses(
          appointment.status,
        )} ${isCurrent ? "ring-2 ring-app-accent ring-offset-2" : ""}`}
        style={{ top, height }}
      >
        <div className="flex h-full">
          <div className={`w-1.5 shrink-0 ${statusAccent(appointment.status)}`} />

          <div className="min-w-0 flex-1 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isCurrent ? (
                  <span className="rounded-full bg-app-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                    U tijeku
                  </span>
                ) : null}
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-app-text">
                  {statusLabel(appointment.status)}
                </span>
              </div>
            </div>

            <div className="truncate text-sm font-semibold text-app-text">
              {appointment.client_name}
            </div>
            {appointment.service?.name ? (
              <div className="truncate text-xs text-app-muted">{appointment.service.name}</div>
            ) : null}
          </div>
        </div>
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
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-full p-2 text-app-muted transition hover:bg-app-bg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-app-card-alt p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Vrijeme</p>
                <p className="mt-1 font-semibold text-app-text">{appointment.start_time.slice(0,5)} - {appointment.end_time.slice(0,5)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Status</p>
                <p className="mt-1 font-semibold text-app-text">{statusLabel(appointment.status)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usluga</p>
                <p className="mt-1 text-app-text">{appointment.service?.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Terapeut</p>
                <p className="mt-1 text-app-text">{appointment.employee?.display_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Soba</p>
                <p className="mt-1 text-app-text">{appointment.room?.name ?? "-"}</p>
              </div>
            </div>

            {appointment.client_phone ? (
              <a href={`tel:${appointment.client_phone.replace(/\s+/g, "")}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-app-accent">
                <Phone className="h-4 w-4" /> {appointment.client_phone}
              </a>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={`/dashboard/appointments/${appointment.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-soft px-4 py-3 font-semibold text-app-text transition hover:bg-app-bg">
                <Pencil className="h-4 w-4" /> Uredi
              </Link>

              {appointment.status === "scheduled" ? (
                <>
                  <button type="button" disabled={pending} onClick={() => updateStatus("completed")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> Odrađeno
                  </button>
                  <button type="button" disabled={pending} onClick={() => setConfirmAction("no_show")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-3 font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50">
                    <UserX className="h-4 w-4" /> No-show
                  </button>
                  <button type="button" disabled={pending} onClick={() => setConfirmAction("cancelled")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
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
