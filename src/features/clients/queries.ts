import { createClient } from "@/lib/supabase/server";

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export type ClientListItem = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  internal_note: string | null;
  appointments_count: number;
  last_appointment: string | null;
  next_appointment: string | null;
};

export type ClientAppointmentRow = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  internal_note: string | null;
  appointment_services?: {
    id: string;
    service_id: string;
    duration_minutes: number;
    sort_order: number;
    service: {
      id: string;
      name: string;
      service_group: string | null;
    } | null;
  }[];
  employee: {
    id: string;
    display_name: string;
  } | null;
  room: {
    id: string;
    name: string;
  } | null;
};

export type ClientInsights = {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  scheduled_appointments: number;
  no_show_rate: number;
  cancellation_rate: number;
  favorite_service: string | null;
  favorite_employee: string | null;
  last_completed_appointment: string | null;
  average_days_between_visits: number | null;
  segment: "new" | "active" | "regular" | "at_risk" | "lost";
  alerts: string[];
};

export type ClientDetails = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  internal_note: string | null;
  appointments_count: number;
  last_appointment: string | null;
  next_appointment: string | null;
  pastAppointments: ClientAppointmentRow[];
  upcomingAppointments: ClientAppointmentRow[];
  insights: ClientInsights;
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function daysBetween(dateA: string, dateB: string) {
  const a = new Date(`${dateA}T00:00:00`);
  const b = new Date(`${dateB}T00:00:00`);
  const diff = Math.abs(b.getTime() - a.getTime());
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getClientSegment(args: {
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  lastCompletedAppointment: string | null;
  todayStr: string;
}) {
  const {
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    lastCompletedAppointment,
    todayStr,
  } = args;

  const riskEvents = cancelledAppointments + noShowAppointments;

  if (completedAppointments <= 1) {
    return "new" as const;
  }

  if (riskEvents >= 2) {
    return "at_risk" as const;
  }

  if (!lastCompletedAppointment) {
    return "lost" as const;
  }

  const daysSinceLastVisit = daysBetween(lastCompletedAppointment, todayStr);

  if (completedAppointments >= 4 && daysSinceLastVisit <= 90) {
    return "regular" as const;
  }

  if (daysSinceLastVisit <= 60) {
    return "active" as const;
  }

  return "lost" as const;
}

export async function getClientsList(
  search?: string,
): Promise<ClientListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select(
      `
      id,
      full_name,
      phone,
      email,
      note,
      internal_note,
      appointments:appointments!appointments_client_id_fkey (
        id,
        appointment_date
      )
    `,
    )
    .eq("is_active", true);

  if (search?.trim()) {
    const q = search.trim();
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  const { data, error } = await query.order("full_name", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti klijente.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  return (data ?? []).map((client: any) => {
    const appointments = (client.appointments ?? []) as {
      id: string;
      appointment_date: string;
    }[];

    let lastAppointment: string | null = null;
    let nextAppointment: string | null = null;

    for (const appointment of appointments) {
      if (appointment.appointment_date <= todayStr) {
        if (
          !lastAppointment ||
          appointment.appointment_date > lastAppointment
        ) {
          lastAppointment = appointment.appointment_date;
        }
      }

      if (appointment.appointment_date >= todayStr) {
        if (
          !nextAppointment ||
          appointment.appointment_date < nextAppointment
        ) {
          nextAppointment = appointment.appointment_date;
        }
      }
    }

    return {
      id: client.id,
      full_name: client.full_name,
      phone: client.phone,
      email: client.email,
      note: client.note,
      internal_note: client.internal_note,
      appointments_count: appointments.length,
      last_appointment: lastAppointment,
      next_appointment: nextAppointment,
    };
  });
}

export async function getClientById(id: string): Promise<ClientDetails | null> {
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(
      `
      id,
      full_name,
      phone,
      email,
      note,
      internal_note,
      is_active
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (clientError) {
    console.error("getClientById - client error:", clientError);
    throw new Error("Nije moguće dohvatiti klijenta.");
  }

  if (!client) {
    return null;
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select(
      `
      id,
      appointment_date,
      start_time,
      end_time,
      status,
      client_name,
      client_phone,
      client_email,
      internal_note,
      appointment_services (
        id,
        service_id,
        duration_minutes,
        sort_order,
        service:services (
          id,
          name,
          service_group
        )
      ),
      employee:employees (
        id,
        display_name
      ),
      room:rooms (
        id,
        name
      )
    `,
    )
    .eq("client_id", id)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (appointmentsError) {
    console.error("getClientById - appointments error:", appointmentsError);
    throw new Error("Nije moguće dohvatiti detalje klijenta.");
  }

  const rows: ClientAppointmentRow[] = (appointments ?? []).map((item: any) => {
    const employee = getSingleRelation(item.employee);
    const room = getSingleRelation(item.room);

    return {
      id: String(item.id ?? ""),
      appointment_date: String(item.appointment_date ?? ""),
      start_time: String(item.start_time ?? ""),
      end_time: String(item.end_time ?? ""),
      status: item.status as AppointmentStatus,
      client_name: String(item.client_name ?? ""),
      client_phone: item.client_phone ? String(item.client_phone) : null,
      client_email: item.client_email ? String(item.client_email) : null,
      internal_note: item.internal_note ? String(item.internal_note) : null,
      appointment_services: Array.isArray(item.appointment_services)
        ? item.appointment_services.map((serviceItem: any) => {
            const service = getSingleRelation(serviceItem.service);

            return {
              id: String(serviceItem.id ?? ""),
              service_id: String(serviceItem.service_id ?? ""),
              duration_minutes: Number(serviceItem.duration_minutes ?? 0),
              sort_order: Number(serviceItem.sort_order ?? 0),
              service: service
                ? {
                    id: String(service.id ?? ""),
                    name: String(service.name ?? ""),
                    service_group: service.service_group
                      ? String(service.service_group)
                      : null,
                  }
                : null,
            };
          })
        : [],
      employee: employee
        ? {
            id: String(employee.id ?? ""),
            display_name: String(employee.display_name ?? ""),
          }
        : null,
      room: room
        ? {
            id: String(room.id ?? ""),
            name: String(room.name ?? ""),
          }
        : null,
    };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const pastAppointments = rows.filter(
    (item) => item.appointment_date < todayStr,
  );

  const upcomingAppointments = [...rows]
    .filter((item) => item.appointment_date >= todayStr)
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return a.appointment_date.localeCompare(b.appointment_date);
      }
      return a.start_time.localeCompare(b.start_time);
    });

  let lastAppointment: string | null = null;
  let nextAppointment: string | null = null;

  for (const item of rows) {
    if (item.appointment_date <= todayStr) {
      if (!lastAppointment || item.appointment_date > lastAppointment) {
        lastAppointment = item.appointment_date;
      }
    }

    if (item.appointment_date >= todayStr) {
      if (!nextAppointment || item.appointment_date < nextAppointment) {
        nextAppointment = item.appointment_date;
      }
    }
  }

  const completedAppointments = rows.filter(
    (item) => item.status === "completed",
  );
  const cancelledAppointments = rows.filter(
    (item) => item.status === "cancelled",
  );
  const noShowAppointments = rows.filter((item) => item.status === "no_show");
  const scheduledAppointments = rows.filter(
    (item) => item.status === "scheduled",
  );

  const serviceCounter = new Map<string, number>();
  const employeeCounter = new Map<string, number>();

  for (const appointment of rows) {
    for (const serviceItem of appointment.appointment_services ?? []) {
      const serviceName = serviceItem.service?.name?.trim();
      if (!serviceName) continue;

      serviceCounter.set(
        serviceName,
        (serviceCounter.get(serviceName) ?? 0) + 1,
      );
    }

    const employeeName = appointment.employee?.display_name?.trim();
    if (employeeName) {
      employeeCounter.set(
        employeeName,
        (employeeCounter.get(employeeName) ?? 0) + 1,
      );
    }
  }

  const favoriteService =
    Array.from(serviceCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;

  const favoriteEmployee =
    Array.from(employeeCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null;

  const lastCompletedAppointment =
    [...completedAppointments].sort((a, b) =>
      b.appointment_date.localeCompare(a.appointment_date),
    )[0]?.appointment_date ?? null;

  const completedDates = [
    ...new Set(completedAppointments.map((item) => item.appointment_date)),
  ].sort((a, b) => a.localeCompare(b));

  let averageDaysBetweenVisits: number | null = null;

  if (completedDates.length >= 2) {
    let totalDays = 0;
    let gaps = 0;

    for (let i = 1; i < completedDates.length; i++) {
      totalDays += daysBetween(completedDates[i - 1], completedDates[i]);
      gaps += 1;
    }

    averageDaysBetweenVisits = gaps > 0 ? Math.round(totalDays / gaps) : null;
  }

  const noShowRate =
    rows.length > 0
      ? Math.round((noShowAppointments.length / rows.length) * 100)
      : 0;

  const cancellationRate =
    rows.length > 0
      ? Math.round((cancelledAppointments.length / rows.length) * 100)
      : 0;

  const segment = getClientSegment({
    completedAppointments: completedAppointments.length,
    cancelledAppointments: cancelledAppointments.length,
    noShowAppointments: noShowAppointments.length,
    lastCompletedAppointment,
    todayStr,
  });

  const alerts: string[] = [];

  if (noShowAppointments.length >= 2 || noShowRate >= 25) {
    alerts.push("Povišen no-show rizik.");
  }

  if (cancelledAppointments.length >= 2 || cancellationRate >= 25) {
    alerts.push("Klijent često otkazuje termine.");
  }

  if (lastCompletedAppointment) {
    const daysSinceLastVisit = daysBetween(lastCompletedAppointment, todayStr);
    if (daysSinceLastVisit > 120) {
      alerts.push(`Klijent nije bio ${daysSinceLastVisit} dana.`);
    }
  }

  if (favoriteService) {
    alerts.push(`Najčešće rezervira: ${favoriteService}.`);
  }

  return {
    id: client.id,
    full_name: client.full_name,
    phone: client.phone,
    email: client.email,
    note: client.note,
    internal_note: client.internal_note,
    appointments_count: rows.length,
    last_appointment: lastAppointment,
    next_appointment: nextAppointment,
    pastAppointments,
    upcomingAppointments,
    insights: {
      total_appointments: rows.length,
      completed_appointments: completedAppointments.length,
      cancelled_appointments: cancelledAppointments.length,
      no_show_appointments: noShowAppointments.length,
      scheduled_appointments: scheduledAppointments.length,
      no_show_rate: noShowRate,
      cancellation_rate: cancellationRate,
      favorite_service: favoriteService,
      favorite_employee: favoriteEmployee,
      last_completed_appointment: lastCompletedAppointment,
      average_days_between_visits: averageDaysBetweenVisits,
      segment,
      alerts,
    },
  };
}

export async function getClientOptions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, note, internal_note")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti klijente.");
  }

  return (data ?? []) as {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    note: string | null;
    internal_note: string | null;
  }[];
}
