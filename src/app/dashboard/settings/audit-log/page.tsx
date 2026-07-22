import Link from "next/link";
import { requireAdminForSettings } from "@/lib/page-guards";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";
import EmptyStateCard from "@/components/empty-state-card";
import { getAuditLogFilterOptions, getAuditLogs } from "@/features/audit/queries";
import {
  AuditLogNavigationLink,
  AuditLogScrollRestorer,
} from "@/features/audit/components/audit-log-navigation";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date(value));
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    appointment_created: "Dodan termin", appointment_updated: "Uređen termin",
    appointment_cancelled: "Otkazan termin", appointment_status_changed: "Promijenjen status termina",
    appointment_deleted: "Obrisan termin", client_created: "Dodan klijent",
    client_updated: "Uređen klijent", client_deleted: "Obrisan klijent",
    employee_created: "Dodan zaposlenik", employee_updated: "Uređen zaposlenik",
    employee_deactivated: "Deaktiviran zaposlenik", employee_password_reset: "Resetirana lozinka zaposlenika",
    service_created: "Dodana usluga", service_deleted: "Obrisana usluga", services_bulk_updated: "Uređene usluge",
    room_created: "Dodana soba", room_deleted: "Obrisana soba", rooms_bulk_updated: "Uređene sobe",
    equipment_created: "Dodana oprema", equipment_deleted: "Obrisana oprema", equipment_bulk_updated: "Uređena oprema",
    service_rooms_bulk_updated: "Uređeno mapiranje usluga i soba",
    employee_services_bulk_updated: "Uređeno mapiranje zaposlenika i usluga",
    service_equipment_bulk_updated: "Uređeno mapiranje usluga i opreme",
    salon_hours_bulk_updated: "Uređeno radno vrijeme salona",
    service_group_limits_bulk_updated: "Uređeni group limits",
  };
  return labels[action] ?? action;
}

function entityLabel(type: string) {
  const labels: Record<string, string> = {
    appointment: "Termin", client: "Klijent", employee: "Zaposlenik", service: "Usluga",
    room: "Soba", equipment: "Oprema", service_room_mapping: "Usluge i sobe",
    employee_service_mapping: "Zaposlenici i usluge", service_equipment_mapping: "Usluge i oprema",
    salon_working_hours: "Radno vrijeme", service_group_limit: "Group limits",
  };
  return labels[type] ?? type;
}

function actionBadgeClass(action: string) {
  if (/deleted|cancelled|deactivated/.test(action)) return "bg-red-50 text-red-700 ring-red-200";
  if (action.includes("created")) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (/updated|changed/.test(action)) return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const readParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

function buildHref(current: Record<string, string>, updates: Record<string, string | number | undefined>) {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") params.delete(key); else params.set(key, String(value));
  }
  return `?${params.toString()}`;
}

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminForSettings();
  const raw = await searchParams;
  const params = {
    dateFrom: readParam(raw.dateFrom), dateTo: readParam(raw.dateTo),
    timestampFrom: readParam(raw.timestampFrom), timestampTo: readParam(raw.timestampTo),
    actor: readParam(raw.actor), action: readParam(raw.action), entityType: readParam(raw.entityType),
    search: readParam(raw.search), selected: readParam(raw.selected),
    page: Math.max(1, Number(readParam(raw.page)) || 1),
    pageSize: [25, 50, 100, 200].includes(Number(readParam(raw.pageSize))) ? Number(readParam(raw.pageSize)) : 50,
  };

  const today = new Date();
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 6);
  const [result, options, todayResult, weekResult] = await Promise.all([
    getAuditLogs(params), getAuditLogFilterOptions(),
    getAuditLogs({ dateFrom: formatDateInput(today), dateTo: formatDateInput(today), pageSize: 1 }),
    getAuditLogs({ dateFrom: formatDateInput(sevenDaysAgo), dateTo: formatDateInput(today), pageSize: 1 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / params.pageSize));
  const safePage = Math.min(params.page, totalPages);
  const activeParams: Record<string, string> = {
    ...(params.dateFrom && { dateFrom: params.dateFrom }), ...(params.dateTo && { dateTo: params.dateTo }),
    ...(params.timestampFrom && { timestampFrom: params.timestampFrom }), ...(params.timestampTo && { timestampTo: params.timestampTo }),
    ...(params.actor && { actor: params.actor }), ...(params.action && { action: params.action }),
    ...(params.entityType && { entityType: params.entityType }), ...(params.search && { search: params.search }),
    pageSize: String(params.pageSize),
  };
  const currentPageParams = { ...activeParams, page: String(safePage) };
  const selectedIndex = result.items.findIndex((log) => log.id === params.selected);
  const selectedLog = selectedIndex >= 0 ? result.items[selectedIndex] : null;
  const previousLog = selectedIndex > 0 ? result.items[selectedIndex - 1] : null;
  const nextLog = selectedIndex >= 0 && selectedIndex < result.items.length - 1 ? result.items[selectedIndex + 1] : null;
  const exportParams = new URLSearchParams(activeParams); exportParams.delete("pageSize");
  const exportHref = `/dashboard/settings/audit-log/export${exportParams.size ? `?${exportParams}` : ""}`;
  const quickRanges = [
    ["Danas", formatDateInput(today), formatDateInput(today)],
    ["Zadnjih 7 dana", formatDateInput(sevenDaysAgo), formatDateInput(today)],
    ["Zadnjih 30 dana", formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)), formatDateInput(today)],
    ["Ovaj mjesec", formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)), formatDateInput(today)],
  ];

  return (
    <PageShell maxWidth="max-w-7xl">
      <AuditLogScrollRestorer />
      <PageHeader title="Audit log" description="Pregled, pretraživanje i filtriranje svih važnih akcija u sustavu." actions={
        <div className="flex flex-wrap gap-2">
          <a href={exportHref} className="rounded-xl bg-app-text px-4 py-2 text-sm font-semibold text-white">Izvezi CSV</a>
          <Link href="/dashboard/settings" className="rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium text-app-text">Natrag</Link>
        </div>
      } />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Pronađene aktivnosti", result.total], ["Korisnici u zapisniku", options.actors.length], ["Aktivnosti danas", todayResult.total], ["Zadnjih 7 dana", weekResult.total]].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm"><p className="text-sm text-app-muted">{label}</p><p className="mt-2 text-3xl font-semibold text-app-text">{value}</p></div>
        ))}
      </div>

      <PageSection title="Filtri">
        <div className="space-y-4 rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {quickRanges.map(([label, from, to]) => <Link key={label} href={buildHref(activeParams, { dateFrom: from, dateTo: to, timestampFrom: undefined, timestampTo: undefined, page: 1 })} className="rounded-full border border-app-soft px-3 py-1.5 text-sm font-medium">{label}</Link>)}
            <Link href={buildHref(activeParams, { dateFrom: undefined, dateTo: undefined, timestampFrom: undefined, timestampTo: undefined, page: 1 })} className="rounded-full border border-app-soft px-3 py-1.5 text-sm font-medium">Sve</Link>
          </div>
          {params.timestampFrom && params.timestampTo ? <p className="rounded-xl bg-app-card-alt px-4 py-3 text-sm text-app-muted">Prikazane su aktivnosti u preciznom vremenskom rasponu povezanom s feedback prijavom.</p> : null}
          <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1 text-sm text-app-muted"><span>Datum od</span><input type="date" name="dateFrom" defaultValue={params.dateFrom} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2" /></label>
            <label className="space-y-1 text-sm text-app-muted"><span>Datum do</span><input type="date" name="dateTo" defaultValue={params.dateTo} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2" /></label>
            <label className="space-y-1 text-sm text-app-muted"><span>Korisnik</span><select name="actor" defaultValue={params.actor} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2"><option value="">Svi korisnici</option>{options.actors.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label>
            <label className="space-y-1 text-sm text-app-muted"><span>Akcija</span><select name="action" defaultValue={params.action} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2"><option value="">Sve akcije</option>{options.actions.map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}</select></label>
            <label className="space-y-1 text-sm text-app-muted"><span>Entitet</span><select name="entityType" defaultValue={params.entityType} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2"><option value="">Svi entiteti</option>{options.entityTypes.map((e) => <option key={e} value={e}>{entityLabel(e)}</option>)}</select></label>
            <label className="space-y-1 text-sm text-app-muted"><span>Pretraga</span><input name="search" defaultValue={params.search} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2" /></label>
            <input type="hidden" name="pageSize" value={params.pageSize} />
            <div className="flex gap-2 md:col-span-2 xl:col-span-6"><button className="rounded-xl bg-app-text px-4 py-2 text-sm font-semibold text-white">Primijeni filtre</button><Link href="/dashboard/settings/audit-log" className="rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium">Resetiraj</Link></div>
          </form>
        </div>
      </PageSection>

      <PageSection title="Zapisnik aktivnosti">
        <div className="rounded-2xl border border-app-soft bg-app-card shadow-sm">
          {result.items.length === 0 ? <div className="p-6"><EmptyStateCard title="Nema zapisa" description="Nema aktivnosti koje odgovaraju odabranim filtrima." /></div> : (
            <div className="overflow-x-auto"><table className="min-w-full border-collapse"><thead className="bg-app-table-head"><tr className="text-left text-sm text-app-muted"><th className="px-4 py-3">Datum i vrijeme</th><th className="px-4 py-3">Akcija</th><th className="px-4 py-3">Korisnik</th><th className="px-4 py-3">Entitet</th><th className="px-4 py-3 text-right">Detalji</th></tr></thead><tbody>
              {result.items.map((log) => <tr key={log.id} className="border-t border-app-soft text-sm hover:bg-app-card-alt"><td className="whitespace-nowrap px-4 py-4">{formatDateTime(log.created_at)}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${actionBadgeClass(log.action)}`}>{actionLabel(log.action)}</span></td><td className="px-4 py-4">{log.actor_display_name || log.actor_email || "Nepoznato"}</td><td className="px-4 py-4">{entityLabel(log.entity_type)}{log.entity_label ? <span className="text-app-muted"> · {log.entity_label}</span> : null}</td><td className="px-4 py-4 text-right"><AuditLogNavigationLink href={buildHref(currentPageParams, { selected: log.id })} className="rounded-lg border border-app-soft bg-white px-3 py-1.5 text-xs font-semibold">Otvori</AuditLogNavigationLink></td></tr>)}
            </tbody></table></div>
          )}
          <div className="flex flex-col gap-3 border-t border-app-soft p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-app-muted"><span>Prikaz:</span>{[25,50,100,200].map((size) => <Link key={size} href={buildHref(activeParams, { pageSize: size, page: 1 })} className={`rounded-lg px-2.5 py-1 ${params.pageSize === size ? "bg-app-text text-white" : "border border-app-soft bg-white"}`}>{size}</Link>)}</div><div className="flex items-center gap-3 text-sm"><Link href={safePage > 1 ? buildHref(activeParams, { page: safePage - 1 }) : "#"} className={safePage <= 1 ? "pointer-events-none opacity-40" : "rounded-xl border border-app-soft px-3 py-2"}>← Prethodna</Link><span>Stranica {safePage} od {totalPages}</span><Link href={safePage < totalPages ? buildHref(activeParams, { page: safePage + 1 }) : "#"} className={safePage >= totalPages ? "pointer-events-none opacity-40" : "rounded-xl border border-app-soft px-3 py-2"}>Sljedeća →</Link></div></div>
        </div>
      </PageSection>

      {selectedLog ? <div className="fixed inset-0 z-50 flex justify-end bg-black/30"><AuditLogNavigationLink href={buildHref(currentPageParams, { selected: undefined })} ariaLabel="Zatvori detalje" className="absolute inset-0"> </AuditLogNavigationLink><aside className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-app-soft bg-app-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-app-muted">Audit zapis</p><h2 className="mt-1 text-2xl font-semibold">{actionLabel(selectedLog.action)}</h2></div><AuditLogNavigationLink href={buildHref(currentPageParams, { selected: undefined })} className="rounded-xl border border-app-soft bg-white px-3 py-2 text-sm font-medium">Zatvori</AuditLogNavigationLink></div><div className="mt-5 flex gap-2"><AuditLogNavigationLink href={previousLog ? buildHref(currentPageParams, { selected: previousLog.id }) : "#"} className={`flex-1 rounded-xl border border-app-soft px-3 py-2 text-center text-sm ${previousLog ? "bg-white" : "pointer-events-none opacity-40"}`}>← Prethodni</AuditLogNavigationLink><AuditLogNavigationLink href={nextLog ? buildHref(currentPageParams, { selected: nextLog.id }) : "#"} className={`flex-1 rounded-xl border border-app-soft px-3 py-2 text-center text-sm ${nextLog ? "bg-white" : "pointer-events-none opacity-40"}`}>Sljedeći →</AuditLogNavigationLink></div><div className="mt-8 space-y-4">{[["Datum i vrijeme", formatDateTime(selectedLog.created_at)], ["Korisnik", selectedLog.actor_display_name || selectedLog.actor_email || "Nepoznato"], ["E-mail", selectedLog.actor_email || "Nije zabilježen"], ["Akcija", actionLabel(selectedLog.action)], ["Entitet", entityLabel(selectedLog.entity_type)], ["Naziv entiteta", selectedLog.entity_label || "Nije zabilježen"], ["ID entiteta", selectedLog.entity_id || "Nije zabilježen"], ["ID audit zapisa", selectedLog.id]].map(([label,value]) => <div key={label} className="rounded-2xl border border-app-soft bg-app-card-alt p-4"><p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p><p className="mt-2 break-words text-sm font-medium">{value}</p></div>)}</div></aside></div> : null}
    </PageShell>
  );
}
