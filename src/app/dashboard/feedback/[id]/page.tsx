import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getCurrentUserPermissions } from "@/lib/permissions";
import {
  createFeedbackScreenshotSignedUrl,
  getFeedbackById,
} from "@/features/feedback/queries";
import FeedbackAdminForm from "@/features/feedback/components/feedback-admin-form";

const typeLabels: Record<string, string> = {
  bug: "Greška",
  improvement: "Poboljšanje",
  idea: "Ideja",
  question: "Pitanje",
};

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const permissions = await getCurrentUserPermissions();
  if (!permissions?.isSystemDeveloper) notFound();

  const { id } = await params;
  const feedback = await getFeedbackById(id);
  if (!feedback) notFound();

  const screenshotUrl = feedback.screenshot_path
    ? await createFeedbackScreenshotSignedUrl(feedback.screenshot_path)
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/feedback"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-app-muted transition hover:text-app-text"
      >
        <ArrowLeft className="h-4 w-4" /> Povratak na feedback
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-app-soft bg-app-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
              <span>{typeLabels[feedback.type] ?? feedback.type}</span>
              <span>•</span>
              <span>{feedback.priority}</span>
              <span>•</span>
              <span>
                {new Intl.DateTimeFormat("hr-HR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(feedback.created_at))}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold text-app-text">{feedback.title}</h1>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-app-text">
              {feedback.description}
            </p>
          </section>

          {screenshotUrl && (
            <section className="rounded-3xl border border-app-soft bg-app-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-app-text">Screenshot</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt="Screenshot priložen uz feedback"
                className="max-h-[720px] w-full rounded-2xl border border-app-soft object-contain"
              />
            </section>
          )}

          <section className="rounded-3xl border border-app-soft bg-app-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-app-text">Tehnički podaci</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-app-muted">Korisnik</dt>
                <dd className="mt-1 font-medium text-app-text">{feedback.created_by_name ?? "Nije dostupno"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Email</dt>
                <dd className="mt-1 font-medium text-app-text">{feedback.created_by_email ?? "Nije dostupno"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Preglednik</dt>
                <dd className="mt-1 font-medium text-app-text">{feedback.browser ?? "Nije dostupno"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Operativni sustav</dt>
                <dd className="mt-1 font-medium text-app-text">{feedback.operating_system ?? "Nije dostupno"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Veličina prozora</dt>
                <dd className="mt-1 font-medium text-app-text">{feedback.viewport ?? "Nije dostupno"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Jezik</dt>
                <dd className="mt-1 font-medium text-app-text">{feedback.language ?? "Nije dostupno"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Verzija aplikacije</dt>
                <dd className="mt-1 font-medium text-app-text">{feedback.app_version ?? "Nije dostupno"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Stranica</dt>
                <dd className="mt-1 break-all font-medium text-app-text">
                  {feedback.page_url ? (
                    <a
                      href={feedback.page_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      {feedback.page_url}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    "Nije dostupno"
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <FeedbackAdminForm feedback={feedback} />
        </div>
      </div>
    </div>
  );
}
