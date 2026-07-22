import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { getFeedbackList } from "@/features/feedback/queries";

const statusLabels: Record<string, string> = {
  open: "Otvoreno",
  investigating: "U analizi",
  in_progress: "U radu",
  waiting: "Čeka odgovor",
  done: "Riješeno",
  rejected: "Odbijeno",
};

const typeLabels: Record<string, string> = {
  bug: "Greška",
  improvement: "Poboljšanje",
  idea: "Ideja",
  question: "Pitanje",
};

const priorityLabels: Record<string, string> = {
  low: "Nizak",
  medium: "Srednji",
  high: "Visok",
  critical: "Kritičan",
};

export default async function FeedbackPage() {
  const permissions = await getCurrentUserPermissions();
  if (!permissions?.isSystemDeveloper) notFound();

  const items = await getFeedbackList();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-app-accent">
          Developer tools
        </p>
        <h1 className="mt-2 text-3xl font-bold text-app-text">Feedback</h1>
        <p className="mt-2 text-sm text-app-muted">
          Klikni na bilo koji red ili na gumb Otvori za pregled screenshota,
          promjenu statusa i uređivanje internog komentara.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-app-soft bg-app-card shadow-sm">
        {items.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-app-muted">
            Još nema zaprimljenog feedbacka.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-app-soft text-sm">
              <thead className="bg-app-card-alt text-left text-xs uppercase tracking-wide text-app-muted">
                <tr>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Vrsta</th>
                  <th className="px-5 py-4">Prioritet</th>
                  <th className="px-5 py-4">Korisnik</th>
                  <th className="px-5 py-4">Naslov</th>
                  <th className="px-5 py-4">Datum</th>
                  <th className="px-5 py-4 text-right">Akcija</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-soft">
                {items.map((item) => {
                  const href = `/dashboard/feedback/${item.id}`;

                  return (
                    <tr key={item.id} className="group transition hover:bg-app-card-alt">
                      <td className="p-0">
                        <Link href={href} className="block px-5 py-4 font-medium text-app-text">
                          {statusLabels[item.status] ?? item.status}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={href} className="block px-5 py-4 text-app-muted">
                          {typeLabels[item.type] ?? item.type}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={href} className="block px-5 py-4 text-app-muted">
                          {priorityLabels[item.priority] ?? item.priority}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={href} className="block px-5 py-4 text-app-muted">
                          {item.created_by_name ?? item.created_by_email ?? "Korisnik"}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={href} className="block px-5 py-4 font-semibold text-app-text group-hover:text-app-accent">
                          {item.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap p-0">
                        <Link href={href} className="block px-5 py-4 text-app-muted">
                          {new Intl.DateTimeFormat("hr-HR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(item.created_at))}
                        </Link>
                      </td>
                      <td className="p-0 text-right">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-2 px-5 py-4 font-semibold text-app-accent transition hover:underline"
                        >
                          Otvori
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
