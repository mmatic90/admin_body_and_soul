import { requireDashboardUser } from "@/lib/page-guards";
import { createClient } from "@/lib/supabase/server";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";
import AccountProfileForm from "./account-profile-form";
import ChangePasswordForm from "./change-password-form";

export default async function AccountPage() {
  const permissions = await requireDashboardUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", permissions.userId)
    .single();

  const { data: employee } = await supabase
    .from("employees")
    .select("display_name, color_hex")
    .eq("profile_id", permissions.userId)
    .maybeSingle();

  const displayName =
    employee?.display_name || profile?.display_name || permissions.displayName;

  const email = profile?.email || permissions.email || "";

  return (
    <PageShell maxWidth="max-w-5xl">
      <PageHeader
        title="Moj račun"
        description="Uredi prikazano ime, boju zaposlenika i lozinku."
      />

      <PageSection title="Osnovni podaci" description={`Login email: ${email}`}>
        <AccountProfileForm
          initialDisplayName={displayName}
          initialColorHex={employee?.color_hex ?? permissions.colorHex}
          canEditColor={permissions.isEmployee}
        />
      </PageSection>

      <PageSection
        title="Promjena lozinke"
        description="Nakon uspješne promjene lozinke bit ćeš automatski odjavljen."
      >
        <ChangePasswordForm email={email} />
      </PageSection>
    </PageShell>
  );
}
