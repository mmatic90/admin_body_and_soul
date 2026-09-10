"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ScheduleActionState = {
  error: string;
  success: string;
};

function buildSchedulePath(employeeId: string) {
  return `/dashboard/schedule/${employeeId}`;
}

function parseDayNumber(value: FormDataEntryValue | null) {
  const num = Number(value);
  return Number.isInteger(num) ? num : -1;
}

function buildDateRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const dates: string[] = [];

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return dates;
  }

  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function validateWorkingHours(args: {
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}) {
  const { startTime, endTime, breakStartTime = "", breakEndTime = "" } = args;

  if (!startTime || !endTime) {
    return "Početak i kraj rada su obavezni.";
  }

  if (toMinutes(startTime) >= toMinutes(endTime)) {
    return "Početak rada mora biti prije kraja rada.";
  }

  const hasBreakStart = Boolean(breakStartTime);
  const hasBreakEnd = Boolean(breakEndTime);

  if (hasBreakStart !== hasBreakEnd) {
    return "Za pauzu moraš upisati i početak i kraj pauze.";
  }

  if (!hasBreakStart) return "";

  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const breakStart = toMinutes(breakStartTime);
  const breakEnd = toMinutes(breakEndTime);

  if (breakStart >= breakEnd) {
    return "Početak pauze mora biti prije kraja pauze.";
  }

  if (breakStart <= start || breakEnd >= end) {
    return "Pauza mora biti u cijelosti unutar radnog vremena.";
  }

  return "";
}

export async function updateDefaultScheduleAction(
  employeeId: string,
  _prevState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return { error: "Niste prijavljeni.", success: "" };

  const updates = Array.from({ length: 7 }, (_, day) => {
    const isWorking = formData.get(`is_working_${day}`) === "on";
    const startTime = String(formData.get(`start_time_${day}`) ?? "");
    const endTime = String(formData.get(`end_time_${day}`) ?? "");
    const breakStartTime = String(formData.get(`break_start_time_${day}`) ?? "");
    const breakEndTime = String(formData.get(`break_end_time_${day}`) ?? "");

    return {
      employee_id: employeeId,
      day_of_week: day,
      is_working: isWorking,
      start_time: isWorking ? startTime : "00:00",
      end_time: isWorking ? endTime : "00:00",
      break_start_time: isWorking && breakStartTime ? breakStartTime : null,
      break_end_time: isWorking && breakEndTime ? breakEndTime : null,
    };
  });

  for (const item of updates) {
    if (!item.is_working) continue;
    const validationError = validateWorkingHours({
      startTime: item.start_time,
      endTime: item.end_time,
      breakStartTime: item.break_start_time ?? "",
      breakEndTime: item.break_end_time ?? "",
    });
    if (validationError) {
      return { error: `Dan ${item.day_of_week}: ${validationError}`, success: "" };
    }
  }

  const { error } = await supabase
    .from("employee_default_schedule")
    .upsert(updates, { onConflict: "employee_id,day_of_week" });

  if (error) return { error: error.message, success: "" };

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));
  return { error: "", success: "Default raspored je uspješno spremljen." };
}

export async function applyDefaultScheduleRangeAction(
  employeeId: string,
  _prevState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return { error: "Niste prijavljeni.", success: "" };

  const dayFrom = parseDayNumber(formData.get("day_from"));
  const dayTo = parseDayNumber(formData.get("day_to"));
  const isWorking = formData.get("range_is_working") === "on";
  const startTime = String(formData.get("range_start_time") ?? "");
  const endTime = String(formData.get("range_end_time") ?? "");
  const breakStartTime = String(formData.get("range_break_start_time") ?? "");
  const breakEndTime = String(formData.get("range_break_end_time") ?? "");

  if (dayFrom < 0 || dayFrom > 6 || dayTo < 0 || dayTo > 6) {
    return { error: "Odaberi valjani raspon dana.", success: "" };
  }
  if (dayFrom > dayTo) {
    return { error: "Početni dan ne može biti nakon završnog dana.", success: "" };
  }

  if (isWorking) {
    const validationError = validateWorkingHours({ startTime, endTime, breakStartTime, breakEndTime });
    if (validationError) return { error: validationError, success: "" };
  }

  const updates = Array.from({ length: dayTo - dayFrom + 1 }, (_, index) => ({
    employee_id: employeeId,
    day_of_week: dayFrom + index,
    is_working: isWorking,
    start_time: isWorking ? startTime : "00:00",
    end_time: isWorking ? endTime : "00:00",
    break_start_time: isWorking && breakStartTime ? breakStartTime : null,
    break_end_time: isWorking && breakEndTime ? breakEndTime : null,
  }));

  const { error } = await supabase
    .from("employee_default_schedule")
    .upsert(updates, { onConflict: "employee_id,day_of_week" });

  if (error) return { error: error.message, success: "" };

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));
  return { error: "", success: "Raspored za odabrani raspon dana je uspješno spremljen." };
}

export async function createScheduleOverrideAction(
  employeeId: string,
  _prevState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) return { error: "Niste prijavljeni.", success: "" };

  const dateFrom = String(formData.get("date_from") ?? "");
  const dateTo = String(formData.get("date_to") ?? "");
  const overrideType = String(formData.get("override_type") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const breakStartTime = String(formData.get("break_start_time") ?? "");
  const breakEndTime = String(formData.get("break_end_time") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!dateFrom || !dateTo) return { error: "Početni i završni datum su obavezni.", success: "" };
  if (!overrideType) return { error: "Tip overridea je obavezan.", success: "" };

  if (overrideType === "custom_hours") {
    const validationError = validateWorkingHours({ startTime, endTime, breakStartTime, breakEndTime });
    if (validationError) return { error: validationError, success: "" };
  }

  const dates = buildDateRange(dateFrom, dateTo);
  if (dates.length === 0) return { error: "Raspon datuma nije valjan.", success: "" };

  const payload = dates.map((date) =>
    overrideType === "custom_hours"
      ? {
          employee_id: employeeId,
          override_date: date,
          override_type: overrideType,
          start_time: startTime,
          end_time: endTime,
          break_start_time: breakStartTime || null,
          break_end_time: breakEndTime || null,
          note: note || null,
        }
      : {
          employee_id: employeeId,
          override_date: date,
          override_type: overrideType,
          start_time: null,
          end_time: null,
          break_start_time: null,
          break_end_time: null,
          note: note || null,
        },
  );

  const { error } = await supabase
    .from("employee_schedule_overrides")
    .upsert(payload, { onConflict: "employee_id,override_date" });

  if (error) return { error: error.message, success: "" };

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));
  return { error: "", success: "Override raspon je uspješno spremljen." };
}

export async function deleteScheduleOverrideAction(employeeId: string, overrideId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Niste prijavljeni.");

  const { error } = await supabase
    .from("employee_schedule_overrides")
    .delete()
    .eq("id", overrideId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));
}
