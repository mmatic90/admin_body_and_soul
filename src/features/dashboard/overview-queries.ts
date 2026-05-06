import { createClient } from "@/lib/supabase/server";

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthStartValue(date: Date) {
  return formatDateInputValue(new Date(date.getFullYear(), date.getMonth(), 1));
}

function safeRate(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export async function getDashboardOverviewStats() {
  const supabase = await createClient();

  const today = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayValue = formatDateInputValue(today);
  const tomorrowValue = formatDateInputValue(tomorrow);
  const monthStartValue = getMonthStartValue(today);

  const [
    { count: pendingOnlineCount },
    { count: todayOnlineCount },
    { count: todayAppointmentsCount },
    { count: tomorrowAppointmentsCount },
    { count: completedThisMonthCount },
    { count: noShowThisMonthCount },
    { count: onlineThisMonthCount },
    { count: onlineAcceptedThisMonthCount },
  ] = await Promise.all([
    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("status", "pending"),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("requested_date", todayValue),

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

    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("appointment_date", monthStartValue)
      .eq("status", "completed"),

    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("appointment_date", monthStartValue)
      .eq("status", "no_show"),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${monthStartValue}T00:00:00`),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${monthStartValue}T00:00:00`)
      .eq("status", "accepted"),
  ]);

  const onlineThisMonth = onlineThisMonthCount ?? 0;
  const onlineAcceptedThisMonth = onlineAcceptedThisMonthCount ?? 0;

  return {
    pendingOnlineCount: pendingOnlineCount ?? 0,
    todayOnlineCount: todayOnlineCount ?? 0,
    todayAppointmentsCount: todayAppointmentsCount ?? 0,
    tomorrowAppointmentsCount: tomorrowAppointmentsCount ?? 0,
    completedThisMonthCount: completedThisMonthCount ?? 0,
    noShowThisMonthCount: noShowThisMonthCount ?? 0,
    onlineThisMonthCount: onlineThisMonth,
    onlineAcceptedThisMonthCount: onlineAcceptedThisMonth,
    onlineConversionRate: safeRate(onlineAcceptedThisMonth, onlineThisMonth),
  };
}
