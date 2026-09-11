import Link from "next/link";
import { requireAdminForSettings } from "@/lib/page-guards";
import { getEmployees } from "@/features/settings/queries";
import EmployeesTable from "./employees-table";
import EmployeeCreateForm from "./employee-create-form";
import EmptyStateCard from "@/components/empty-state-card";

export default async function SettingsEmployeesPage() {
  await requireAdminForSettings();

  const employees = await getEmployees();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-app-text">Djelatnici</h1>
            </div>

            <Link
              href="/dashboard/settings"
              className="rounded-xl border border-app-soft bg-white px-4 py-2 font-medium text-app-text transition hover:bg-app-bg"
            >
              Natrag
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-app-text">Novi djelatnik</h2>
          <div className="mt-4">
            <EmployeeCreateForm />
          </div>
        </div>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-app-text">Popis djelatnika</h2>
          <div className="mt-4">
            {employees.length === 0 ? (
              <EmptyStateCard
                title="Nema djelatnika"
                description="Dodaj prvog djelatnika kako bi ga mogao koristiti u rasporedu, terminima i postavkama."
              />
            ) : (
              <EmployeesTable employees={employees} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
