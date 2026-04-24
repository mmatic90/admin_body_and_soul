import { createClient } from "@/lib/supabase/server";
import { addMinutesToTimeString } from "@/features/appointments/time-helpers";
import type {
  AppointmentServiceInput,
  AppointmentStatus,
} from "@/features/appointments/types";

type ValidateArgs = {
  appointmentId?: string;
  appointmentDate: string;
  startTime: string;
  employeeId: string;
  roomId: string;
  items: AppointmentServiceInput[];
  status: AppointmentStatus;
};

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export async function validateAppointmentRequest(args: ValidateArgs) {
  const supabase = await createClient();

  const {
    appointmentId,
    appointmentDate,
    startTime,
    employeeId,
    roomId,
    items,
    status,
  } = args;

  if (!appointmentDate) {
    return { ok: false as const, message: "Datum je obavezan." };
  }

  if (!startTime) {
    return { ok: false as const, message: "Vrijeme početka je obavezno." };
  }

  if (!employeeId) {
    return { ok: false as const, message: "Zaposlenik je obavezan." };
  }

  if (!roomId) {
    return { ok: false as const, message: "Soba je obavezna." };
  }

  if (items.length === 0) {
    return { ok: false as const, message: "Potrebna je barem jedna usluga." };
  }

  const totalDuration = items.reduce(
    (sum, item) => sum + item.duration_minutes,
    0,
  );

  if (totalDuration <= 0) {
    return {
      ok: false as const,
      message: "Ukupno trajanje mora biti veće od 0.",
    };
  }

  const endTime = addMinutesToTimeString(startTime, totalDuration);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const [
    { data: salonHours, error: salonError },
    { data: employeeSchedule, error: employeeScheduleError },
    { data: existingAppointments, error: appointmentsError },
    { data: serviceRows, error: servicesError },
    { data: groupLimits, error: groupLimitsError },
  ] = await Promise.all([
    supabase
      .from("salon_working_hours")
      .select("day_of_week, opens_at, closes_at, is_closed"),

    supabase.rpc("get_employee_effective_schedule", {
      p_employee_id: employeeId,
      p_date: appointmentDate,
    }),

    supabase
      .from("appointments")
      .select(
        `
        id,
        employee_id,
        room_id,
        start_time,
        end_time,
        status,
        service:services (
          id,
          service_group
        )
      `,
      )
      .eq("appointment_date", appointmentDate)
      .in("status", ["scheduled", "completed"]),

    supabase
      .from("services")
      .select("id, service_group")
      .in(
        "id",
        items.map((item) => item.service_id),
      ),

    supabase.from("service_group_limits").select("group_name, max_parallel"),
  ]);

  if (salonError) {
    return { ok: false as const, message: salonError.message };
  }

  if (employeeScheduleError) {
    return { ok: false as const, message: employeeScheduleError.message };
  }

  if (appointmentsError) {
    return { ok: false as const, message: appointmentsError.message };
  }

  if (servicesError) {
    return { ok: false as const, message: servicesError.message };
  }

  if (groupLimitsError) {
    return { ok: false as const, message: groupLimitsError.message };
  }

  const dayOfWeek = new Date(`${appointmentDate}T00:00:00`).getDay();
  const salonDay = (salonHours ?? []).find(
    (row) => row.day_of_week === dayOfWeek,
  );

  if (!salonDay || salonDay.is_closed) {
    return {
      ok: false as const,
      message: "Salon je zatvoren na odabrani datum.",
    };
  }

  const salonOpen = timeToMinutes(salonDay.opens_at);
  const salonClose = timeToMinutes(salonDay.closes_at);

  if (startMinutes < salonOpen || endMinutes > salonClose) {
    return {
      ok: false as const,
      message: "Termin mora biti unutar radnog vremena salona.",
    };
  }

  const effectiveRow = employeeSchedule?.[0];

  if (
    !effectiveRow?.is_working ||
    !effectiveRow?.start_time ||
    !effectiveRow?.end_time
  ) {
    return {
      ok: false as const,
      message: "Odabrani zaposlenik ne radi na odabrani datum.",
    };
  }

  const employeeStart = timeToMinutes(effectiveRow.start_time);
  const employeeEnd = timeToMinutes(effectiveRow.end_time);

  if (startMinutes < employeeStart || endMinutes > employeeEnd) {
    return {
      ok: false as const,
      message: "Termin mora biti unutar radnog vremena zaposlenika.",
    };
  }

  const filteredExisting = (existingAppointments ?? []).filter((item) =>
    appointmentId ? item.id !== appointmentId : true,
  );

  const employeeConflict = filteredExisting.some((item) => {
    if (item.employee_id !== employeeId) return false;

    return overlaps(
      startMinutes,
      endMinutes,
      timeToMinutes(item.start_time),
      timeToMinutes(item.end_time),
    );
  });

  if (employeeConflict) {
    return {
      ok: false as const,
      message: "Zaposlenik već ima termin u odabranom vremenu.",
    };
  }

  const roomConflict = filteredExisting.some((item) => {
    if (item.room_id !== roomId) return false;

    return overlaps(
      startMinutes,
      endMinutes,
      timeToMinutes(item.start_time),
      timeToMinutes(item.end_time),
    );
  });

  if (roomConflict) {
    return {
      ok: false as const,
      message: "Soba je već zauzeta u odabranom vremenu.",
    };
  }

  const primaryService = items[0];
  const primaryServiceRow = (serviceRows ?? []).find(
    (row) => row.id === primaryService.service_id,
  );

  const primaryGroup = primaryServiceRow?.service_group ?? null;

  if (primaryGroup) {
    const groupLimit =
      (groupLimits ?? []).find((row) => row.group_name === primaryGroup)
        ?.max_parallel ?? 999;

    const overlappingSameGroup = filteredExisting.filter((item) => {
      const service =
        Array.isArray(item.service) && item.service.length > 0
          ? item.service[0]
          : !Array.isArray(item.service)
            ? item.service
            : null;

      return (
        service?.service_group === primaryGroup &&
        overlaps(
          startMinutes,
          endMinutes,
          timeToMinutes(item.start_time),
          timeToMinutes(item.end_time),
        )
      );
    }).length;

    if (overlappingSameGroup >= groupLimit) {
      return {
        ok: false as const,
        message: `Dosegnut je maksimalan broj paralelnih termina za grupu "${primaryGroup}".`,
      };
    }
  }

  if (!["scheduled", "completed", "cancelled", "no_show"].includes(status)) {
    return {
      ok: false as const,
      message: "Status termina nije valjan.",
    };
  }

  return {
    ok: true as const,
    totalDuration,
    primaryServiceId: primaryService.service_id,
    endTime,
  };
}
