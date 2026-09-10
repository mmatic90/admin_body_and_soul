import { createClient } from "@/lib/supabase/server";
import { calculateTotalDuration } from "@/features/appointments/calculate-total-duration";
import type { AppointmentServiceInput } from "@/features/appointments/types";

type AppointmentRow = {
  id: string;
  employee_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  service?: { id: string; service_group: string | null } | { id: string; service_group: string | null }[] | null;
};

type EmployeeRow = { id: string; display_name: string; color_hex: string | null };
type RoomRow = { id: string; name: string };

type EffectiveScheduleRow = {
  employee_id: string;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
};

type Suggestion = {
  start_time: string;
  end_time: string;
  employee_id: string;
  employee_name: string;
  room_id: string;
  room_name: string;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function uniqueByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function getSingleService(
  service: { id: string; service_group: string | null } | { id: string; service_group: string | null }[] | null | undefined,
) {
  return Array.isArray(service) ? (service[0] ?? null) : (service ?? null);
}

export async function getSmartAvailability(options: {
  date: string;
  items: AppointmentServiceInput[];
  intervalMinutes?: number;
  maxSuggestions?: number;
  excludeAppointmentId?: string;
  employeeId?: string;
}) {
  const {
    date,
    items,
    intervalMinutes = 15,
    maxSuggestions = 3,
    excludeAppointmentId,
    employeeId,
  } = options;

  if (!date) return { suggestions: [] as Suggestion[], reason: "Datum je obavezan." };
  if (!items.length) return { suggestions: [] as Suggestion[], reason: "Potrebna je barem jedna usluga." };

  const totalDuration = calculateTotalDuration(items);
  if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
    return { suggestions: [] as Suggestion[], reason: "Ukupno trajanje mora biti veće od 0." };
  }

  const supabase = await createClient();
  const serviceIds = items.map((item) => item.service_id);
  const primaryServiceId = items[0]?.service_id;
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

  const [
    { data: services, error: servicesError },
    { data: salonHours, error: salonHoursError },
    { data: employeeMappings, error: employeeMappingsError },
    { data: roomMappings, error: roomMappingsError },
    { data: employees, error: employeesError },
    { data: rooms, error: roomsError },
    { data: appointments, error: appointmentsError },
    { data: groupLimits, error: groupLimitsError },
    { data: defaultSchedules, error: defaultSchedulesError },
    { data: scheduleOverrides, error: scheduleOverridesError },
  ] = await Promise.all([
    supabase.from("services").select("id, name, service_group, priority_room").in("id", serviceIds),
    supabase.from("salon_working_hours").select("day_of_week, opens_at, closes_at, is_closed"),
    supabase.from("employee_services").select("employee_id, service_id").in("service_id", serviceIds),
    supabase.from("service_rooms").select("service_id, room_id").in("service_id", serviceIds),
    supabase.from("employees").select("id, display_name, color_hex").eq("is_active", true),
    supabase.from("rooms").select("id, name").eq("is_active", true),
    supabase
      .from("appointments")
      .select(`id, employee_id, room_id, start_time, end_time, status, service:services (id, service_group)`)
      .eq("appointment_date", date)
      .in("status", ["scheduled", "completed"]),
    supabase.from("service_group_limits").select("group_name, max_parallel"),
    supabase
      .from("employee_default_schedule")
      .select("employee_id, day_of_week, break_start_time, break_end_time")
      .eq("day_of_week", dayOfWeek),
    supabase
      .from("employee_schedule_overrides")
      .select("employee_id, override_type, break_start_time, break_end_time")
      .eq("override_date", date),
  ]);

  if (servicesError) throw new Error(servicesError.message);
  if (salonHoursError) throw new Error(salonHoursError.message);
  if (employeeMappingsError) throw new Error(employeeMappingsError.message);
  if (roomMappingsError) throw new Error(roomMappingsError.message);
  if (employeesError) throw new Error(employeesError.message);
  if (roomsError) throw new Error(roomsError.message);
  if (appointmentsError) throw new Error(appointmentsError.message);
  if (groupLimitsError) throw new Error(groupLimitsError.message);
  if (defaultSchedulesError) throw new Error(defaultSchedulesError.message);
  if (scheduleOverridesError) throw new Error(scheduleOverridesError.message);

  const typedServices = services ?? [];
  if (typedServices.length !== serviceIds.length) {
    return { suggestions: [] as Suggestion[], reason: "Jedna ili više odabranih usluga nisu pronađene." };
  }

  const primaryService = typedServices.find((service) => service.id === primaryServiceId) ?? null;
  const salonDay = (salonHours ?? []).find((row) => row.day_of_week === dayOfWeek);
  if (!salonDay || salonDay.is_closed) {
    return { suggestions: [] as Suggestion[], reason: "Salon je zatvoren na odabrani datum." };
  }

  const salonOpen = timeToMinutes(salonDay.opens_at);
  const salonClose = timeToMinutes(salonDay.closes_at);

  const serviceToEmployeeIds = new Map<string, Set<string>>();
  for (const row of employeeMappings ?? []) {
    if (!serviceToEmployeeIds.has(row.service_id)) serviceToEmployeeIds.set(row.service_id, new Set<string>());
    serviceToEmployeeIds.get(row.service_id)!.add(row.employee_id);
  }

  let allowedEmployeeIds: Set<string> | null = null;
  for (const serviceId of serviceIds) {
    const current = serviceToEmployeeIds.get(serviceId) ?? new Set<string>();
    allowedEmployeeIds = allowedEmployeeIds === null
      ? new Set<string>(current)
      : new Set<string>(Array.from(allowedEmployeeIds).filter((id) => current.has(id)));
  }

  const serviceToRoomIds = new Map<string, Set<string>>();
  for (const row of roomMappings ?? []) {
    if (!serviceToRoomIds.has(row.service_id)) serviceToRoomIds.set(row.service_id, new Set<string>());
    serviceToRoomIds.get(row.service_id)!.add(row.room_id);
  }

  let allowedRoomIds: Set<string> | null = null;
  for (const serviceId of serviceIds) {
    const current = serviceToRoomIds.get(serviceId) ?? new Set<string>();
    allowedRoomIds = allowedRoomIds === null
      ? new Set<string>(current)
      : new Set<string>(Array.from(allowedRoomIds).filter((id) => current.has(id)));
  }

  let allowedEmployees = ((employees ?? []) as EmployeeRow[]).filter(
    (employee) => allowedEmployeeIds?.has(employee.id) && (!employeeId || employee.id === employeeId),
  );
  let allowedRooms = ((rooms ?? []) as RoomRow[]).filter((room) => allowedRoomIds?.has(room.id));

  if (allowedEmployees.length === 0) {
    return { suggestions: [] as Suggestion[], reason: employeeId ? "Odabrani zaposlenik ne može raditi ovu uslugu." : "Nema zaposlenika koji mogu raditi sve odabrane usluge." };
  }
  if (allowedRooms.length === 0) {
    return { suggestions: [] as Suggestion[], reason: "Nema soba koje podržavaju sve odabrane usluge." };
  }

  if (primaryService?.priority_room) {
    const priorityRoomName = primaryService.priority_room.trim();
    const priorityRoom = allowedRooms.find((room) => room.name === priorityRoomName);
    if (priorityRoom) {
      allowedRooms = [priorityRoom, ...allowedRooms.filter((room) => room.id !== priorityRoom.id)];
    }
  }

  const effectiveSchedules = await Promise.all(
    allowedEmployees.map(async (employee) => {
      const { data, error } = await supabase.rpc("get_employee_effective_schedule", {
        p_employee_id: employee.id,
        p_date: date,
      });

      if (error) {
        return {
          employee_id: employee.id,
          is_working: false,
          start_time: null,
          end_time: null,
          break_start_time: null,
          break_end_time: null,
        } satisfies EffectiveScheduleRow;
      }

      const row = data?.[0];
      const override = (scheduleOverrides ?? []).find((item) => item.employee_id === employee.id);
      const defaultSchedule = (defaultSchedules ?? []).find((item) => item.employee_id === employee.id);
      const useOverrideBreak = override?.override_type === "custom_hours";

      return {
        employee_id: employee.id,
        is_working: row?.is_working ?? false,
        start_time: row?.start_time ?? null,
        end_time: row?.end_time ?? null,
        break_start_time: useOverrideBreak ? (override?.break_start_time ?? null) : (defaultSchedule?.break_start_time ?? null),
        break_end_time: useOverrideBreak ? (override?.break_end_time ?? null) : (defaultSchedule?.break_end_time ?? null),
      } satisfies EffectiveScheduleRow;
    }),
  );

  const workingEmployees = allowedEmployees.filter((employee) => {
    const schedule = effectiveSchedules.find((row) => row.employee_id === employee.id);
    return schedule?.is_working && schedule.start_time && schedule.end_time;
  });

  if (workingEmployees.length === 0) {
    return { suggestions: [] as Suggestion[], reason: "Nijedan dopušteni zaposlenik ne radi na odabrani datum." };
  }

  const typedAppointments = ((appointments ?? []) as AppointmentRow[]).filter((appointment) =>
    excludeAppointmentId ? appointment.id !== excludeAppointmentId : true,
  );

  const primaryGroup = primaryService?.service_group ?? null;
  const groupLimit = primaryGroup
    ? ((groupLimits ?? []).find((row) => row.group_name === primaryGroup)?.max_parallel ?? 999)
    : 999;

  const suggestions: Suggestion[] = [];

  for (let start = salonOpen; start + totalDuration <= salonClose; start += intervalMinutes) {
    const end = start + totalDuration;

    if (primaryGroup) {
      const overlappingSameGroup = typedAppointments.filter((appointment) => {
        const service = getSingleService(appointment.service);
        return service?.service_group === primaryGroup && overlaps(start, end, timeToMinutes(appointment.start_time), timeToMinutes(appointment.end_time));
      }).length;
      if (overlappingSameGroup >= groupLimit) continue;
    }

    for (const employee of workingEmployees) {
      const schedule = effectiveSchedules.find((row) => row.employee_id === employee.id);
      if (!schedule?.start_time || !schedule?.end_time) continue;

      const employeeStart = timeToMinutes(schedule.start_time);
      const employeeEnd = timeToMinutes(schedule.end_time);
      if (start < employeeStart || end > employeeEnd) continue;

      if (schedule.break_start_time && schedule.break_end_time) {
        const breakStart = timeToMinutes(schedule.break_start_time);
        const breakEnd = timeToMinutes(schedule.break_end_time);
        if (overlaps(start, end, breakStart, breakEnd)) continue;
      }

      const employeeConflict = typedAppointments.some((appointment) =>
        appointment.employee_id === employee.id &&
        overlaps(start, end, timeToMinutes(appointment.start_time), timeToMinutes(appointment.end_time)),
      );
      if (employeeConflict) continue;

      const firstAvailableRoom = allowedRooms.find((room) => {
        const roomConflict = typedAppointments.some((appointment) =>
          appointment.room_id === room.id &&
          overlaps(start, end, timeToMinutes(appointment.start_time), timeToMinutes(appointment.end_time)),
        );
        return !roomConflict;
      });
      if (!firstAvailableRoom) continue;

      suggestions.push({
        start_time: minutesToTime(start),
        end_time: minutesToTime(end),
        employee_id: employee.id,
        employee_name: employee.display_name,
        room_id: firstAvailableRoom.id,
        room_name: firstAvailableRoom.name,
      });

      if (suggestions.length >= maxSuggestions) {
        return {
          suggestions: uniqueByKey(suggestions, (item) => `${item.start_time}-${item.employee_id}-${item.room_id}`).slice(0, maxSuggestions),
          reason: "",
        };
      }
    }
  }

  const uniqueSuggestions = uniqueByKey(
    suggestions,
    (item) => `${item.start_time}-${item.employee_id}-${item.room_id}`,
  ).slice(0, maxSuggestions);

  return {
    suggestions: uniqueSuggestions,
    reason: uniqueSuggestions.length === 0 ? "Nema slobodnih termina koji zadovoljavaju odabrana pravila." : "",
  };
}
