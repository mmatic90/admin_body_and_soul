"use client";

import { useEffect, useState } from "react";
import type { AppointmentServiceInput } from "@/features/appointments/types";

type Suggestion = {
  start_time: string;
  end_time: string;
  employee_id: string;
  employee_name: string;
  room_id: string;
  room_name: string;
};

type Props = {
  date: string;
  items: AppointmentServiceInput[];
  onApply: (payload: {
    start_time: string;
    employee_id: string;
    room_id: string;
  }) => void;
};

export default function SmartAvailability({ date, items, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const validItems = items.filter(
        (item) => item.service_id && Number(item.duration_minutes) > 0,
      );

      if (!date || validItems.length === 0) {
        setSuggestions([]);
        setReason("");
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      setReason("");

      try {
        const response = await fetch(`/api/availability/smart`, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            items: validItems,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Greška pri dohvaćanju termina.");
        }

        if (!cancelled) {
          setSuggestions(result.suggestions ?? []);
          setReason(result.reason ?? "");
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Greška pri dohvaćanju termina.",
          );
          setSuggestions([]);
          setReason("");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [date, items]);

  const hasValidItems = items.some(
    (item) => item.service_id && Number(item.duration_minutes) > 0,
  );

  if (!date || !hasValidItems) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="text-sm font-semibold text-neutral-900">
        Pametni prijedlozi termina
      </div>

      <div className="mt-1 text-sm text-neutral-600">
        Prikazana su 3 najranija slobodna termina za sve odabrane usluge.
      </div>

      {loading ? (
        <div className="mt-3 text-sm text-neutral-500">
          Tražim slobodne termine...
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && reason ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {reason}
        </div>
      ) : null}

      {!loading && !error && suggestions.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {suggestions.map((item, index) => (
            <button
              key={`${item.start_time}-${item.employee_id}-${item.room_id}-${index}`}
              type="button"
              onClick={() =>
                onApply({
                  start_time: item.start_time,
                  employee_id: item.employee_id,
                  room_id: item.room_id,
                })
              }
              className="rounded-xl border border-neutral-200 px-4 py-3 text-left transition hover:bg-neutral-50"
            >
              <div className="font-medium text-neutral-900">
                {item.start_time} - {item.end_time}
              </div>
              <div className="mt-1 text-sm text-neutral-600">
                {item.employee_name}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {item.room_name}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
