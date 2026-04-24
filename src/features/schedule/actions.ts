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

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return dates;
  }

  if (start > end) {
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

export async function updateDefaultScheduleAction(
  employeeId: string,
  _prevState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Niste prijavljeni.", success: "" };
  }

  const updates = Array.from({ length: 7 }, (_, day) => {
    const isWorking = formData.get(`is_working_${day}`) === "on";
    const startTime = String(formData.get(`start_time_${day}`) ?? "");
    const endTime = String(formData.get(`end_time_${day}`) ?? "");

    return {
      employee_id: employeeId,
      day_of_week: day,
      is_working: isWorking,
      start_time: isWorking ? startTime : "00:00",
      end_time: isWorking ? endTime : "00:00",
    };
  });

  for (const item of updates) {
    if (item.is_working && (!item.start_time || !item.end_time)) {
      return {
        error: `Za dan ${item.day_of_week} moraš upisati početak i kraj rada.`,
        success: "",
      };
    }
  }

  const { error } = await supabase
    .from("employee_default_schedule")
    .upsert(updates, { onConflict: "employee_id,day_of_week" });

  if (error) {
    return { error: error.message, success: "" };
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));

  return {
    error: "",
    success: "Default raspored je uspješno spremljen.",
  };
}

export async function applyDefaultScheduleRangeAction(
  employeeId: string,
  _prevState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Niste prijavljeni.", success: "" };
  }

  const dayFrom = parseDayNumber(formData.get("day_from"));
  const dayTo = parseDayNumber(formData.get("day_to"));
  const isWorking = formData.get("range_is_working") === "on";
  const startTime = String(formData.get("range_start_time") ?? "");
  const endTime = String(formData.get("range_end_time") ?? "");

  if (dayFrom < 0 || dayFrom > 6 || dayTo < 0 || dayTo > 6) {
    return { error: "Odaberi valjani raspon dana.", success: "" };
  }

  if (dayFrom > dayTo) {
    return {
      error: "Početni dan ne može biti nakon završnog dana.",
      success: "",
    };
  }

  if (isWorking && (!startTime || !endTime)) {
    return {
      error: "Za radne dane moraš upisati početak i kraj rada.",
      success: "",
    };
  }

  const updates = Array.from({ length: dayTo - dayFrom + 1 }, (_, index) => {
    const day = dayFrom + index;
    return {
      employee_id: employeeId,
      day_of_week: day,
      is_working: isWorking,
      start_time: isWorking ? startTime : "00:00",
      end_time: isWorking ? endTime : "00:00",
    };
  });

  const { error } = await supabase
    .from("employee_default_schedule")
    .upsert(updates, { onConflict: "employee_id,day_of_week" });

  if (error) {
    return { error: error.message, success: "" };
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));

  return {
    error: "",
    success: "Raspored za odabrani raspon dana je uspješno spremljen.",
  };
}

export async function createScheduleOverrideAction(
  employeeId: string,
  _prevState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Niste prijavljeni.", success: "" };
  }

  const dateFrom = String(formData.get("date_from") ?? "");
  const dateTo = String(formData.get("date_to") ?? "");
  const overrideType = String(formData.get("override_type") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!dateFrom || !dateTo) {
    return { error: "Početni i završni datum su obavezni.", success: "" };
  }

  if (!overrideType) {
    return { error: "Tip overridea je obavezan.", success: "" };
  }

  if (overrideType === "custom_hours" && (!startTime || !endTime)) {
    return {
      error: "Za custom hours moraš upisati početak i kraj rada.",
      success: "",
    };
  }

  const dates = buildDateRange(dateFrom, dateTo);

  if (dates.length === 0) {
    return { error: "Raspon datuma nije valjan.", success: "" };
  }

  const payload = dates.map((date) =>
    overrideType === "custom_hours"
      ? {
          employee_id: employeeId,
          override_date: date,
          override_type: overrideType,
          start_time: startTime,
          end_time: endTime,
          note: note || null,
        }
      : {
          employee_id: employeeId,
          override_date: date,
          override_type: overrideType,
          start_time: null,
          end_time: null,
          note: note || null,
        },
  );

  const { error } = await supabase
    .from("employee_schedule_overrides")
    .upsert(payload, { onConflict: "employee_id,override_date" });

  if (error) {
    return { error: error.message, success: "" };
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));

  return {
    error: "",
    success: "Override raspon je uspješno spremljen.",
  };
}

export async function deleteScheduleOverrideAction(
  employeeId: string,
  overrideId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Niste prijavljeni.");
  }

  const { error } = await supabase
    .from("employee_schedule_overrides")
    .delete()
    .eq("id", overrideId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/schedule");
  revalidatePath(buildSchedulePath(employeeId));
}
