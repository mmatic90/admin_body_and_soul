"use client";

import { useActionState } from "react";
import {
  createRoomAction,
  type SettingsActionState,
} from "@/features/settings/actions";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const initialState: SettingsActionState = {
  error: "",
  success: "",
};

export default function RoomCreateForm() {
  const [state, formAction, pending] = useActionState(
    createRoomAction,
    initialState,
  );

  const router = useRouter();

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }

    if (state.success) {
      toast.success(state.success);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input
        name="name"
        placeholder="Naziv sobe"
        className="w-full rounded-xl border border-app-soft bg-white px-4 py-3 text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent"
        required
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-app-accent px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Dodavanje..." : "Dodaj sobu"}
        </button>
      </div>
    </form>
  );
}
