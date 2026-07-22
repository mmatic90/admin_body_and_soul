import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getCurrentUserPermissions } from "@/lib/permissions";
import AdminFooter from "@/components/admin-footer";
import FeedbackWidget from "@/features/feedback/components/feedback-widget";

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
          isSystemDeveloper={permissions.isSystemDeveloper}
        />

        <main className="flex min-w-0 flex-1 flex-col transition-all duration-200">
          <div className="flex-1">{children}</div>
          <AdminFooter />
        </main>
      </div>

      <FeedbackWidget />
    </div>
  );
}
