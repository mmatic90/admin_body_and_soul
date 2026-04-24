"use server";

import { createClient } from "@/lib/supabase/server";

type WriteAuditLogArgs = {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, unknown>;
};

export async function writeAuditLog({
  action,
  entityType,
  entityId = null,
  entityLabel = null,
  details = {},
}: WriteAuditLogArgs) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let actorDisplayName: string | null = null;
    let actorEmail: string | null = user?.email ?? null;

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .maybeSingle();

      actorDisplayName = profile?.display_name ?? null;
      actorEmail = profile?.email ?? actorEmail;
    }

    const { error } = await supabase.from("audit_logs").insert({
      actor_user_id: user?.id ?? null,
      actor_email: actorEmail,
      actor_display_name: actorDisplayName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_label: entityLabel,
      details,
    });

    if (error) {
      console.error("Audit log insert error:", error);
    }
  } catch (error) {
    console.error("writeAuditLog error:", error);
  }
}
