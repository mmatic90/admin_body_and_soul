import Link from "next/link";
import { BellRing, CalendarCheck, CalendarDays } from "lucide-react";

type Props = {
  pendingOnlineCount: number;
  todayAppointmentsCount: number;
  tomorrowAppointmentsCount: number;
};

export default function DashboardOverviewWidget({
  pendingOnlineCount,
  todayAppointmentsCount,
  tomorrowAppointmentsCount,
}: Props) {
  const cards = [
    {
      title: "Online zahtjevi",
      value: pendingOnlineCount,
      description:
        pendingOnlineCount > 0
          ? "Novi zahtjevi čekaju pregled."
          : "Nema novih zahtjeva.",
      href: "/dashboard/online-bookings",
      icon: BellRing,
    },
    {
      title: "Termini danas",
      value: todayAppointmentsCount,
      description: "Zakazani termini za danas.",
      href: "/dashboard/calendar/time-grid",
      icon: CalendarCheck,
    },
    {
      title: "Termini sutra",
      value: tomorrowAppointmentsCount,
      description: "Zakazani termini za sutra.",
      href: "/dashboard/calendar/time-grid",
      icon: CalendarDays,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-2xl border border-app-soft bg-app-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-app-muted">
                  {card.title}
                </p>

                <div className="mt-3 text-4xl font-bold text-app-text">
                  {card.value}
                </div>
              </div>

              <div className="rounded-2xl bg-app-card-alt p-3 text-app-accent transition group-hover:bg-app-accent group-hover:text-white">
                <Icon className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-4 text-sm text-app-muted">{card.description}</p>
          </Link>
        );
      })}
    </section>
  );
}
