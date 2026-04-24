"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

export type ClientFormValues = {
  full_name: string;
  phone: string;
  email: string;
  note: string;
  internal_note: string;
};

export type ClientActionState = {
  error: string;
  values: ClientFormValues;
};

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableText(value: FormDataEntryValue | null) {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed.length > 0 ? parsed : null;
}

function getFormValues(formData: FormData): ClientFormValues {
  return {
    full_name: normalizeText(formData.get("full_name")),
    phone: normalizeText(formData.get("phone")),
    email: normalizeText(formData.get("email")),
    note: normalizeText(formData.get("note")),
    internal_note: normalizeText(formData.get("internal_note")),
  };
}

export async function createClientAction(
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const supabase = await createClient();
  const values = getFormValues(formData);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Niste prijavljeni.",
      values,
    };
  }

  if (!values.full_name) {
    return {
      error: "Ime klijenta je obavezno.",
      values,
    };
  }

  const payload = {
    full_name: values.full_name,
    phone: normalizeNullableText(formData.get("phone")),
    email: normalizeNullableText(formData.get("email")),
    note: normalizeNullableText(formData.get("note")),
    internal_note: normalizeNullableText(formData.get("internal_note")),
    is_active: true,
  };

  const { data: client, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("id")
    .single();

  if (error || !client) {
    return {
      error: error?.message || "Nije moguće spremiti klijenta.",
      values,
    };
  }

  await writeAuditLog({
    action: "client_created",
    entityType: "client",
    entityId: client.id,
    entityLabel: values.full_name,
    details: payload,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/clients/new");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/appointments/new");

  redirect("/dashboard/clients");
}

export async function updateClientAction(
  clientId: string,
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const supabase = await createClient();
  const values = getFormValues(formData);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Niste prijavljeni.",
      values,
    };
  }

  if (!values.full_name) {
    return {
      error: "Ime klijenta je obavezno.",
      values,
    };
  }

  const { data: beforeClient, error: beforeError } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, note, internal_note, is_active")
    .eq("id", clientId)
    .maybeSingle();

  if (beforeError) {
    return {
      error: beforeError.message,
      values,
    };
  }

  const payload = {
    full_name: values.full_name,
    phone: normalizeNullableText(formData.get("phone")),
    email: normalizeNullableText(formData.get("email")),
    note: normalizeNullableText(formData.get("note")),
    internal_note: normalizeNullableText(formData.get("internal_note")),
  };

  const { error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", clientId);

  if (error) {
    return {
      error: error.message,
      values,
    };
  }

  await writeAuditLog({
    action: "client_updated",
    entityType: "client",
    entityId: clientId,
    entityLabel: values.full_name,
    details: {
      before: beforeClient,
      after: payload,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/clients/${clientId}/edit`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/appointments/new");

  redirect(`/dashboard/clients/${clientId}`);
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Niste prijavljeni.",
    };
  }

  const { data: clientBefore } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, note, internal_note, is_active")
    .eq("id", clientId)
    .maybeSingle();

  const { error } = await supabase
    .from("clients")
    .update({ is_active: false })
    .eq("id", clientId);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  await writeAuditLog({
    action: "client_deleted",
    entityType: "client",
    entityId: clientId,
    entityLabel: clientBefore?.full_name ?? null,
    details: {
      soft_delete: true,
      before: clientBefore,
      after: {
        is_active: false,
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/clients/new");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/appointments/new");
  revalidatePath("/dashboard/appointments/[id]/edit");

  return {
    ok: true,
    message: "Klijent je uklonjen s liste.",
  };
}
