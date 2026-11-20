import { createClient } from "@/lib/supabase/server";

export type OverdueAppointmentItem = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  service: {
    id: string;
    name: string;
  } | null;
  employee: {
    id: string;
    display_name: string;
  } | null;
};

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

export async function getOverdueScheduledAppointments() {
  const supabase = await createClient();
  const todayStr = getZagrebDateValue();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      appointment_date,
      start_time,
      end_time,
      client_name,
      service:services (
        id,
        name
      ),
      employee:employees (
        id,
        display_name
      )
    `,
    )
    .eq("status", "scheduled")
    .lte("appointment_date", todayStr)
    .order("appointment_date", { ascending: false })
    .order("end_time", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti overdue termine.");
  }

  const now = new Date();

  const normalized: OverdueAppointmentItem[] = (data ?? []).map((item: any) => {
    const service = Array.isArray(item.service)
      ? (item.service[0] ?? null)
      : (item.service ?? null);

    const employee = Array.isArray(item.employee)
      ? (item.employee[0] ?? null)
      : (item.employee ?? null);

    return {
      id: String(item.id ?? ""),
      appointment_date: String(item.appointment_date ?? ""),
      start_time: String(item.start_time ?? ""),
      end_time: String(item.end_time ?? ""),
      client_name: String(item.client_name ?? ""),
      service: service
        ? {
            id: String(service.id ?? ""),
            name: String(service.name ?? ""),
          }
        : null,
      employee: employee
        ? {
            id: String(employee.id ?? ""),
            display_name: String(employee.display_name ?? ""),
          }
        : null,
    };
  });

  return normalized.filter((item) => {
    const end = new Date(
      `${item.appointment_date}T${item.end_time.slice(0, 5)}:00`,
    );
    return end.getTime() < now.getTime();
  });
}
