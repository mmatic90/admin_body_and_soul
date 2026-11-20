"use client";

import { ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConfirmActionDialog from "@/components/confirm-action-dialog";

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

      <ConfirmActionDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        pending={pending}
        pendingLabel="U tijeku..."
        tone={destructive ? "danger" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
