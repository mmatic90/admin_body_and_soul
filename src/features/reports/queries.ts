import { createClient } from "@/lib/supabase/server";

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

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
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function getReportsDashboardData() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = formatDate(today);
  const weekStartStr = formatDate(startOfWeek(today));
  const weekEndStr = formatDate(endOfWeek(today));
  const monthStartStr = formatDate(startOfMonth(today));
  const monthEndStr = formatDate(endOfMonth(today));

  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 6);
  const last7StartStr = formatDate(last7Start);

  const { data, error } = await supabase
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
      )
    `,
    )
    .gte("appointment_date", last7StartStr)
    .lte("appointment_date", monthEndStr)
    .order("appointment_date", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti reports podatke.");
  }

  const appointments: AppointmentRow[] = (data ?? []).map((item: any) => {
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
    };
  });

  const todayAppointments = appointments.filter(
    (item) => item.appointment_date === todayStr,
  );

  const weekAppointments = appointments.filter(
    (item) =>
      item.appointment_date >= weekStartStr &&
      item.appointment_date <= weekEndStr,
  );

  const monthAppointments = appointments.filter(
    (item) =>
      item.appointment_date >= monthStartStr &&
      item.appointment_date <= monthEndStr,
  );

  const statusCounts = {
    scheduled: monthAppointments.filter((a) => a.status === "scheduled").length,
    completed: monthAppointments.filter((a) => a.status === "completed").length,
    cancelled: monthAppointments.filter((a) => a.status === "cancelled").length,
    no_show: monthAppointments.filter((a) => a.status === "no_show").length,
  };

  const employeeMap = new Map<string, { name: string; count: number }>();
  for (const item of monthAppointments) {
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
  for (const item of monthAppointments) {
    if (!item.service?.id) continue;
    const existing = serviceMap.get(item.service.id);
    if (existing) {
      existing.count += 1;
    } else {
      serviceMap.set(item.service.id, {
        name: item.service.name,
        count: 1,
      });
    }
  }

  const topEmployees = Array.from(employeeMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topServices = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(last7Start);
    date.setDate(last7Start.getDate() + index);
    const dateStr = formatDate(date);

    return {
      date: dateStr,
      count: appointments.filter((a) => a.appointment_date === dateStr).length,
    };
  });

  return {
    summary: {
      today: todayAppointments.length,
      week: weekAppointments.length,
      month: monthAppointments.length,
    },
    statusCounts,
    topEmployees,
    topServices,
    last7Days,
  };
}
