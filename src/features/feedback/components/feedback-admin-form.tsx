"use client";

import { FormEvent, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateFeedback } from "@/features/feedback/actions";
import type { FeedbackRow } from "@/features/feedback/types";

export default function FeedbackAdminForm({ feedback }: { feedback: FeedbackRow }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateFeedback({
        id: feedback.id,
        status: formData.get("status"),
        adminComment: formData.get("adminComment"),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Feedback je ažuriran.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-app-soft bg-app-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-app-text">Upravljanje prijavom</h2>
        <p className="mt-1 text-sm text-app-muted">Promijeni status i dodaj internu bilješku.</p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-app-text">Status</span>
        <select
          name="status"
          defaultValue={feedback.status}
          className="w-full rounded-2xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text outline-none focus:border-app-accent"
        >
          <option value="open">Otvoreno</option>
          <option value="investigating">U analizi</option>
          <option value="in_progress">U radu</option>
          <option value="waiting">Čeka odgovor</option>
          <option value="done">Riješeno</option>
          <option value="rejected">Odbijeno</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-app-text">Interni komentar</span>
        <textarea
          name="adminComment"
          defaultValue={feedback.admin_comment ?? ""}
          rows={7}
          maxLength={5000}
          placeholder="Primjer: Ispravljeno u verziji 1.2.3"
          className="w-full resize-y rounded-2xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text outline-none placeholder:text-app-muted focus:border-app-accent"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-app-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Spremam..." : "Spremi promjene"}
      </button>
    </form>
  );
}
