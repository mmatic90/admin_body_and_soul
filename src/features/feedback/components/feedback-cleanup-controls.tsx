"use client";

import { useTransition } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cleanupOldFeedback } from "@/features/feedback/actions";

export default function FeedbackCleanupControls({ candidateCount }: { candidateCount: number }) {
  const [isPending, startTransition] = useTransition();

  function handleCleanup() {
    const confirmed = window.confirm(
      `Trajno obrisati ${candidateCount} starih prijava i njihove screenshotove?\n\nRiješene prijave čuvaju se 90 dana, a odbijene 30 dana. Ovu radnju nije moguće poništiti.`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await cleanupOldFeedback();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.deletedCount
          ? `Obrisano prijava: ${result.deletedCount}.`
          : "Nema prijava koje ispunjavaju uvjete za čišćenje.",
      );
      window.location.reload();
    });
  }

  return (
    <button
      type="button"
      onClick={handleCleanup}
      disabled={isPending || candidateCount === 0}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      {isPending ? "Čistim..." : `Očisti stare prijave (${candidateCount})`}
    </button>
  );
}
