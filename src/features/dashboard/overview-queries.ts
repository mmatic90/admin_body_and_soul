import { createClient } from "@/lib/supabase/server";

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getDashboardOverviewStats() {
  const supabase = await createClient();

  const today = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayValue = formatDateInputValue(today);
  const tomorrowValue = formatDateInputValue(tomorrow);

  const [
    { count: pendingOnlineCount },
    { count: todayAppointmentsCount },
    { count: tomorrowAppointmentsCount },
  ] = await Promise.all([
    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("appointment_date", todayValue)
      .eq("status", "scheduled"),

    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("appointment_date", tomorrowValue)
      .eq("status", "scheduled"),
  ]);

  return {
    pendingOnlineCount: pendingOnlineCount ?? 0,
    todayAppointmentsCount: todayAppointmentsCount ?? 0,
    tomorrowAppointmentsCount: tomorrowAppointmentsCount ?? 0,
  };
}
