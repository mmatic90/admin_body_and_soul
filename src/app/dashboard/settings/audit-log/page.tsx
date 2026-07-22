import Link from "next/link";
import { requireAdminForSettings } from "@/lib/page-guards";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";
import EmptyStateCard from "@/components/empty-state-card";
import {
  getAuditLogFilterOptions,
  getAuditLogs,
} from "@/features/audit/queries";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function actionLabel(action: string) {
  switch (action) {
    case "appointment_created": return "Dodan termin";
    case "appointment_updated": return "Uređen termin";
    case "appointment_cancelled": return "Otkazan termin";
    case "appointment_status_changed": return "Promijenjen status termina";
    case "appointment_deleted": return "Obrisan termin";
    case "client_created": return "Dodan klijent";
    case "client_updated": return "Uređen klijent";
    case "client_deleted": return "Obrisan klijent";
    case "employee_created": return "Dodan zaposlenik";
    case "employee_updated": return "Uređen zaposlenik";
    case "employee_deactivated": return "Deaktiviran zaposlenik";
    case "employee_password_reset": return "Resetirana lozinka zaposlenika";
    case "service_created": return "Dodana usluga";
    case "service_deleted": return "Obrisana usluga";
    case "services_bulk_updated": return "Uređene usluge";
    case "room_created": return "Dodana soba";
    case "room_deleted": return "Obrisana soba";
    case "rooms_bulk_updated": return "Uređene sobe";
    case "equipment_created": return "Dodana oprema";
    case "equipment_deleted": return "Obrisana oprema";
    case "equipment_bulk_updated": return "Uređena oprema";
    case "service_rooms_bulk_updated": return "Uređeno mapiranje usluga i soba";
    case "employee_services_bulk_updated": return "Uređeno mapiranje zaposlenika i usluga";
    case "service_equipment_bulk_updated": return "Uređeno mapiranje usluga i opreme";
    case "salon_hours_bulk_updated": return "Uređeno radno vrijeme salona";
    case "service_group_limits_bulk_updated": return "Uređeni group limits";
    default: return action;
  }
}

function entityLabel(entityType: string) {
  switch (entityType) {
    case "appointment": return "Termin";
    case "client": return "Klijent";
    case "employee": return "Zaposlenik";
    case "service": return "Usluga";
    case "room": return "Soba";
    case "equipment": return "Oprema";
    case "service_room_mapping": return "Usluge i sobe";
    case "employee_service_mapping": return "Zaposlenici i usluge";
    case "service_equipment_mapping": return "Usluge i oprema";
    case "salon_working_hours": return "Radno vrijeme";
    case "service_group_limit": return "Group limits";
    default: return entityType;
  }
}

function actionBadgeClass(action: string) {
  if (action.includes("deleted") || action.includes("cancelled") || action.includes("deactivated")) {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  if (action.includes("created")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (action.includes("updated") || action.includes("changed")) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  return "bg-blue-50 text-blue-700 ring-blue-200";
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildHref(
  current: Record<string, string>,
  updates: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "?";
}

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminForSettings();
  const raw = await searchParams;

  const params = {
    dateFrom: readParam(raw.dateFrom),
    dateTo: readParam(raw.dateTo),
    actor: readParam(raw.actor),
    action: readParam(raw.action),
    entityType: readParam(raw.entityType),
    search: readParam(raw.search),
    selected: readParam(raw.selected),
    page: Math.max(1, Number(readParam(raw.page)) || 1),
    pageSize: [25, 50, 100, 200].includes(Number(readParam(raw.pageSize)))
      ? Number(readParam(raw.pageSize))
      : 50,
  };

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [result, options, todayResult, weekResult] = await Promise.all([
    getAuditLogs(params),
    getAuditLogFilterOptions(),
    getAuditLogs({ dateFrom: formatDateInput(today), dateTo: formatDateInput(today), pageSize: 1 }),
    getAuditLogs({ dateFrom: formatDateInput(sevenDaysAgo), dateTo: formatDateInput(today), pageSize: 1 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / params.pageSize));
  const safePage = Math.min(params.page, totalPages);
  const activeParams: Record<string, string> = {
    ...(params.dateFrom && { dateFrom: params.dateFrom }),
    ...(params.dateTo && { dateTo: params.dateTo }),
    ...(params.actor && { actor: params.actor }),
    ...(params.action && { action: params.action }),
    ...(params.entityType && { entityType: params.entityType }),
    ...(params.search && { search: params.search }),
    pageSize: String(params.pageSize),
  };
  const currentPageParams = { ...activeParams, page: String(safePage) };
  const selectedLog = result.items.find((log) => log.id === params.selected) ?? null;
  const exportParams = new URLSearchParams();
  if (params.dateFrom) exportParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) exportParams.set("dateTo", params.dateTo);
  if (params.actor) exportParams.set("actor", params.actor);
  if (params.action) exportParams.set("action", params.action);
  if (params.entityType) exportParams.set("entityType", params.entityType);
  if (params.search) exportParams.set("search", params.search);
  const exportHref = `/dashboard/settings/audit-log/export${exportParams.toString() ? `?${exportParams}` : ""}`;

  const quickRanges = [
    { label: "Danas", from: formatDateInput(today), to: formatDateInput(today) },
    { label: "Zadnjih 7 dana", from: formatDateInput(sevenDaysAgo), to: formatDateInput(today) },
    { label: "Zadnjih 30 dana", from: formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)), to: formatDateInput(today) },
    { label: "Ovaj mjesec", from: formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)), to: formatDateInput(today) },
  ];

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        title="Audit log"
        description="Pregled, pretraživanje i filtriranje svih važnih akcija u sustavu."
        actions={
          <div className="flex flex-wrap gap-2">
            <a href={exportHref} className="inline-flex rounded-xl bg-app-text px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              Izvezi CSV
            </a>
            <Link href="/dashboard/settings" className="inline-flex rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg">
              Natrag
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pronađene aktivnosti", result.total],
          ["Korisnici u zapisniku", options.actors.length],
          ["Aktivnosti danas", todayResult.total],
          ["Zadnjih 7 dana", weekResult.total],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm">
            <p className="text-sm text-app-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-app-text">{value}</p>
          </div>
        ))}
      </div>

      <PageSection title="Filtri">
        <div className="space-y-4 rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Link key={range.label} href={buildHref(activeParams, { dateFrom: range.from, dateTo: range.to, page: 1, selected: undefined })} className="rounded-full border border-app-soft px-3 py-1.5 text-sm font-medium text-app-text transition hover:bg-app-bg">
                {range.label}
              </Link>
            ))}
            <Link href={buildHref(activeParams, { dateFrom: undefined, dateTo: undefined, page: 1, selected: undefined })} className="rounded-full border border-app-soft px-3 py-1.5 text-sm font-medium text-app-text transition hover:bg-app-bg">
              Sve
            </Link>
          </div>

          <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-1 text-sm text-app-muted">
              <span>Datum od</span>
              <input type="date" name="dateFrom" defaultValue={params.dateFrom} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2 text-app-text" />
            </label>
            <label className="space-y-1 text-sm text-app-muted">
              <span>Datum do</span>
              <input type="date" name="dateTo" defaultValue={params.dateTo} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2 text-app-text" />
            </label>
            <label className="space-y-1 text-sm text-app-muted">
              <span>Korisnik</span>
              <select name="actor" defaultValue={params.actor} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2 text-app-text">
                <option value="">Svi korisnici</option>
                {options.actors.map((actor) => <option key={actor.value} value={actor.value}>{actor.label}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm text-app-muted">
              <span>Akcija</span>
              <select name="action" defaultValue={params.action} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2 text-app-text">
                <option value="">Sve akcije</option>
                {options.actions.map((action) => <option key={action} value={action}>{actionLabel(action)}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm text-app-muted">
              <span>Entitet</span>
              <select name="entityType" defaultValue={params.entityType} className="w-full rounded-xl border border-app-soft bg-white px-3 py-2 text-app-text">
                <option value="">Svi entiteti</option>
                {options.entityTypes.map((entity) => <option key={entity} value={entity}>{entityLabel(entity)}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm text-app-muted">
              <span>Pretraga</span>
              <input name="search" defaultValue={params.search} placeholder="Korisnik, naziv, akcija..." className="w-full rounded-xl border border-app-soft bg-white px-3 py-2 text-app-text" />
            </label>
            <input type="hidden" name="pageSize" value={params.pageSize} />
            <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-6">
              <button type="submit" className="rounded-xl bg-app-text px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">Primijeni filtre</button>
              <Link href="/dashboard/settings/audit-log" className="rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg">Resetiraj</Link>
            </div>
          </form>
        </div>
      </PageSection>

      <PageSection title="Zapisnik aktivnosti">
        <div className="rounded-2xl border border-app-soft bg-app-card shadow-sm">
          {result.items.length === 0 ? (
            <div className="p-6"><EmptyStateCard title="Nema zapisa" description="Nema aktivnosti koje odgovaraju odabranim filtrima." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-app-table-head">
                  <tr className="text-left text-sm text-app-muted">
                    <th className="px-4 py-3 font-semibold">Datum i vrijeme</th>
                    <th className="px-4 py-3 font-semibold">Akcija</th>
                    <th className="px-4 py-3 font-semibold">Korisnik</th>
                    <th className="px-4 py-3 font-semibold">Entitet</th>
                    <th className="px-4 py-3 font-semibold text-right">Detalji</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((log) => (
                    <tr key={log.id} className="border-t border-app-soft text-sm transition hover:bg-app-card-alt">
                      <td className="whitespace-nowrap px-4 py-4 text-app-text">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-4 text-app-text">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${actionBadgeClass(log.action)}`}>
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-app-text">{log.actor_display_name || log.actor_email || "Nepoznato"}</td>
                      <td className="px-4 py-4 text-app-text">
                        {entityLabel(log.entity_type)}
                        {log.entity_label ? <span className="text-app-muted"> · {log.entity_label}</span> : null}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={buildHref(currentPageParams, { selected: log.id })} className="rounded-lg border border-app-soft bg-white px-3 py-1.5 text-xs font-semibold text-app-text transition hover:bg-app-bg">
                          Otvori
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-app-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-app-muted">
              <span>Prikaz po stranici:</span>
              {[25, 50, 100, 200].map((size) => (
                <Link key={size} href={buildHref(activeParams, { pageSize: size, page: 1, selected: undefined })} className={`rounded-lg px-2.5 py-1 ${params.pageSize === size ? "bg-app-text text-white" : "border border-app-soft bg-white text-app-text"}`}>
                  {size}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link aria-disabled={safePage <= 1} href={safePage > 1 ? buildHref(activeParams, { page: safePage - 1, selected: undefined }) : "#"} className={`rounded-xl border border-app-soft px-3 py-2 ${safePage <= 1 ? "pointer-events-none opacity-40" : "bg-white text-app-text hover:bg-app-bg"}`}>
                ← Prethodna
              </Link>
              <span className="text-app-muted">Stranica {safePage} od {totalPages}</span>
              <Link aria-disabled={safePage >= totalPages} href={safePage < totalPages ? buildHref(activeParams, { page: safePage + 1, selected: undefined }) : "#"} className={`rounded-xl border border-app-soft px-3 py-2 ${safePage >= totalPages ? "pointer-events-none opacity-40" : "bg-white text-app-text hover:bg-app-bg"}`}>
                Sljedeća →
              </Link>
            </div>
          </div>
        </div>
      </PageSection>

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <Link href={buildHref(currentPageParams, { selected: undefined })} aria-label="Zatvori detalje" className="absolute inset-0" />
          <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-app-soft bg-app-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-app-muted">Audit zapis</p>
                <h2 className="mt-1 text-2xl font-semibold text-app-text">{actionLabel(selectedLog.action)}</h2>
              </div>
              <Link href={buildHref(currentPageParams, { selected: undefined })} className="rounded-xl border border-app-soft bg-white px-3 py-2 text-sm font-medium text-app-text hover:bg-app-bg">
                Zatvori
              </Link>
            </div>

            <div className="mt-8 space-y-4">
              {[
                ["Datum i vrijeme", formatDateTime(selectedLog.created_at)],
                ["Korisnik", selectedLog.actor_display_name || selectedLog.actor_email || "Nepoznato"],
                ["E-mail", selectedLog.actor_email || "Nije zabilježen"],
                ["Akcija", actionLabel(selectedLog.action)],
                ["Entitet", entityLabel(selectedLog.entity_type)],
                ["Naziv entiteta", selectedLog.entity_label || "Nije zabilježen"],
                ["ID entiteta", selectedLog.entity_id || "Nije zabilježen"],
                ["ID audit zapisa", selectedLog.id],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-app-soft bg-app-card-alt p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p>
                  <p className="mt-2 break-words text-sm font-medium text-app-text">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-app-soft p-4">
              <p className="text-sm font-semibold text-app-text">Povijest promjena</p>
              <p className="mt-1 text-sm text-app-muted">Prikaz vrijednosti prije i poslije promjene dodat ćemo kada audit zapisi budu spremali detaljne promjene.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </PageShell>
  );
}
