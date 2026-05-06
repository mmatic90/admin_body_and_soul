import { getReportsDashboardData } from "@/features/reports/queries";
import { requireAdminForReports } from "@/lib/page-guards";
import { formatDateHR } from "@/lib/datetime";
import EmptyStateCard from "@/components/empty-state-card";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
      <div className="text-sm text-app-muted">{label}</div>
      <div className="mt-2 text-3xl font-bold text-app-text">{value}</div>
      {helper ? (
        <div className="mt-2 text-xs text-app-muted">{helper}</div>
      ) : null}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-app-text">{label}</span>
        <span className="text-app-muted">
          {value} / {total} ({percent}%)
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-app-card-alt">
        <div
          className="h-full rounded-full bg-app-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function RankingList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: { name: string; count: number }[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return <EmptyStateCard title={emptyTitle} description={emptyDescription} />;
  }

  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="mt-4 space-y-4">
      {items.map((item, index) => {
        const percent = Math.round((item.count / max) * 100);

        return (
          <div
            key={`${item.name}-${index}`}
            className="rounded-xl border border-app-soft bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-app-text">
                  {index + 1}. {item.name}
                </div>
                <div className="mt-1 text-xs text-app-muted">
                  {item.count} termina
                </div>
              </div>

              <div className="text-lg font-bold text-app-text">
                {item.count}
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-app-card-alt">
              <div
                className="h-full rounded-full bg-app-accent"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function ReportsPage() {
  await requireAdminForReports();

  const data = await getReportsDashboardData();

  const hasAnyReportData =
    data.summary.today > 0 || data.summary.week > 0 || data.summary.month > 0;

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader
        title="Reports"
        description="Mjesečni pregled poslovanja, statusa termina, online rezervacija, usluga i zaposlenika."
      />

      {!hasAnyReportData ? (
        <EmptyStateCard
          title="Još nema podataka za izvještaje"
          description="Kad počneš unositi i obrađivati termine, ovdje će se prikazivati statistika poslovanja."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Termini danas" value={data.summary.today} />
        <StatCard label="Termini ovaj tjedan" value={data.summary.week} />
        <StatCard label="Termini ovaj mjesec" value={data.summary.month} />
        <StatCard
          label="Online conversion"
          value={`${data.summary.onlineConversionRate}%`}
          helper="Prihvaćeni online zahtjevi / svi online zahtjevi ovaj mjesec"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Odrađeni"
          value={data.summary.completedMonth}
          helper="Ovaj mjesec"
        />
        <StatCard
          label="Zakazani"
          value={data.summary.scheduledMonth}
          helper="Ovaj mjesec"
        />
        <StatCard
          label="Otkazani"
          value={data.summary.cancelledMonth}
          helper="Ovaj mjesec"
        />
        <StatCard
          label="No-show"
          value={data.summary.noShowMonth}
          helper={`${data.summary.noShowRate}% svih termina ovaj mjesec`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection title="Statusi termina ovaj mjesec">
          <div className="mt-4 space-y-5">
            <ProgressRow
              label="Odrađeni"
              value={data.statusCounts.completed}
              total={data.summary.month}
            />
            <ProgressRow
              label="Zakazani"
              value={data.statusCounts.scheduled}
              total={data.summary.month}
            />
            <ProgressRow
              label="Otkazani"
              value={data.statusCounts.cancelled}
              total={data.summary.month}
            />
            <ProgressRow
              label="No-show"
              value={data.statusCounts.no_show}
              total={data.summary.month}
            />
          </div>

          <div className="mt-6 rounded-2xl bg-app-card-alt p-4">
            <div className="text-sm text-app-muted">Completion rate</div>
            <div className="mt-1 text-3xl font-bold text-app-text">
              {data.summary.completionRate}%
            </div>
          </div>
        </PageSection>

        <PageSection title="Online booking funnel ovaj mjesec">
          <div className="mt-4 space-y-5">
            <ProgressRow
              label="Ukupno online zahtjeva"
              value={data.onlineCounts.total}
              total={data.onlineCounts.total}
            />
            <ProgressRow
              label="Na čekanju"
              value={data.onlineCounts.pending}
              total={data.onlineCounts.total}
            />
            <ProgressRow
              label="Prihvaćeno"
              value={data.onlineCounts.accepted}
              total={data.onlineCounts.total}
            />
            <ProgressRow
              label="Odbijeno"
              value={data.onlineCounts.rejected}
              total={data.onlineCounts.total}
            />
          </div>

          <div className="mt-6 rounded-2xl bg-app-card-alt p-4">
            <div className="text-sm text-app-muted">Online conversion rate</div>
            <div className="mt-1 text-3xl font-bold text-app-text">
              {data.summary.onlineConversionRate}%
            </div>
          </div>
        </PageSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection title="Top zaposlenici ovaj mjesec">
          <RankingList
            items={data.topEmployees}
            emptyTitle="Nema podataka o zaposlenicima"
            emptyDescription="Još nema dovoljno termina u odabranom rasponu."
          />
        </PageSection>

        <PageSection title="Top usluge ovaj mjesec">
          <RankingList
            items={data.topServices}
            emptyTitle="Nema podataka o uslugama"
            emptyDescription="Još nema dovoljno termina u odabranom rasponu."
          />
        </PageSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection title="Termini zadnjih 14 dana">
          <div className="mt-4 space-y-3">
            {data.last14Days.map((day) => (
              <div
                key={day.date}
                className="rounded-xl border border-app-soft bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-app-muted">
                    {formatDateHR(day.date)}
                  </div>
                  <div className="text-lg font-semibold text-app-text">
                    {day.count}
                  </div>
                </div>

                <div className="mt-2 text-xs text-app-muted">
                  Odrađeni: {day.completed} · No-show: {day.no_show}
                </div>
              </div>
            ))}
          </div>
        </PageSection>

        <PageSection title="Najaktivniji dani">
          <div className="mt-4 space-y-3">
            {data.busiestDays.map((day, index) => (
              <div
                key={`${day.date}-${index}`}
                className="flex items-center justify-between rounded-xl border border-app-soft bg-white px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-app-text">
                    {index + 1}. {formatDateHR(day.date)}
                  </div>
                  <div className="mt-1 text-xs text-app-muted">
                    Odrađeni: {day.completed} · No-show: {day.no_show}
                  </div>
                </div>

                <div className="text-lg font-bold text-app-text">
                  {day.count}
                </div>
              </div>
            ))}
          </div>
        </PageSection>
      </div>
    </PageShell>
  );
}
