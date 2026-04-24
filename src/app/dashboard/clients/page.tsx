import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientsList } from "@/features/clients/queries";
import { deleteClientAction } from "@/features/clients/actions";
import EmptyStateCard from "@/components/empty-state-card";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";
import SettingsDeleteButton from "@/components/settings-delete-button";

type SearchParams = Promise<{
  q?: string;
}>;

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || "";

  const clients = await getClientsList(query);

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        title="Klijenti"
        description="Pregled klijenata i njihove povijesti termina."
        actions={
          <Link
            href="/dashboard/clients/new"
            className="inline-flex rounded-xl bg-app-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Novi klijent
          </Link>
        }
      />

      <PageSection>
        <form action="/dashboard/clients">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Pretraži po imenu, telefonu ili emailu..."
            className="w-full rounded-xl border border-app-soft bg-white px-4 py-3 text-app-text outline-none placeholder:text-app-muted"
          />
        </form>
      </PageSection>

      <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-app-table-head">
              <tr className="text-left text-sm text-app-muted">
                <th className="px-4 py-3 font-semibold">Klijent</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Broj termina</th>
                <th className="px-4 py-3 font-semibold">Zadnji termin</th>
                <th className="px-4 py-3 font-semibold">Sljedeći termin</th>
                <th className="px-4 py-3 font-semibold">Akcije</th>
              </tr>
            </thead>

            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-t border-app-soft text-sm transition hover:bg-app-card-alt"
                >
                  <td className="px-4 py-4 font-medium text-app-text">
                    {client.full_name}
                  </td>
                  <td className="px-4 py-4 text-app-muted">
                    {client.phone || "-"}
                  </td>
                  <td className="px-4 py-4 text-app-muted">
                    {client.email || "-"}
                  </td>
                  <td className="px-4 py-4 text-app-text">
                    {client.appointments_count}
                  </td>
                  <td className="px-4 py-4 text-app-muted">
                    {formatDate(client.last_appointment)}
                  </td>
                  <td className="px-4 py-4 text-app-muted">
                    {formatDate(client.next_appointment)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="rounded-xl border border-app-soft bg-white px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg"
                      >
                        Otvori
                      </Link>

                      <Link
                        href={`/dashboard/clients/${client.id}/edit`}
                        className="rounded-xl border border-app-soft bg-white px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg"
                      >
                        Uredi
                      </Link>

                      <SettingsDeleteButton
                        label={client.full_name}
                        onDelete={deleteClientAction.bind(null, client.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clients.length === 0 ? (
          <div className="mt-4">
            <EmptyStateCard
              title="Nema pronađenih klijenata"
              description="Pokušaj s drugim pojmom pretrage ili dodaj novog klijenta."
            />
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
