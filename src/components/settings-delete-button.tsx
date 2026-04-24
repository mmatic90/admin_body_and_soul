"use client";

import { Trash2 } from "lucide-react";
import ConfirmActionButton from "@/components/confirm-action-button";

type DeleteResult = {
  ok: boolean;
  message: string;
};

type Props = {
  label: string;
  onDelete: () => Promise<DeleteResult>;
};

export default function SettingsDeleteButton({ label, onDelete }: Props) {
  return (
    <ConfirmActionButton
      title="Obrisati zapis?"
      description={`Jesi li siguran da želiš obrisati: ${label}? Ova radnja se ne može lako vratiti.`}
      confirmLabel="Obriši"
      cancelLabel="Odustani"
      action={onDelete}
      destructive
      trigger={
        <span className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white p-2 text-red-700 transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm">
          <Trash2 className="h-4 w-4" />
        </span>
      }
    />
  );
}
