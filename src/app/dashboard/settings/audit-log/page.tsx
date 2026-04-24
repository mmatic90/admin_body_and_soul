import Link from "next/link";
import { requireAdminForSettings } from "@/lib/page-guards";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";
import EmptyStateCard from "@/components/empty-state-card";
import { getAuditLogs } from "@/features/audit/queries";

function formatDateTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function actionLabel(action: string) {
  switch (action) {
    case "appointment_created":
      return "Dodan termin";
    case "appointment_updated":
      return "Uređen termin";
    case "appointment_cancelled":
      return "Otkazan termin";
    case "appointment_status_changed":
      return "Promijenjen status termina";
    case "appointment_deleted":
      return "Obrisan termin";

    case "client_created":
      return "Dodan klijent";
    case "client_updated":
      return "Uređen klijent";
    case "client_deleted":
      return "Obrisan klijent";

    case "employee_created":
      return "Dodan zaposlenik";
    case "employee_updated":
      return "Uređen zaposlenik";
    case "employee_deactivated":
      return "Deaktiviran zaposlenik";
    case "employee_password_reset":
      return "Resetirana lozinka zaposlenika";

    case "service_created":
      return "Dodana usluga";
    case "service_deleted":
      return "Obrisana usluga";
    case "services_bulk_updated":
      return "Uređene usluge";

    case "room_created":
      return "Dodana soba";
    case "room_deleted":
      return "Obrisana soba";
    case "rooms_bulk_updated":
      return "Uređene sobe";

    case "equipment_created":
      return "Dodana oprema";
    case "equipment_deleted":
      return "Obrisana oprema";
    case "equipment_bulk_updated":
      return "Uređena oprema";

    case "service_rooms_bulk_updated":
      return "Uređeno mapiranje usluga i soba";
    case "employee_services_bulk_updated":
      return "Uređeno mapiranje zaposlenika i usluga";
    case "service_equipment_bulk_updated":
      return "Uređeno mapiranje usluga i opreme";
    case "salon_hours_bulk_updated":
      return "Uređeno radno vrijeme salona";
    case "service_group_limits_bulk_updated":
      return "Uređeni group limits";

    default:
      return action;
  }
}

function entityLabel(entityType: string) {
  switch (entityType) {
    case "appointment":
      return "Termin";
    case "client":
      return "Klijent";
    case "employee":
      return "Zaposlenik";
    case "service":
      return "Usluga";
    case "room":
      return "Soba";
    case "equipment":
      return "Oprema";
    case "service_room_mapping":
      return "Usluge i sobe";
    case "employee_service_mapping":
      return "Zaposlenici i usluge";
    case "service_equipment_mapping":
      return "Usluge i oprema";
    case "salon_working_hours":
      return "Radno vrijeme";
    case "service_group_limit":
      return "Group limits";
    default:
      return entityType;
  }
}

export default async function AuditLogPage() {
  await requireAdminForSettings();

  const logs = await getAuditLogs(300);

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        title="Audit log"
        description="Pregled svih važnih akcija u sustavu."
        actions={
          <Link
            href="/dashboard/settings"
            className="inline-flex rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-bg"
          >
            Natrag
          </Link>
        }
      />

      <PageSection title="Zapisnik aktivnosti">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          {logs.length === 0 ? (
            <EmptyStateCard
              title="Nema zapisa"
              description="Još nema zabilježenih akcija u sustavu."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-app-table-head">
                  <tr className="text-left text-sm text-app-muted">
                    <th className="px-4 py-3 font-semibold">Datum i vrijeme</th>
                    <th className="px-4 py-3 font-semibold">Akcija</th>
                    <th className="px-4 py-3 font-semibold">Korisnik</th>
                    <th className="px-4 py-3 font-semibold">Entitet</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-app-soft text-sm transition hover:bg-app-card-alt"
                    >
                      <td className="px-4 py-4 text-app-text">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-4 text-app-text">
                        {actionLabel(log.action)}
                      </td>
                      <td className="px-4 py-4 text-app-text">
                        {log.actor_display_name ||
                          log.actor_email ||
                          "Nepoznato"}
                      </td>
                      <td className="px-4 py-4 text-app-text">
                        {entityLabel(log.entity_type)}
                        {log.entity_label ? (
                          <span className="text-app-muted">
                            {" "}
                            · {log.entity_label}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageSection>
    </PageShell>
  );
}
