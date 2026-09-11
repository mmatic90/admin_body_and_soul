import Link from "next/link";
import { requireDashboardUser } from "@/lib/page-guards";
import {
  canAccessReports,
  canAccessSettings,
  canAccessScheduleManagement,
} from "@/lib/permissions";
import OverdueAppointmentsPanel from "@/components/overdue-appointments-panel";
import { getOverdueScheduledAppointments } from "@/features/appointments/overdue-queries";
import DashboardLinkCard from "@/components/dashboard-link-card";
import {
  Calendar,
  Users,
  Settings,
  Clock,
  BarChart3,
  UserCog,
  Activity,
  ArrowRight,
  Plus,
  CalendarDays,
  ClipboardCheck,
  UserPlus,
} from "lucide-react";
import { getDashboardOverviewStats } from "@/features/dashboard/overview-queries";
import { getAuditLogs } from "@/features/audit/queries";
import { getAppointmentsByDate } from "@/features/appointments/queries";
import TodayAppointmentsPanel from "./today-appointments-panel";

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    appointment_created: "dodan termin",
    appointment_updated: "uređen termin",
    appointment_cancelled: "otkazan termin",
    appointment_status_changed: "promijenjen status termina",
    appointment_deleted: "obrisan termin",
    client_created: "dodan klijent",
    client_updated: "uređen klijent",
    client_deleted: "obrisan klijent",
    employee_created: "dodan zaposlenik",
    employee_updated: "uređen zaposlenik",
    service_created: "dodana usluga",
    services_bulk_updated: "uređene usluge",
    rooms_bulk_updated: "uređene sobe",
    equipment_bulk_updated: "uređena oprema",
  };
  return labels[action] ?? action.replaceAll("_", " ");
}

function relativeTime(value: string) {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 1) return "upravo sada";
  if (diffMinutes < 60) return `prije ${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `prije ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "jučer" : `prije ${days} dana`;
}

function getZagrebDateValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default async function DashboardPage() {
  const permissions = await requireDashboardUser();
  const canViewAudit = canAccessSettings(permissions.role);
  const todayValue = getZagrebDateValue();

  const [overdueAppointments, overviewStats, recentAudit, todayAppointments] = await Promise.all([
    getOverdueScheduledAppointments(),
    getDashboardOverviewStats(),
    canViewAudit ? getAuditLogs({ pageSize: 5 }) : Promise.resolve({ items: [], total: 0 }),
    getAppointmentsByDate(todayValue),
  ]);

  const activeToday = todayAppointments.filter(
    (item) => item.status === "scheduled" || item.status === "completed",
  );

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <OverdueAppointmentsPanel items={overdueAppointments} />

        <section className="overflow-hidden rounded-3xl border border-app-soft bg-app-card shadow-sm">
          <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-app-accent">
                {getTodayLabel()}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-app-text md:text-4xl">
                Dnevni pregled
              </h1>
              <p className="mt-2 max-w-2xl text-app-muted">
                Najvažnije informacije i radnje za današnji dan na jednom mjestu.
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[430px]">
              <Link href="/dashboard/appointments/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                <Plus className="h-4 w-4" /> Novi termin
              </Link>
              <Link href="/dashboard/clients" className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-bg">
                <UserPlus className="h-4 w-4" /> Klijenti
              </Link>
              <Link href="/dashboard/online-bookings" className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-bg">
                <ClipboardCheck className="h-4 w-4" /> Online zahtjevi
                {overviewStats.pendingOnlineCount > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {overviewStats.pendingOnlineCount}
                  </span>
                ) : null}
              </Link>
              <Link href="/dashboard/calendar/time-grid" className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-bg">
                <CalendarDays className="h-4 w-4" /> Današnji raspored
              </Link>
            </div>
          </div>
        </section>

        <div className={canViewAudit ? "grid gap-6 lg:grid-cols-2" : ""}>
          <TodayAppointmentsPanel appointments={activeToday} />

          {canViewAudit ? (
            <section className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-app-card-alt p-2 text-app-accent"><Activity className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-bold text-app-text">Posljednje aktivnosti</h2><p className="text-sm text-app-muted">Najnovije promjene u sustavu.</p></div>
              </div>
              <Link href="/dashboard/settings/audit-log" className="inline-flex items-center gap-2 text-sm font-semibold text-app-accent">Prikaži sve <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-5 divide-y divide-app-soft">
              {recentAudit.items.length === 0 ? <p className="py-5 text-sm text-app-muted">Još nema zabilježenih aktivnosti.</p> : recentAudit.items.map((log) => (
                <Link key={log.id} href={`/dashboard/settings/audit-log?selected=${log.id}`} className="flex items-center justify-between gap-4 py-3 transition hover:bg-app-card-alt sm:px-2">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-app-text">{log.actor_display_name || log.actor_email || "Nepoznati korisnik"}</p><p className="truncate text-sm text-app-muted">{actionLabel(log.action)}{log.entity_label ? ` · ${log.entity_label}` : ""}</p></div>
                  <span className="shrink-0 text-xs text-app-muted">{relativeTime(log.created_at)}</span>
                </Link>
              ))}
            </div>
            </section>
          ) : null}
        </div>

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-bold text-app-text">Ostalo</h2>
            <p className="text-sm text-app-muted">Rjeđe korištene funkcije i administracija.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DashboardLinkCard href="/dashboard/appointments" title="Termini" description="Pregled i upravljanje terminima." icon={Calendar} />
            <DashboardLinkCard href="/dashboard/calendar" title="Kalendar" description="Dnevni pregled termina." icon={Clock} />
            <DashboardLinkCard href="/dashboard/clients" title="Klijenti" description="Pregled klijenata i povijesti termina." icon={Users} />
            {canAccessScheduleManagement(permissions.role) ? <DashboardLinkCard href="/dashboard/schedule" title="Rasporedi" description="Upravljanje rasporedima zaposlenika." icon={UserCog} /> : null}
            {canAccessReports(permissions.role) ? <DashboardLinkCard href="/dashboard/reports" title="Reports" description="Pregled termina, statusa i statistike." icon={BarChart3} /> : null}
            {canViewAudit ? <DashboardLinkCard href="/dashboard/settings" title="Postavke" description="Upravljanje uslugama, sobama i pravilima." icon={Settings} /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
