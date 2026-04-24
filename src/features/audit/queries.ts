import { createClient } from "@/lib/supabase/server";

export type AuditLogItem = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_display_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
};

export async function getAuditLogs(limit = 300): Promise<AuditLogItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "id, created_at, actor_user_id, actor_email, actor_display_name, action, entity_type, entity_id, entity_label",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti audit log.");
  }

  return (data ?? []) as AuditLogItem[];
}
