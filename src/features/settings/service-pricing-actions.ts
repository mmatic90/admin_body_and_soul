"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import type { SettingsActionState } from "./actions";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Niste prijavljeni.");
  return supabase;
}

function normalizeNullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseEuroInput(value: unknown) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return Number.NaN;
  return Math.round(parsed * 100);
}

function parseDisplayOrder(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return Number.NaN;
  return parsed;
}

function validatePrices(args: {
  fixed: number | null;
  min: number | null;
  max: number | null;
}) {
  const { fixed, min, max } = args;
  if ([fixed, min, max].some((value) => Number.isNaN(value))) {
    return "Cijene moraju biti pozitivni brojevi.";
  }
  const hasMin = min !== null;
  const hasMax = max !== null;
  if (hasMin !== hasMax) {
    return "Za raspon cijena potrebno je unijeti i minimalnu i maksimalnu cijenu.";
  }
  if (min !== null && max !== null && max < min) {
    return "Maksimalna cijena ne može biti manja od minimalne.";
  }
  if (fixed !== null && min !== null && max !== null) {
    return "Odaberi ili fiksnu cijenu ili raspon cijena, ne oboje.";
  }
  return null;
}

export async function createServiceWithPricingAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const supabase = await requireUser();
    const name = String(formData.get("name") ?? "").trim();
    const nameEn = normalizeNullableText(formData.get("name_en"));
    const description = normalizeNullableText(formData.get("description"));
    const descriptionEn = normalizeNullableText(formData.get("description_en"));
    const durationMinutes = Number(formData.get("duration_minutes") ?? 0);
    const fixed = parseEuroInput(formData.get("price_eur"));
    const min = parseEuroInput(formData.get("price_min_eur"));
    const max = parseEuroInput(formData.get("price_max_eur"));
    const displayOrder = parseDisplayOrder(formData.get("display_order"));
    const serviceGroup = normalizeNullableText(formData.get("service_group"));
    const serviceGroupEn = normalizeNullableText(formData.get("service_group_en"));
    const priorityRoom = normalizeNullableText(formData.get("priority_room"));

    if (!name) return { error: "Naziv usluge je obavezan.", success: "" };
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return { error: "Trajanje mora biti veće od 0.", success: "" };
    }
    if (Number.isNaN(displayOrder)) {
      return { error: "Redoslijed mora biti cijeli broj veći od 0.", success: "" };
    }
    const priceError = validatePrices({ fixed, min, max });
    if (priceError) return { error: priceError, success: "" };

    const payload = {
      name,
      name_en: nameEn,
      description,
      description_en: descriptionEn,
      duration_minutes: durationMinutes,
      price_cents: fixed,
      price_min_cents: min,
      price_max_cents: max,
      display_order: displayOrder,
      service_group: serviceGroup,
      service_group_en: serviceGroupEn,
      priority_room: priorityRoom,
      is_active: true,
      is_online_bookable: false,
    };

    const { data, error } = await supabase
      .from("services")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message, success: "" };

    await writeAuditLog({
      action: "service_created",
      entityType: "service",
      entityId: data?.id ?? null,
      entityLabel: name,
      details: payload,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/services");
    revalidatePath("/");
    revalidatePath("/booking");
    return { error: "", success: "Usluga je dodana." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Došlo je do greške.",
      success: "",
    };
  }
}

export async function bulkUpdateServicesWithPricingAction(
  items: Array<{
    id: string;
    name: string;
    name_en: string;
    description: string;
    description_en: string;
    duration_minutes: number;
    price_cents: number | null;
    price_min_cents: number | null;
    price_max_cents: number | null;
    display_order: number | null;
    service_group: string | null;
    service_group_en: string;
    priority_room: string | null;
    is_active: boolean;
    is_online_bookable: boolean;
  }>,
) {
  try {
    const supabase = await requireUser();

    for (const item of items) {
      if (!item.name.trim()) return { ok: false, message: "Svaka usluga mora imati naziv." };
      if (!Number.isFinite(item.duration_minutes) || item.duration_minutes <= 0) {
        return { ok: false, message: "Trajanje svake usluge mora biti veće od 0." };
      }
      if (item.display_order !== null && (!Number.isInteger(item.display_order) || item.display_order < 1)) {
        return { ok: false, message: `${item.name}: redoslijed mora biti cijeli broj veći od 0.` };
      }
      const priceError = validatePrices({
        fixed: item.price_cents,
        min: item.price_min_cents,
        max: item.price_max_cents,
      });
      if (priceError) return { ok: false, message: `${item.name}: ${priceError}` };
    }

    const ids = items.map((item) => item.id);
    const { data: beforeItems } = await supabase
      .from("services")
      .select("*")
      .in("id", ids);

    const payload = items.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      name_en: item.name_en.trim() || null,
      description: item.description.trim() || null,
      description_en: item.description_en.trim() || null,
      duration_minutes: item.duration_minutes,
      price_cents: item.price_cents,
      price_min_cents: item.price_min_cents,
      price_max_cents: item.price_max_cents,
      display_order: item.display_order,
      service_group: item.service_group?.trim() || null,
      service_group_en: item.service_group_en.trim() || null,
      priority_room: item.priority_room?.trim() || null,
      is_active: Boolean(item.is_active),
      is_online_bookable: Boolean(item.is_online_bookable),
    }));

    const { error } = await supabase
      .from("services")
      .upsert(payload, { onConflict: "id" });
    if (error) return { ok: false, message: error.message };

    await writeAuditLog({
      action: "services_bulk_updated",
      entityType: "service",
      entityLabel: "bulk update services",
      details: { before: beforeItems ?? [], after: payload },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/services");
    revalidatePath("/");
    revalidatePath("/booking");
    return { ok: true, message: "Izmjene usluga su spremljene." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Došlo je do greške pri spremanju.",
    };
  }
}
