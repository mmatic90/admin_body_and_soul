"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function OnlineBookingBadge() {
  const [count, setCount] = useState(0);
  const previousCountRef = useRef<number | null>(null);

  async function loadCount() {
    try {
      const res = await fetch("/api/online-bookings/pending-count", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      const nextCount = Number(data.count ?? 0);

      const previousCount = previousCountRef.current;

      if (previousCount !== null && nextCount > previousCount) {
        const diff = nextCount - previousCount;

        toast.info(
          diff === 1
            ? "Stigla je nova online rezervacija."
            : `Stiglo je ${diff} novih online rezervacija.`,
          {
            description: "Otvori Online rezervacije za pregled zahtjeva.",
            action: {
              label: "Otvori",
              onClick: () => {
                window.location.href = "/dashboard/online-bookings";
              },
            },
          },
        );
      }

      previousCountRef.current = nextCount;
      setCount(nextCount);
    } catch (error) {
      console.error("Greška pri dohvaćanju broja online rezervacija:", error);
    }
  }

  useEffect(() => {
    loadCount();

    const interval = window.setInterval(() => {
      loadCount();
    }, 20000);

    return () => window.clearInterval(interval);
  }, []);

  if (count <= 0) return null;

  return (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
      {count}
    </span>
  );
}
