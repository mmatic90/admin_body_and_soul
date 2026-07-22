"use client";

import { FormEvent, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteFeedback, updateFeedback } from "@/features/feedback/actions";
import type { FeedbackRow } from "@/features/feedback/types";

export default function FeedbackAdminForm({ feedback }: { feedback: FeedbackRow }) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

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
      router.refresh();
    });
  }

  function handleDelete() {
    const screenshotText = feedback.screenshot_path
      ? "\n\nUz prijavu će biti trajno obrisan i pripadajući screenshot."
      : "";
    const confirmed = window.confirm(
      `Jeste li sigurni da želite trajno obrisati ovaj feedback?${screenshotText}\n\nOvu radnju nije moguće poništiti.`,
    );

    if (!confirmed) return;

    startDeleteTransition(async () => {
      const result = await deleteFeedback(feedback.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Feedback i povezani screenshot uspješno su obrisani.");
      router.push("/dashboard/feedback");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
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
          disabled={isPending || isDeleting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-app-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Spremam..." : "Spremi promjene"}
        </button>
      </form>

      <section className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-base font-bold text-red-800">Trajno brisanje</h2>
        <p className="mt-2 text-sm leading-6 text-red-700">
          Briše prijavu, interni komentar i povezani screenshot iz Supabase Storagea.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {isDeleting ? "Brišem..." : "Obriši feedback"}
        </button>
      </section>
    </div>
  );
}
