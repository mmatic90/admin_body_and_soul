import { createClient } from "@/lib/supabase/server";
import type { AppointmentListItem } from "./types";

export async function getAppointmentsByDate(
  date: string,
): Promise<AppointmentListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      client_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      status,
      client_name,
      client_phone,
      client_email,
      client_note,
      internal_note,
      service:services (
        id,
        name,
        service_group,
        priority_room
      ),
      appointment_services (
        id,
        appointment_id,
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
    console.error("Greška pri dohvaćanju termina:", error);
    throw new Error("Nije moguće dohvatiti termine.");
  }

  return (data ?? []) as unknown as AppointmentListItem[];
}

export type AppointmentFormService = {
  id: string;
  name: string;
  duration_minutes: number;
  service_group: string | null;
  priority_room: string | null;
  is_active?: boolean;
};

export type AppointmentFormEmployee = {
  id: string;
  display_name: string;
  color_hex: string | null;
};

export type AppointmentFormRoom = {
  id: string;
  name: string;
};

export type AppointmentFormServiceRoom = {
  service_id: string;
  room_id: string;
};

export type AppointmentFormEmployeeService = {
  service_id: string;
  employee_id: string;
};

export type AppointmentEditServiceItem = {
  id: string;
  appointment_id: string;
  service_id: string;
  duration_minutes: number;
  sort_order: number;
  service: {
    id: string;
    name: string;
    service_group: string | null;
  } | null;
};

export type AppointmentEditItem = {
  id: string;
  client_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_note: string | null;
  internal_note: string | null;
  service_id: string;
  employee_id: string;
  room_id: string;
  appointment_services?: AppointmentEditServiceItem[];
};

export async function getAppointmentFormData() {
  const supabase = await createClient();

  const [
    { data: services, error: servicesError },
    { data: employees, error: employeesError },
    { data: rooms, error: roomsError },
    { data: serviceRooms, error: serviceRoomsError },
    { data: employeeServices, error: employeeServicesError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select(
        "id, name, duration_minutes, service_group, priority_room, is_active",
      )
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase
      .from("employees")
      .select("id, display_name, color_hex")
      .eq("is_active", true)
      .order("display_name", { ascending: true }),

    supabase
      .from("rooms")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase.from("service_rooms").select("service_id, room_id"),

    supabase.from("employee_services").select("service_id, employee_id"),
  ]);

  if (servicesError) {
    console.error(servicesError);
    throw new Error("Nije moguće dohvatiti usluge.");
  }

  if (employeesError) {
    console.error("Employees error:", {
      message: employeesError.message,
      details: employeesError.details,
      hint: employeesError.hint,
      code: employeesError.code,
    });
    throw new Error(
      employeesError.message || "Nije moguće dohvatiti zaposlenike.",
    );
  }

  if (roomsError) {
    console.error(roomsError);
    throw new Error("Nije moguće dohvatiti sobe.");
  }

  if (serviceRoomsError) {
    console.error(serviceRoomsError);
    throw new Error("Nije moguće dohvatiti povezanost usluga i soba.");
  }

  if (employeeServicesError) {
    console.error(employeeServicesError);
    throw new Error("Nije moguće dohvatiti povezanost usluga i zaposlenika.");
  }

  return {
    services: (services ?? []) as AppointmentFormService[],
    employees: (employees ?? []) as AppointmentFormEmployee[],
    rooms: (rooms ?? []) as AppointmentFormRoom[],
    serviceRooms: (serviceRooms ?? []) as AppointmentFormServiceRoom[],
    employeeServices: (employeeServices ??
      []) as AppointmentFormEmployeeService[],
  };
}

export async function getAppointmentById(
  id: string,
): Promise<AppointmentEditItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      client_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      status,
      client_name,
      client_phone,
      client_email,
      client_note,
      internal_note,
      service_id,
      employee_id,
      room_id,
      appointment_services (
        id,
        appointment_id,
        service_id,
        duration_minutes,
        sort_order,
        service:services (
          id,
          name,
          service_group
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Greška pri dohvaćanju termina po ID-u:", error);
    return null;
  }

  return data as unknown as AppointmentEditItem;
}
