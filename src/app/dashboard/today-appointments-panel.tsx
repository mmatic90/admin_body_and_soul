"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Pencil, Phone, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import ConfirmActionDialog from "@/components/confirm-action-dialog";
import { quickUpdateAppointmentStatusAction } from "@/features/appointments/actions";
import type { AppointmentListItem } from "@/features/appointments/types";
import {
  getAppointmentStatusBadgeClass,
  getAppointmentStatusLabel,
} from "@/features/appointments/status-ui";

type Props = {
  appointments: AppointmentListItem[];
  currentMinutes: number;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function getServiceLabel(item: AppointmentListItem) {
  const multi = item.appointment_services
    ?.slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((service) => service.service?.name)
    .filter(Boolean);

  if (multi?.length) return multi.join(" + ");
  return item.service?.name ?? "Usluga";
}

export default function TodayAppointmentsPanel({ appointments, currentMinutes }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<AppointmentListItem | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AppointmentListItem | null>(null);
  const [pending, startTransition] = useTransition();

  function markCompleted(item: AppointmentListItem) {
    startTransition(async () => {
      const result = await quickUpdateAppointmentStatusAction(item.id, "completed");
      if (result.ok) {
        toast.success("Termin je označen kao odrađen.");
        setSelected(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function cancelAppointment() {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);

    startTransition(async () => {
      const result = await quickUpdateAppointmentStatusAction(target.id, "cancelled");
      if (result.ok) {
        toast.success("Termin je otkazan.");
        setSelected(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <section className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-app-text">Danas</h2>
            <p className="mt-1 text-sm text-app-muted">
              {appointments.length} {appointments.length === 1 ? "termin" : "termina"} u rasporedu.
            </p>
          </div>
          <Link href="/dashboard/calendar/time-grid" className="inline-flex items-center gap-2 text-sm font-semibold text-app-accent">
            Otvori kalendar
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {appointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-app-soft bg-app-card-alt p-6 text-center">
              <p className="font-medium text-app-text">Danas nema aktivnih termina.</p>
              <Link href="/dashboard/appointments/new" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-app-accent">
                Dodaj termin
              </Link>
            </div>
          ) : (() => {
            const ongoing = appointments.filter((item) => {
              const start = timeToMinutes(item.start_time);
              const end = timeToMinutes(item.end_time);
              return start <= currentMinutes && currentMinutes < end;
            });
            const upcoming = appointments
              .filter((item) => timeToMinutes(item.start_time) > currentMinutes)
              .slice(0, 4);
            const compactIds = new Set([...ongoing, ...upcoming].map((item) => item.id));
            const compact = appointments.filter((item) => compactIds.has(item.id));
            const visibleAppointments = showAll ? appointments : compact;
            const hiddenCount = appointments.length - compact.length;

            return (
              <>
                {visibleAppointments.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="flex w-full flex-col gap-3 rounded-2xl border border-app-soft bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="min-w-[74px] rounded-xl bg-app-card-alt px-3 py-2 text-center">
                        <div className="text-base font-bold text-app-text">{item.start_time.slice(0, 5)}</div>
                        <div className="text-xs text-app-muted">{item.end_time.slice(0, 5)}</div>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-app-text">{item.client_name}</p>
                        <p className="truncate text-sm text-app-muted">{getServiceLabel(item)}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-app-muted">
                          {item.employee ? <span>{item.employee.display_name}</span> : null}
                          {item.room ? <span>{item.room.name}</span> : null}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getAppointmentStatusBadgeClass(
                        item.status,
                      )}`}
                    >
                      {getAppointmentStatusLabel(item.status)}
                    </span>
                  </button>
                ))}

                {!showAll && hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="block w-full rounded-xl bg-app-card-alt px-4 py-3 text-center text-sm font-semibold text-app-accent transition hover:opacity-90"
                  >
                    Prikaži još {hiddenCount} termina
                  </button>
                ) : null}

                {showAll && hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAll(false)}
                    className="block w-full rounded-xl bg-app-card-alt px-4 py-3 text-center text-sm font-semibold text-app-accent transition hover:opacity-90"
                  >
                    Prikaži samo aktualne i sljedeće termine
                  </button>
                ) : null}
              </>
            );
          })()}
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setSelected(null); }}>
          <div className="w-full max-w-lg rounded-3xl border border-app-soft bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-app-accent">Brzi pregled termina</p>
                <h2 className="mt-1 text-2xl font-bold text-app-text">{selected.client_name}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} disabled={pending} className="rounded-full p-2 text-app-muted transition hover:bg-app-bg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-app-card-alt p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Vrijeme</p>
                <p className="mt-1 font-semibold text-app-text">{selected.start_time.slice(0,5)} - {selected.end_time.slice(0,5)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usluga</p>
                <p className="mt-1 font-semibold text-app-text">{getServiceLabel(selected)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Terapeut</p>
                <p className="mt-1 text-app-text">{selected.employee?.display_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Soba</p>
                <p className="mt-1 text-app-text">{selected.room?.name ?? "-"}</p>
              </div>
            </div>

            {selected.client_phone ? (
              <a href={`tel:${selected.client_phone.replace(/\s+/g, "")}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-app-accent">
                <Phone className="h-4 w-4" /> {selected.client_phone}
              </a>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={`/dashboard/appointments/${selected.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-soft px-4 py-3 font-semibold text-app-text transition hover:bg-app-bg">
                <Pencil className="h-4 w-4" /> Uredi
              </Link>

              {selected.status === "scheduled" ? (
                <>
                  <button type="button" disabled={pending} onClick={() => markCompleted(selected)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50">
                    <CheckCircle2 className="h-4 w-4" /> Odrađeno
                  </button>
                  <button type="button" disabled={pending} onClick={() => setCancelTarget(selected)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:col-span-2">
                    <XCircle className="h-4 w-4" /> Otkaži termin
                  </button>
                </>
              ) : (
                <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-700">
                  <Clock3 className="h-4 w-4" /> Termin je odrađen
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={Boolean(cancelTarget)}
        title="Otkazati termin?"
        description={cancelTarget ? `Termin za ${cancelTarget.client_name} u ${cancelTarget.start_time.slice(0, 5)} bit će označen kao otkazan.` : ""}
        confirmLabel="Da, otkaži"
        pending={false}
        onCancel={() => setCancelTarget(null)}
        onConfirm={cancelAppointment}
      />
    </>
  );
}
