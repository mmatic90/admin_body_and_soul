import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeSchedulePageData } from "@/features/schedule/queries";
import DefaultScheduleForm from "./default-schedule-form";
import DefaultScheduleRangeForm from "./default-schedule-range-form";
import OverrideForm from "./override-form";
import OverrideList from "./override-list";
import { requireAdminForScheduleManagement } from "@/lib/page-guards";

export default async function EmployeeSchedulePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  await requireAdminForScheduleManagement();

  const { employeeId } = await params;
  const data = await getEmployeeSchedulePageData(employeeId);

  if (!data) notFound();

  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: data.employee.color_hex || "#999999" }} />
              <h1 className="text-3xl font-bold text-app-text">{data.employee.display_name}</h1>
            </div>

            <Link href="/dashboard/schedule" className="inline-flex items-center justify-center rounded-xl border border-app-soft bg-white px-4 py-2 font-medium text-app-text transition hover:bg-app-bg">
              Natrag na zaposlenike
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
          <span className="font-semibold">Važno kod unosa vremena:</span>{" "}
          sva vremena upisuju se u <strong>24-satnom formatu</strong>. Na primjer, 3 popodne je <strong>15:00</strong>, a ne 03:00. Provjeri posebno početak i kraj radnog vremena te pauze prije spremanja.
        </div>

        <div className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-app-text">Radno vrijeme za sljedećih 5 dana</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {data.upcomingSchedule.map((item) => {
              const cardClasses = item.is_override
                ? "border-[#cbbca9] bg-[#efe6da]"
                : item.is_working
                  ? "border-[#b0a695] bg-[#e7dfd4]"
                  : "border-[#d8cec0] bg-[#f3eeea]";

              const badgeClasses = item.is_override
                ? "bg-[#d8c8b4] text-app-text"
                : item.is_working
                  ? "bg-[#b0a695] text-white"
                  : "bg-[#5A5753] text-white";

              return (
                <div key={item.date} className={`rounded-2xl border p-4 ${cardClasses}`}>
                  <div className="text-sm capitalize text-app-muted">{item.day_label}</div>
                  <div className="mt-1 font-medium text-app-text">{item.date}</div>
                  <div className="mt-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClasses}`}>{item.status_label}</span>
                  </div>
                  <div className="mt-3 text-sm text-app-text">
                    {item.is_working && item.start_time && item.end_time
                      ? `${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}`
                      : "-"}
                  </div>
                  {item.break_start_time && item.break_end_time ? (
                    <div className="mt-1 text-xs font-medium text-app-muted">
                      Pauza: {item.break_start_time.slice(0, 5)} - {item.break_end_time.slice(0, 5)}
                    </div>
                  ) : null}
                  {item.reason_label ? <div className="mt-2 text-xs text-app-muted">{item.reason_label}</div> : null}
                </div>
              );
            })}
          </div>
        </div>

        <section className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm md:p-6">
          <h2 className="text-2xl font-semibold text-app-text">Redovni raspored po danima</h2>
          <div className="mt-6">
            <DefaultScheduleForm employeeId={data.employee.id} defaultSchedule={data.defaultSchedule} />
          </div>
        </section>

        <section className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm md:p-6">
          <h2 className="text-2xl font-semibold text-app-text">Brza primjena na raspon dana</h2>
          <div className="mt-6">
            <DefaultScheduleRangeForm employeeId={data.employee.id} defaultSchedule={data.defaultSchedule} />
          </div>
        </section>

        <section className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm md:p-6">
          <h2 className="text-2xl font-semibold text-app-text">Dodaj posebnu izmjenu</h2>
          <div className="mt-6"><OverrideForm employeeId={data.employee.id} /></div>
        </section>

        <section className="rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm md:p-6">
          <h2 className="text-2xl font-semibold text-app-text">Postojeće posebne izmjene</h2>
          <div className="mt-6">
            <OverrideList employeeId={data.employee.id} overrides={data.overrides} />
          </div>
        </section>
      </div>
    </main>
  );
}
