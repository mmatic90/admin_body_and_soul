import Link from "next/link";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import { getEmployeesForSchedule } from "@/features/schedule/queries";
import { requireAdminForScheduleManagement } from "@/lib/page-guards";

export default async function SchedulePage() {
  await requireAdminForScheduleManagement();

  const employees = await getEmployeesForSchedule();

  return (
    <PageShell maxWidth="max-w-4xl">
      <PageHeader title="Rasporedi djelatnika" />

        <div className="grid gap-4">
          {employees.map((employee) => (
            <Link
              key={employee.id}
              href={`/dashboard/schedule/${employee.id}`}
              className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm transition hover:bg-app-card-alt hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: employee.color_hex || "#999999" }}
                />
                <div>
                  <h2 className="text-lg font-semibold text-app-text">
                    {employee.display_name}
                  </h2>
                  <p className="text-sm text-app-muted">Uredi raspored</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
    </PageShell>
  );
}
