"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { quickUpdateAppointmentStatusAction } from "@/features/appointments/actions";
import ConfirmActionDialog from "@/components/confirm-action-dialog";

type Item = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  service: {
    id: string;
    name: string;
  } | null;
  employee: {
    id: string;
    display_name: string;
  } | null;
};

type Props = {
  items: Item[];
};

function getDateDaysAgo(days: number) {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() - days);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export default function OverdueAppointmentsPanel({ items }: Props) {
  const [appointments, setAppointments] = useState(items);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [noShowTarget, setNoShowTarget] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();

  const cutoff = useMemo(() => getDateDaysAgo(3), []);
  const recent = appointments.filter((item) => item.appointment_date >= cutoff);
  const older = appointments.filter((item) => item.appointment_date < cutoff);
  const visible = showOlder ? appointments : recent;

  async function handleUpdate(
    appointmentId: string,
    status: "completed" | "no_show",
  ) {
    setPendingId(appointmentId);

    startTransition(async () => {
      const result = await quickUpdateAppointmentStatusAction(
        appointmentId,
        status,
      );

      setMessage(result.message);
      setIsError(!result.ok);

      if (result.ok) {
        setAppointments((prev) =>
          prev.filter((item) => item.id !== appointmentId),
        );
      }

      setPendingId(null);
    });
  }

  function confirmNoShow() {
    if (!noShowTarget) return;
    const id = noShowTarget.id;
    setNoShowTarget(null);
    void handleUpdate(id, "no_show");
  }

  if (appointments.length === 0) {
    return null;
  }

  return (
    <>
      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-app-text">
                  Status treba potvrditi
                </h2>
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">
                  {appointments.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-app-muted">
                Prikazani su završeni termini iz zadnja 3 dana koji su još označeni kao zakazani.
              </p>
            </div>
          </div>

          {older.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowOlder((value) => !value)}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-app-text transition hover:bg-amber-50"
            >
              {showOlder ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Sakrij starije
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Prikaži starije ({older.length})
                </>
              )}
            </button>
          ) : null}
        </div>

        {message ? (
          <div
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              isError
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        {visible.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => {
              const disabled = isPending && pendingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-app-soft bg-white px-4 py-3"
                >
                  <div className="font-medium text-app-text">
                    {item.client_name}
                  </div>

                  <div className="mt-1 text-sm text-app-muted">
                    {formatDate(item.appointment_date)} · {item.start_time.slice(0, 5)} -{" "}
                    {item.end_time.slice(0, 5)}
                  </div>

                  <div className="mt-1 truncate text-sm text-app-muted">
                    {item.service?.name || "-"} ·{" "}
                    {item.employee?.display_name || "-"}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleUpdate(item.id, "completed")}
                      className="flex-1 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      Odrađeno
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setNoShowTarget(item)}
                      className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      No-show
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/70 px-4 py-3 text-sm text-app-muted">
            Nema termina iz zadnja 3 dana koji čekaju potvrdu. Stariji termini su spremljeni pod „Prikaži starije”.
          </div>
        )}
      </section>

      <ConfirmActionDialog
        open={Boolean(noShowTarget)}
        title="Označiti kao no-show?"
        description={
          noShowTarget
            ? `${noShowTarget.client_name} će biti označen/a kao da nije došao/la na termin ${formatDate(noShowTarget.appointment_date)} u ${noShowTarget.start_time.slice(0, 5)}.`
            : ""
        }
        confirmLabel="Da, označi no-show"
        pending={false}
        onCancel={() => setNoShowTarget(null)}
        onConfirm={confirmNoShow}
      />
    </>
  );
}
