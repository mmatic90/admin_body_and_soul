"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createServiceWithPricingAction } from "@/features/settings/service-pricing-actions";
import type { SettingsActionState } from "@/features/settings/actions";

const initialState: SettingsActionState = { error: "", success: "" };

export default function ServiceCreateForm() {
  const [state, formAction, pending] = useActionState(
    createServiceWithPricingAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      router.refresh();
    }
  }, [state, router]);

  const inputClass = "rounded-xl border border-neutral-300 px-4 py-3 outline-none";

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <input name="name" placeholder="Naziv usluge (HR)" className={inputClass} required />
      <input name="name_en" placeholder="Naziv usluge (EN)" className={inputClass} />
      <input name="duration_minutes" type="number" min={1} placeholder="Trajanje (min)" className={inputClass} required />
      <input name="display_order" type="number" min={1} step={1} placeholder="Redoslijed u kategoriji" className={inputClass} />

      <textarea name="description" placeholder="Opis usluge (HR)" rows={3} className="rounded-xl border border-neutral-300 px-4 py-3 outline-none md:col-span-2" />
      <textarea name="description_en" placeholder="Opis usluge (EN)" rows={3} className="rounded-xl border border-neutral-300 px-4 py-3 outline-none md:col-span-2" />

      <input name="service_group" placeholder="Kategorija (HR)" className={inputClass} />
      <input name="service_group_en" placeholder="Kategorija (EN)" className={inputClass} />
      <input name="priority_room" placeholder="Prioritetna soba" className={inputClass} />
      <input name="price_eur" type="number" min={0} step="0.01" placeholder="Fiksna cijena (€)" className={inputClass} />
      <input name="price_min_eur" type="number" min={0} step="0.01" placeholder="Min cijena (€)" className={inputClass} />
      <input name="price_max_eur" type="number" min={0} step="0.01" placeholder="Max cijena (€)" className={inputClass} />

      <div className="md:col-span-2 xl:col-span-4 flex justify-end">
        <button type="submit" disabled={pending} className="rounded-xl bg-black px-5 py-3 font-medium text-white disabled:opacity-50">
          {pending ? "Dodavanje..." : "Dodaj uslugu"}
        </button>
      </div>
    </form>
  );
}
