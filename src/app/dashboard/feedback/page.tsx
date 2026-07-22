import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function FeedbackPage() {
  const permissions = await getCurrentUserPermissions();
  if (!permissions?.isSystemDeveloper) notFound();

  const items = await getFeedbackList();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-app-accent">Developer tools</p>
        <h1 className="mt-2 text-3xl font-bold text-app-text">Feedback</h1>
        <p className="mt-2 text-sm text-app-muted">Prijave grešaka, ideje, poboljšanja i pitanja korisnika.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-app-soft bg-app-card shadow-sm">
        {items.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-app-muted">Još nema zaprimljenog feedbacka.</div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-app-soft">
                {items.map((item) => (
                  <tr key={item.id} className="transition hover:bg-app-card-alt">
                    <td className="px-5 py-4 font-medium text-app-text">{statusLabels[item.status] ?? item.status}</td>
                    <td className="px-5 py-4 text-app-muted">{typeLabels[item.type] ?? item.type}</td>
                    <td className="px-5 py-4 text-app-muted">{item.priority}</td>
                    <td className="px-5 py-4 text-app-muted">{item.created_by_name ?? item.created_by_email ?? "Korisnik"}</td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/feedback/${item.id}`} className="font-semibold text-app-text underline-offset-4 hover:underline">
                        {item.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-app-muted">
                      {new Intl.DateTimeFormat("hr-HR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
