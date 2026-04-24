"use client";

import { ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type ActionResult = {
  ok: boolean;
  message: string;
};

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  trigger: ReactNode;
  action: () => Promise<ActionResult>;
  destructive?: boolean;
};

export default function ConfirmActionButton({
  title,
  description,
  confirmLabel = "Potvrdi",
  cancelLabel = "Odustani",
  trigger,
  action,
  destructive = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action();

      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {trigger}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-app-border/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-app-soft bg-app-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-app-text">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-app-muted transition hover:bg-app-bg hover:text-app-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg disabled:opacity-50"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                  destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-app-accent hover:opacity-90"
                }`}
              >
                {pending ? "U tijeku..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
