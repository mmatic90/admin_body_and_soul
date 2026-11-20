import { createClient } from "@/lib/supabase/server";

export type ReportPeriod =
  | "current_month"
  | "previous_month"
  | "last_30_days";

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

type RawReportServiceRelation = {
  id?: unknown;
  name?: unknown;
};

type RawReportAppointmentService = {
  service?:
    | RawReportServiceRelation
    | RawReportServiceRelation[]
    | null;
};

type AppointmentServiceRow = {
  service: {
    id: string;
    name: string;
  } | null;
};

type AppointmentRow = {
  id: string;
  appointment_date: string;
  status: AppointmentStatus;
  employee_id: string | null;
  service_id: string | null;
  employee: {
    id: string;
    display_name: string;
  } | null;
  service: {
    id: string;
    name: string;
  } | null;
  appointment_services: AppointmentServiceRow[];
};

type OnlineBookingRow = {
  id: string;
  status: "pending" | "accepted" | "rejected" | string;
  created_at: string;
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getZagrebDateValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(value: string, days: number) {
  const date = parseDateValue(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

function getPeriodRange(period: ReportPeriod) {
  const today = getZagrebDateValue();
  const todayDate = parseDateValue(today);
  const year = todayDate.getUTCFullYear();
  const month = todayDate.getUTCMonth();

  if (period === "previous_month") {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    return {
      start: formatUtcDate(start),
      end: formatUtcDate(end),
      label: "Prošli mjesec",
    };
  }

  if (period === "last_30_days") {
    return {
      start: addDays(today, -29),
      end: today,
      label: "Zadnjih 30 dana",
    };
  }

  return {
    start: formatUtcDate(new Date(Date.UTC(year, month, 1))),
    end: today,
    label: "Ovaj mjesec",
  };
}

function enumerateDates(start: string, end: string) {
  const dates: string[] = [];
  let current = start;

  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

function safeRate(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function getZagrebDateFromTimestamp(value: string) {
  return getZagrebDateValue(new Date(value));
}

export async function getReportsDashboardData(
  period: ReportPeriod = "current_month",
) {
  const supabase = await createClient();
  const range = getPeriodRange(period);

  const onlineBufferStart = addDays(range.start, -1);
  const onlineBufferEnd = addDays(range.end, 1);

  const [
    { data: appointmentData, error: appointmentError },
    { data: onlineData, error: onlineError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        status,
        employee_id,
        service_id,
        employee:employees (
          id,
          display_name
        ),
        service:services (
          id,
          name
        ),
        appointment_services (
          service:services (
            id,
            name
          )
        )
      `,
      )
      .gte("appointment_date", range.start)
      .lte("appointment_date", range.end)
      .order("appointment_date", { ascending: true }),

    supabase
      .from("online_booking_requests")
      .select("id, status, created_at")
      .gte("created_at", `${onlineBufferStart}T00:00:00Z`)
      .lte("created_at", `${onlineBufferEnd}T23:59:59Z`),
  ]);

  if (appointmentError) {
    console.error(appointmentError);
    throw new Error("Nije moguće dohvatiti podatke za izvještaje.");
  }

  if (onlineError) {
    console.error(onlineError);
    throw new Error("Nije moguće dohvatiti podatke online rezervacija.");
  }

  const appointments: AppointmentRow[] = (appointmentData ?? []).map(
    (item: any) => {
      const employee = getSingleRelation(item.employee);
      const service = getSingleRelation(item.service);

      return {
        id: String(item.id ?? ""),
        appointment_date: String(item.appointment_date ?? ""),
        status: item.status as AppointmentStatus,
        employee_id: item.employee_id ? String(item.employee_id) : null,
        service_id: item.service_id ? String(item.service_id) : null,
        employee: employee
          ? {
              id: String(employee.id ?? ""),
              display_name: String(employee.display_name ?? ""),
            }
          : null,
        service: service
          ? {
              id: String(service.id ?? ""),
              name: String(service.name ?? ""),
            }
          : null,
        appointment_services: Array.isArray(item.appointment_services)
          ? (item.appointment_services as RawReportAppointmentService[]).flatMap(
              (row): AppointmentServiceRow[] => {
                const relatedService = getSingleRelation(row.service);

                if (!relatedService) {
                  return [];
                }

                return [
                  {
                    service: {
                      id: String(relatedService.id ?? ""),
                      name: String(relatedService.name ?? ""),
                    },
                  },
                ];
              },
            )
          : [],
      };
    },
  );

  const onlineBookings = ((onlineData ?? []) as OnlineBookingRow[]).filter(
    (item) => {
      const localDate = getZagrebDateFromTimestamp(item.created_at);
      return localDate >= range.start && localDate <= range.end;
    },
  );

  const statusCounts = {
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    no_show: appointments.filter((a) => a.status === "no_show").length,
  };

  const totalAppointments = appointments.length;
  const completionRate = safeRate(statusCounts.completed, totalAppointments);
  const noShowRate = safeRate(statusCounts.no_show, totalAppointments);

  const onlineCounts = {
    total: onlineBookings.length,
    pending: onlineBookings.filter((item) => item.status === "pending").length,
    accepted: onlineBookings.filter((item) => item.status === "accepted").length,
    rejected: onlineBookings.filter((item) => item.status === "rejected").length,
  };

  const onlineConversionRate = safeRate(
    onlineCounts.accepted,
    onlineCounts.total,
  );

  const employeeMap = new Map<string, { name: string; count: number }>();

  for (const item of appointments) {
    if (!item.employee?.id) continue;

    const existing = employeeMap.get(item.employee.id);
    if (existing) {
      existing.count += 1;
    } else {
      employeeMap.set(item.employee.id, {
        name: item.employee.display_name,
        count: 1,
      });
    }
  }

  const serviceMap = new Map<string, { name: string; count: number }>();

  for (const item of appointments) {
    const services =
      item.appointment_services.length > 0
        ? item.appointment_services
            .map((row) => row.service)
            .filter(Boolean)
        : item.service
          ? [item.service]
          : [];

    for (const service of services) {
      if (!service?.id) continue;

      const existing = serviceMap.get(service.id);
      if (existing) {
        existing.count += 1;
      } else {
        serviceMap.set(service.id, {
          name: service.name,
          count: 1,
        });
      }
    }
  }

  const topEmployees = Array.from(employeeMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topServices = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const trend = enumerateDates(range.start, range.end).map((date) => {
    const dayAppointments = appointments.filter(
      (appointment) => appointment.appointment_date === date,
    );

    return {
      date,
      count: dayAppointments.length,
      completed: dayAppointments.filter((a) => a.status === "completed").length,
      no_show: dayAppointments.filter((a) => a.status === "no_show").length,
    };
  });

  const busiestDays = [...trend]
    .filter((day) => day.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    period: {
      key: period,
      label: range.label,
      start: range.start,
      end: range.end,
    },
    summary: {
      totalAppointments,
      completedAppointments: statusCounts.completed,
      scheduledAppointments: statusCounts.scheduled,
      cancelledAppointments: statusCounts.cancelled,
      noShowAppointments: statusCounts.no_show,
      completionRate,
      noShowRate,
      onlineConversionRate,
    },
    statusCounts,
    onlineCounts,
    topEmployees,
    topServices,
    trend,
    busiestDays,
  };
}
