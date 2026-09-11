import Link from "next/link";
import { getReportsDashboardData, type ReportPeriod } from "@/features/reports/queries";
import { requireAdminForReports } from "@/lib/page-guards";
import { formatDateHR } from "@/lib/datetime";
import EmptyStateCard from "@/components/empty-state-card";
import PageShell from "@/components/page-shell";
import PageHeader from "@/components/page-header";
import PageSection from "@/components/page-section";

type SearchParams = Promise<{
  period?: string;
}>;

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: "current_month", label: "Ovaj mjesec" },
  { value: "previous_month", label: "Prošli mjesec" },
  { value: "last_30_days", label: "Zadnjih 30 dana" },
];

function resolvePeriod(value?: string): ReportPeriod {
  if (
    value === "previous_month" ||
    value === "last_30_days" ||
    value === "current_month"
  ) {
    return value;
  }

  return "current_month";
}

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
      {helper ? <div className="mt-2 text-xs text-app-muted">{helper}</div> : null}
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
                <div className="mt-1 text-xs text-app-muted">{item.count} termina</div>
              </div>
              <div className="text-lg font-bold text-app-text">{item.count}</div>
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

function TrendBars({
  items,
}: {
  items: {
    date: string;
    count: number;
    completed: number;
    no_show: number;
  }[];
}) {
  if (items.length === 0) {
    return (
      <EmptyStateCard
        title="Nema podataka za trend"
        description="U odabranom razdoblju nema termina."
      />
    );
  }

  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="mt-4 overflow-x-auto pb-2">
      <div
        className="grid min-w-max items-end gap-2 rounded-2xl border border-app-soft bg-white px-4 pb-3 pt-5"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(34px, 1fr))`,
          minWidth: `${Math.max(items.length * 42, 720)}px`,
        }}
      >
        {items.map((item) => {
          const heightPercent = item.count > 0 ? Math.max((item.count / max) * 100, 8) : 0;
          const [, month, day] = item.date.split("-");

          return (
            <div key={item.date} className="flex min-w-0 flex-col items-center">
              <div className="mb-2 text-xs font-semibold text-app-text">
                {item.count}
              </div>

              <div className="flex h-44 w-full items-end justify-center border-b border-app-soft">
                <div
                  className="w-5 rounded-t-md bg-app-accent transition-all"
                  style={{ height: `${heightPercent}%` }}
                  title={`${formatDateHR(item.date)}: ${item.count} termina · Odrađeno ${item.completed} · No-show ${item.no_show}`}
                />
              </div>

              <div className="mt-2 whitespace-nowrap text-[10px] text-app-muted">
                {day}.{month}.
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-app-muted">
        Broj iznad stupca prikazuje ukupan broj termina tog dana.
      </p>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminForReports();

  const resolvedSearchParams = await searchParams;
  const period = resolvePeriod(resolvedSearchParams.period);
  const data = await getReportsDashboardData(period);

  const hasAnyReportData =
    data.summary.totalAppointments > 0 || data.onlineCounts.total > 0;

  return (
    <PageShell maxWidth="max-w-7xl">
      <PageHeader title="Izvještaji" />

      <div className="rounded-2xl border border-app-soft bg-app-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => {
            const active = option.value === period;

            return (
              <Link
                key={option.value}
                href={`/dashboard/reports?period=${option.value}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-app-accent text-white shadow-sm"
                    : "bg-app-card-alt text-app-text hover:bg-app-bg"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-3 text-sm text-app-muted">
          Razdoblje: {formatDateHR(data.period.start)} – {formatDateHR(data.period.end)}
        </div>
      </div>

      {!hasAnyReportData ? (
        <EmptyStateCard
          title="Još nema podataka za izvještaje"
          description="Za odabrano razdoblje nema termina ni online zahtjeva."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Termini"
          value={data.summary.totalAppointments}
          helper={data.period.label}
        />
        <StatCard
          label="Odrađeni"
          value={data.summary.completedAppointments}
          helper={`${data.summary.completionRate}% svih termina`}
        />
        <StatCard
          label="No-show"
          value={`${data.summary.noShowRate}%`}
          helper={`${data.summary.noShowAppointments} termina`}
        />
        <StatCard
          label="Online rezervacije"
          value={`${data.summary.onlineConversionRate}%`}
          helper={`${data.onlineCounts.accepted} od ${data.onlineCounts.total} zahtjeva prihvaćeno`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection title="Statusi termina">
          <div className="mt-4 space-y-5">
            <ProgressRow
              label="Odrađeno"
              value={data.statusCounts.completed}
              total={data.summary.totalAppointments}
            />
            <ProgressRow
              label="Zakazano"
              value={data.statusCounts.scheduled}
              total={data.summary.totalAppointments}
            />
            <ProgressRow
              label="Otkazano"
              value={data.statusCounts.cancelled}
              total={data.summary.totalAppointments}
            />
            <ProgressRow
              label="No-show"
              value={data.statusCounts.no_show}
              total={data.summary.totalAppointments}
            />
          </div>
        </PageSection>

        <PageSection title="Online rezervacije">
          <div className="mt-4 space-y-5">
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
            <ProgressRow
              label="Na čekanju"
              value={data.onlineCounts.pending}
              total={data.onlineCounts.total}
            />
          </div>

          <div className="mt-5 rounded-2xl bg-app-card-alt p-4 text-sm text-app-muted">
            <span className="font-semibold text-app-text">{data.onlineCounts.accepted}</span>{" "}
            od {data.onlineCounts.total} zahtjeva prihvaćeno —{" "}
            <span className="font-semibold text-app-text">
              {data.summary.onlineConversionRate}%
            </span>
          </div>
        </PageSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection title="Termini po djelatniku">
          <RankingList
            items={data.topEmployees}
            emptyTitle="Nema podataka o djelatnicima"
            emptyDescription="U odabranom razdoblju nema termina."
          />
        </PageSection>

        <PageSection title="Najtraženije usluge">
          <RankingList
            items={data.topServices}
            emptyTitle="Nema podataka o uslugama"
            emptyDescription="U odabranom razdoblju nema termina."
          />
        </PageSection>
      </div>

      <PageSection title="Trend termina">
        <TrendBars items={data.trend} />
      </PageSection>

      <PageSection title="Najaktivniji dani">
        {data.busiestDays.length === 0 ? (
          <EmptyStateCard
            title="Nema aktivnih dana"
            description="U odabranom razdoblju nema termina."
          />
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {data.busiestDays.map((day, index) => (
              <div
                key={day.date}
                className="rounded-xl border border-app-soft bg-white px-4 py-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                  #{index + 1}
                </div>
                <div className="mt-1 text-sm font-semibold text-app-text">
                  {formatDateHR(day.date)}
                </div>
                <div className="mt-2 text-2xl font-bold text-app-text">{day.count}</div>
                <div className="mt-1 text-xs text-app-muted">
                  Odrađeno {day.completed} · No-show {day.no_show}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </PageShell>
  );
}
