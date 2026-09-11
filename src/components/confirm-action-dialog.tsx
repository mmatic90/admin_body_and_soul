"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  pendingLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel = "Potvrdi",
  cancelLabel = "Odustani",
  pending = false,
  pendingLabel = "Spremanje...",
  tone = "danger",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-app-border/40 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-2xl border border-app-soft bg-app-card p-6 shadow-xl">
        <h2 id="confirm-dialog-title" className="text-xl font-semibold text-app-text">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-app-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={pending} className="rounded-xl border border-app-soft bg-white px-4 py-2.5 font-medium text-app-text transition hover:bg-app-bg disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-xl px-4 py-2.5 font-medium text-white transition disabled:opacity-50 ${
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-app-accent hover:opacity-90"
            }`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
