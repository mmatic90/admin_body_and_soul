import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OverrideType = "custom_hours" | "day_off" | "vacation" | "sick_leave";

type DefaultScheduleRow = {
  employee_id: string;
  day_of_week: number;
  is_working: boolean;
};

type OverrideRow = {
  employee_id: string;
  override_date: string;
  override_type: OverrideType;
};

type EmployeeRow = {
  id: string;
  display_name: string;
};

function overrideReason(type: OverrideType) {
  switch (type) {
    case "day_off":
      return "slobodan dan";
    case "vacation":
      return "godišnji odmor";
    case "sick_leave":
      return "bolovanje";
    case "custom_hours":
      return "poseban raspored";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Date query param je obavezan." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });
  }

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

  const [
    { data: employees, error: employeesError },
    { data: defaultSchedules, error: defaultSchedulesError },
    { data: overrides, error: overridesError },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, display_name")
      .eq("is_active", true)
      .order("display_name"),
    supabase
      .from("employee_default_schedule")
      .select("employee_id, day_of_week, is_working")
      .eq("day_of_week", dayOfWeek),
    supabase
      .from("employee_schedule_overrides")
      .select("employee_id, override_date, override_type")
      .eq("override_date", date),
  ]);

  if (employeesError || defaultSchedulesError || overridesError) {
    return NextResponse.json(
      {
        error:
          employeesError?.message ||
          defaultSchedulesError?.message ||
          overridesError?.message ||
          "Greška pri dohvaćanju dostupnosti zaposlenika.",
      },
      { status: 500 },
    );
  }

  const employeeRows = (employees ?? []) as EmployeeRow[];
  const defaultRows = (defaultSchedules ?? []) as DefaultScheduleRow[];
  const overrideRows = (overrides ?? []) as OverrideRow[];

  const workingEmployeeIds: string[] = [];
  const employeeAvailability = employeeRows.map((employee) => {
    const override = overrideRows.find(
      (row) => row.employee_id === employee.id,
    );

    if (override) {
      const isWorking = override.override_type === "custom_hours";
      if (isWorking) workingEmployeeIds.push(employee.id);

      return {
        id: employee.id,
        display_name: employee.display_name,
        is_working: isWorking,
        reason: isWorking
          ? "Radi po posebnom rasporedu."
          : `Ne radi: ${overrideReason(override.override_type)}.`,
      };
    }

    const defaultSchedule = defaultRows.find(
      (row) => row.employee_id === employee.id,
    );
    const isWorking = defaultSchedule?.is_working === true;
    if (isWorking) workingEmployeeIds.push(employee.id);

    return {
      id: employee.id,
      display_name: employee.display_name,
      is_working: isWorking,
      reason: isWorking
        ? "Radi prema redovnom rasporedu."
        : defaultSchedule
          ? "Ne radi taj dan prema redovnom rasporedu."
          : "Za taj dan nema postavljen radni raspored.",
    };
  });

  return NextResponse.json({ workingEmployeeIds, employeeAvailability });
}
