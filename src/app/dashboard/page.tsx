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
} from "lucide-react";

export default async function DashboardPage() {
  const permissions = await requireDashboardUser();
  const overdueAppointments = await getOverdueScheduledAppointments();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <OverdueAppointmentsPanel items={overdueAppointments} />

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-app-text">Dashboard</h1>
          <p className="mt-2 text-app-muted">
            Body &amp; Soul by Elizabeth Dobrović - upravljanje terminima i
            klijentima.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DashboardLinkCard
            href="/dashboard/appointments"
            title="Termini"
            description="Pregled i upravljanje terminima."
            icon={Calendar}
          />

          <DashboardLinkCard
            href="/dashboard/calendar"
            title="Kalendar"
            description="Dnevni pregled termina."
            icon={Clock}
          />

          <DashboardLinkCard
            href="/dashboard/calendar/time-grid"
            title="Time-grid kalendar"
            description="Dnevni raspored po vremenskoj osi."
            icon={Clock}
          />

          <DashboardLinkCard
            href="/dashboard/clients"
            title="Klijenti"
            description="Pregled klijenata i povijesti termina."
            icon={Users}
          />

          {canAccessScheduleManagement(permissions.role) ? (
            <DashboardLinkCard
              href="/dashboard/schedule"
              title="Rasporedi"
              description="Upravljanje rasporedima zaposlenika."
              icon={UserCog}
            />
          ) : null}

          {canAccessReports(permissions.role) ? (
            <DashboardLinkCard
              href="/dashboard/reports"
              title="Reports"
              description="Pregled termina, statusa i statistike."
              icon={BarChart3}
            />
          ) : null}

          {canAccessSettings(permissions.role) ? (
            <DashboardLinkCard
              href="/dashboard/settings"
              title="Postavke"
              description="Upravljanje uslugama, sobama i pravilima."
              icon={Settings}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
