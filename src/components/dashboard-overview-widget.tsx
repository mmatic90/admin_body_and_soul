import Link from "next/link";
import {
  BellRing,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Percent,
  UserX,
} from "lucide-react";

type Props = {
  pendingOnlineCount: number;
  todayOnlineCount: number;
  todayAppointmentsCount: number;
  tomorrowAppointmentsCount: number;
  completedThisMonthCount: number;
  noShowThisMonthCount: number;
  onlineConversionRate: number;
};

export default function DashboardOverviewWidget({
  pendingOnlineCount,
  todayOnlineCount,
  todayAppointmentsCount,
  tomorrowAppointmentsCount,
  completedThisMonthCount,
  noShowThisMonthCount,
  onlineConversionRate,
}: Props) {
  const cards = [
    {
      title: "Online na čekanju",
      value: pendingOnlineCount,
      description:
        pendingOnlineCount > 0
          ? "Novi zahtjevi čekaju pregled."
          : "Nema novih zahtjeva.",
      href: "/dashboard/online-bookings?status=pending",
      icon: BellRing,
    },
    {
      title: "Online danas",
      value: todayOnlineCount,
      description: "Online zahtjevi za današnji datum.",
      href: "/dashboard/online-bookings?status=today",
      icon: CalendarDays,
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
    {
      title: "Odrađeno ovaj mjesec",
      value: completedThisMonthCount,
      description: "Broj završenih termina u tekućem mjesecu.",
      href: "/dashboard/reports",
      icon: CheckCircle2,
    },
    {
      title: "No-show ovaj mjesec",
      value: noShowThisMonthCount,
      description: "Klijenti koji se nisu pojavili.",
      href: "/dashboard/reports",
      icon: UserX,
    },
    {
      title: "Online conversion",
      value: `${onlineConversionRate}%`,
      description: "Postotak prihvaćenih online zahtjeva ovaj mjesec.",
      href: "/dashboard/online-bookings?status=all",
      icon: Percent,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
