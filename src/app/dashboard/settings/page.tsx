import Link from "next/link";
import { requireAdminForSettings } from "@/lib/page-guards";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";

function SettingsCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-app-card-alt hover:shadow-md"
    >
      <h2 className="text-xl font-semibold text-app-text">{title}</h2>
      <p className="mt-2 text-app-muted">{description}</p>
    </Link>
  );
}

export default async function SettingsPage() {
  await requireAdminForSettings();

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader title="Postavke" />

      <PageSection title="Osnovno">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SettingsCard href="/dashboard/settings/services" title="Usluge" description="Nazivi, opisi, trajanje, cijene i dostupnost usluga." />
          <SettingsCard href="/dashboard/settings/employees" title="Djelatnici" description="Dodavanje, uređivanje, deaktivacija i pristup djelatnika." />
          <SettingsCard href="/dashboard/settings/rooms" title="Sobe" description="Upravljanje aktivnim sobama u salonu." />
          <SettingsCard href="/dashboard/settings/equipment" title="Oprema" description="Upravljanje opremom i raspoloživim količinama." />
        </div>
      </PageSection>

      <PageSection title="Povezivanja i pravila">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SettingsCard href="/dashboard/settings/employee-services" title="Djelatnici i usluge" description="Odredi koje usluge pojedini djelatnik može raditi." />
          <SettingsCard href="/dashboard/settings/service-rooms" title="Usluge i sobe" description="Odredi u kojim sobama se pojedina usluga može izvoditi." />
          <SettingsCard href="/dashboard/settings/service-equipment" title="Usluge i oprema" description="Odredi koja je oprema potrebna za pojedinu uslugu." />
          <SettingsCard href="/dashboard/settings/group-limits" title="Paralelni termini po grupama" description="Odredi koliko termina iste grupe usluga može ići paralelno." />
        </div>
      </PageSection>

      <PageSection title="Salon i administracija">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SettingsCard href="/dashboard/settings/salon-hours" title="Radno vrijeme salona" description="Uredi radno vrijeme salona po danima u tjednu." />
          <SettingsCard href="/dashboard/settings/audit-log" title="Dnevnik aktivnosti" description="Pregled važnih akcija i promjena u sustavu." />
        </div>
      </PageSection>
    </PageShell>
  );
}
