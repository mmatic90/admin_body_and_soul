"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  isActive: boolean;
  onToggle: () => Promise<void>;
};

export default function SettingsToggleButton({ isActive, onToggle }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await onToggle();
          router.refresh();
        })
      }
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full
        transition-all duration-200
        ${isActive ? "bg-app-accent" : "bg-app-soft"}
        ${pending ? "opacity-60 cursor-wait" : ""}
        focus:outline-none focus:ring-2 focus:ring-app-accent/40
      `}
      title={isActive ? "Aktivno" : "Neaktivno"}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow
          transition-transform duration-200
          ${isActive ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}
