import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getCurrentUserPermissions } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const permissions = await getCurrentUserPermissions();

  if (!permissions) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <div className="lg:flex">
        <DashboardSidebar
          role={permissions.role}
          displayName={permissions.displayName}
        />

        <main className="min-w-0 flex-1 transition-all duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
