import { createClient } from "@/lib/supabase/server";

export type CalendarAppointmentItem = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  client_name: string;
  client_phone: string | null;
  service: {
    id: string;
    name: string;
    service_group: string | null;
  } | null;
  room: {
    id: string;
    name: string;
  } | null;
  employee: {
    id: string;
    display_name: string;
    color_hex: string | null;
  } | null;
};

export type CalendarRoomGroup = {
  roomId: string;
  roomName: string;
  appointments: CalendarAppointmentItem[];
};

export type CalendarEmployeeGroup = {
  employeeId: string;
  employeeName: string;
  colorHex: string | null;
  workStatus: {
    isWorking: boolean;
    isOverride: boolean;
    label: string;
  };
  appointments: CalendarAppointmentItem[];
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

async function getCalendarAppointments(
  date: string,
): Promise<CalendarAppointmentItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      status,
      client_name,
      client_phone,
      service:services (
        id,
        name,
        service_group
      ),
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
      room:rooms (
        id,
        name
      ),
      employee:employees (
        id,
        display_name,
        color_hex
      )
    `,
    )
    .eq("appointment_date", date)
    .order("start_time", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti termine za kalendar.");
  }

  return (data ?? []).map((item: any) => {
    const service = getSingleRelation(item.service);
    const room = getSingleRelation(item.room);
    const employee = getSingleRelation(item.employee);

    return {
      id: String(item.id ?? ""),
      appointment_date: String(item.appointment_date ?? ""),
      start_time: String(item.start_time ?? ""),
      end_time: String(item.end_time ?? ""),
      duration_minutes: Number(item.duration_minutes ?? 0),
      status: item.status as
        | "scheduled"
        | "completed"
        | "cancelled"
        | "no_show",
      client_name: String(item.client_name ?? ""),
      client_phone: item.client_phone ? String(item.client_phone) : null,
      service: service
        ? {
            id: String(service.id ?? ""),
            name: String(service.name ?? ""),
            service_group: service.service_group
              ? String(service.service_group)
              : null,
          }
        : null,
      room: room
        ? {
            id: String(room.id ?? ""),
            name: String(room.name ?? ""),
          }
        : null,
      employee: employee
        ? {
            id: String(employee.id ?? ""),
            display_name: String(employee.display_name ?? ""),
            color_hex: employee.color_hex ? String(employee.color_hex) : null,
          }
        : null,
    };
  });
}

export async function getCalendarDayDataByRooms(
  date: string,
): Promise<CalendarRoomGroup[]> {
  const supabase = await createClient();

  const [{ data: rooms, error: roomsError }, appointments] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    getCalendarAppointments(date),
  ]);

  if (roomsError) {
    console.error(roomsError);
    throw new Error("Nije moguće dohvatiti sobe.");
  }

  return (rooms ?? []).map((room) => ({
    roomId: room.id,
    roomName: room.name,
    appointments: appointments.filter(
      (appointment) => appointment.room?.id === room.id,
    ),
  }));
}

export async function getCalendarDayDataByEmployees(
  date: string,
): Promise<CalendarEmployeeGroup[]> {
  const supabase = await createClient();

  const [{ data: employees, error: employeesError }, appointments] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, display_name, color_hex")
        .eq("is_active", true)
        .order("display_name", { ascending: true }),
      getCalendarAppointments(date),
    ]);

  if (employeesError) {
    console.error(employeesError);
    throw new Error("Nije moguće dohvatiti zaposlenike.");
  }

  const employeeRows = employees ?? [];

  const groups = await Promise.all(
    employeeRows.map(async (employee) => {
      const { data, error } = await supabase.rpc(
        "get_employee_effective_schedule",
        {
          p_employee_id: employee.id,
          p_date: date,
        },
      );

      let workStatus = {
        isWorking: false,
        isOverride: false,
        label: "Ne radi",
      };

      if (!error && data?.[0]) {
        const row = data[0];
        const isWorking = row.is_working === true;
        const source = row.source ?? "default";

        workStatus = {
          isWorking,
          isOverride: source !== "default",
          label: isWorking
            ? row.start_time && row.end_time
              ? `${String(row.start_time).slice(0, 5)} - ${String(row.end_time).slice(0, 5)}`
              : "Radi"
            : source === "vacation"
              ? "Godišnji"
              : source === "sick_leave"
                ? "Bolovanje"
                : source === "day_off"
                  ? "Slobodan dan"
                  : "Ne radi",
        };
      }

      return {
        employeeId: employee.id,
        employeeName: employee.display_name,
        colorHex: employee.color_hex,
        workStatus,
        appointments: appointments.filter(
          (appointment) => appointment.employee?.id === employee.id,
        ),
      };
    }),
  );

  return groups;
}
