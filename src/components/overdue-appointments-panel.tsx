"use client";

import { useState, useTransition } from "react";
import { quickUpdateAppointmentStatusAction } from "@/features/appointments/actions";

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

export default function OverdueAppointmentsPanel({ items }: Props) {
  const [appointments, setAppointments] = useState(items);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  if (appointments.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-app-soft bg-app-card p-4 shadow-sm">
      <div className="text-sm font-semibold text-app-text">
        Termini koji čekaju potvrdu statusa
      </div>
      <div className="mt-1 text-sm text-app-muted">
        Ovi termini su prošli, a još su označeni kao zakazani.
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

      <div className="mt-4 grid gap-3">
        {appointments.map((item) => {
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
                {item.appointment_date} · {item.start_time.slice(0, 5)} -{" "}
                {item.end_time.slice(0, 5)}
              </div>

              <div className="mt-1 text-sm text-app-muted">
                {item.service?.name || "-"} ·{" "}
                {item.employee?.display_name || "-"}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleUpdate(item.id, "completed")}
                  className="rounded-xl bg-app-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Odrađeno
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleUpdate(item.id, "no_show")}
                  className="rounded-xl bg-app-dark px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  No-show
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
