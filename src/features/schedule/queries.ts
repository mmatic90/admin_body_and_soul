import { createClient } from "@/lib/supabase/server";
import type {
  EmployeeListItem,
  EmployeeSchedulePageData,
  EmployeeUpcomingScheduleItem,
} from "./types";

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function dayLabelHr(date: Date) {
  return new Intl.DateTimeFormat("hr-HR", {
    weekday: "long",
  }).format(date);
}

function overrideStatusLabel(value: string, isWorking: boolean) {
  if (isWorking) return "Radi";

  switch (value) {
    case "day_off":
      return "Ne radi";
    case "vacation":
      return "Ne radi";
    case "sick_leave":
      return "Ne radi";
    default:
      return "Ne radi";
  }
}

function overrideReasonLabel(value: string, isWorking: boolean) {
  if (isWorking) return "Override radno vrijeme";

  switch (value) {
    case "day_off":
      return "Slobodan dan";
    case "vacation":
      return "Godišnji";
    case "sick_leave":
      return "Bolovanje";
    default:
      return "Override";
  }
}

export async function getEmployeesForSchedule(): Promise<EmployeeListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, display_name, color_hex")
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti zaposlenike.");
  }

  return (data ?? []) as EmployeeListItem[];
}

export async function getEmployeeSchedulePageData(
  employeeId: string,
): Promise<EmployeeSchedulePageData | null> {
  const supabase = await createClient();

  const [
    { data: employee, error: employeeError },
    { data: defaultSchedule, error: defaultScheduleError },
    { data: overrides, error: overridesError },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, display_name, color_hex")
      .eq("id", employeeId)
      .single(),

    supabase
      .from("employee_default_schedule")
      .select("id, employee_id, day_of_week, start_time, end_time, is_working")
      .eq("employee_id", employeeId)
      .order("day_of_week", { ascending: true }),

    supabase
      .from("employee_schedule_overrides")
      .select(
        "id, employee_id, override_date, override_type, start_time, end_time, note",
      )
      .eq("employee_id", employeeId)
      .order("override_date", { ascending: true }),
  ]);

  if (employeeError) {
    console.error(employeeError);
    return null;
  }

  if (defaultScheduleError) {
    console.error(defaultScheduleError);
    throw new Error("Nije moguće dohvatiti default raspored.");
  }

  if (overridesError) {
    console.error(overridesError);
    throw new Error("Nije moguće dohvatiti overrideove.");
  }

  const defaultRows = defaultSchedule ?? [];
  const overrideRows = overrides ?? [];

  const upcomingSchedule: EmployeeUpcomingScheduleItem[] = Array.from(
    { length: 5 },
    (_, index) => {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      currentDate.setDate(currentDate.getDate() + index);

      const dateString = formatDateOnly(currentDate);

      const override = overrideRows.find(
        (row) => row.override_date === dateString,
      );

      if (override) {
        const isWorking = override.override_type === "custom_hours";

        return {
          date: formatDateDisplay(currentDate),
          day_label: dayLabelHr(currentDate),
          is_working: isWorking,
          start_time: isWorking ? override.start_time : null,
          end_time: isWorking ? override.end_time : null,
          status_label: overrideStatusLabel(override.override_type, isWorking),
          reason_label: override.note?.trim()
            ? override.note
            : overrideReasonLabel(override.override_type, isWorking),
          is_override: true,
        };
      }

      const dayOfWeek = currentDate.getDay();
      const defaultItem = defaultRows.find(
        (row) => row.day_of_week === dayOfWeek,
      );

      if (!defaultItem || !defaultItem.is_working) {
        return {
          date: formatDateDisplay(currentDate),
          day_label: dayLabelHr(currentDate),
          is_working: false,
          start_time: null,
          end_time: null,
          status_label: "Ne radi",
          reason_label: null,
          is_override: false,
        };
      }

      return {
        date: formatDateDisplay(currentDate),
        day_label: dayLabelHr(currentDate),
        is_working: true,
        start_time: defaultItem.start_time,
        end_time: defaultItem.end_time,
        status_label: "Radi",
        reason_label: null,
        is_override: false,
      };
    },
  );

  return {
    employee: employee as EmployeeListItem,
    defaultSchedule: defaultRows,
    overrides: overrideRows,
    upcomingSchedule,
  };
}
