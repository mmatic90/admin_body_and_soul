"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  label?: string;
  value: string;
  basePath: string;
  extraParams?: Record<string, string>;
};

export default function DateQueryPicker({
  label = "Odaberi datum",
  value,
  basePath,
  extraParams = {},
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localValue, setLocalValue] = useState(value);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(nextDate: string) {
    setLocalValue(nextDate);

    const params = new URLSearchParams(searchParams.toString());
    params.set("date", nextDate);

    Object.entries(extraParams).forEach(([key, val]) => {
      params.set(key, val);
    });

    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-1">
      <label htmlFor="date" className="block text-sm font-medium text-app-text">
        {label}
      </label>

      <div className="flex items-center gap-3">
        <input
          id="date"
          name="date"
          type="date"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-xl border border-app-soft bg-white px-4 py-2 text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
        />

        {isPending ? (
          <span className="text-sm text-app-muted">Učitavanje...</span>
        ) : null}
      </div>
    </div>
  );
}
