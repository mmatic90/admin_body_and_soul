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

export type AuditLogFilters = {
  dateFrom?: string;
  dateTo?: string;
  actor?: string;
  action?: string;
  entityType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogResult = {
  items: AuditLogItem[];
  total: number;
};

export type AuditLogFilterOptions = {
  actors: Array<{ value: string; label: string }>;
  actions: string[];
  entityTypes: string[];
};

function getNextDayIso(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLogResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, created_at, actor_user_id, actor_email, actor_display_name, action, entity_type, entity_id, entity_label",
      { count: "exact" },
    );

  if (filters.dateFrom) {
    query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
  }

  if (filters.dateTo) {
    query = query.lt("created_at", getNextDayIso(filters.dateTo));
  }

  if (filters.actor) {
    query = query.eq("actor_user_id", filters.actor);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().replace(/[(),]/g, " ");
    query = query.or(
      `actor_display_name.ilike.%${search}%,actor_email.ilike.%${search}%,entity_label.ilike.%${search}%,action.ilike.%${search}%,entity_type.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti audit log.");
  }

  return {
    items: (data ?? []) as AuditLogItem[],
    total: count ?? 0,
  };
}

export async function getAuditLogFilterOptions(): Promise<AuditLogFilterOptions> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      "actor_user_id, actor_email, actor_display_name, action, entity_type",
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti filtre audit loga.");
  }

  const rows = data ?? [];
  const actorMap = new Map<string, string>();
  const actions = new Set<string>();
  const entityTypes = new Set<string>();

  for (const row of rows) {
    if (row.actor_user_id) {
      actorMap.set(
        row.actor_user_id,
        row.actor_display_name || row.actor_email || "Nepoznati korisnik",
      );
    }
    if (row.action) actions.add(row.action);
    if (row.entity_type) entityTypes.add(row.entity_type);
  }

  return {
    actors: Array.from(actorMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "hr")),
    actions: Array.from(actions).sort(),
    entityTypes: Array.from(entityTypes).sort(),
  };
}
