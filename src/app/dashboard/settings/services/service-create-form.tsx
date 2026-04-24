"use client";

import { useActionState } from "react";
import {
  createServiceAction,
  type SettingsActionState,
} from "@/features/settings/actions";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const initialState: SettingsActionState = {
  error: "",
  success: "",
};

export default function ServiceCreateForm() {
  const [state, formAction, pending] = useActionState(
    createServiceAction,
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
    <form
      action={formAction}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <input
        name="name"
        placeholder="Naziv usluge"
        className="rounded-xl border border-neutral-300 px-4 py-3 outline-none"
        required
      />
      <input
        name="duration_minutes"
        type="number"
        min={1}
        placeholder="Trajanje (min)"
        className="rounded-xl border border-neutral-300 px-4 py-3 outline-none"
        required
      />
      <input
        name="service_group"
        placeholder="Grupa usluge"
        className="rounded-xl border border-neutral-300 px-4 py-3 outline-none"
      />
      <input
        name="priority_room"
        placeholder="Prioritetna soba"
        className="rounded-xl border border-neutral-300 px-4 py-3 outline-none"
      />

      <div className="md:col-span-2 xl:col-span-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Dodavanje..." : "Dodaj uslugu"}
        </button>
      </div>
    </form>
  );
}
