import { createClient } from "@/lib/supabase/server";
import { getSmartAvailability } from "@/features/availability/smart-availability";

export type OnlineBookingStatus = "all" | "pending" | "accepted" | "rejected";

export async function getOnlineBookings(
  status: OnlineBookingStatus = "pending",
) {
  const supabase = await createClient();

  let query = supabase
    .from("online_booking_requests")
    .select(
      `
      *,
      services (
        id,
        name,
        duration_minutes
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getPendingOnlineBookings() {
  return getOnlineBookings("pending");
}

export async function getOnlineBookingCounts() {
  const supabase = await createClient();

  const [
    { count: all },
    { count: pending },
    { count: accepted },
    { count: rejected },
  ] = await Promise.all([
    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);

  return {
    all: all ?? 0,
    pending: pending ?? 0,
    accepted: accepted ?? 0,
    rejected: rejected ?? 0,
  };
}

export async function getOnlineBookingRequestById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("online_booking_requests")
    .select(
      `
      *,
      services (
        id,
        name,
        duration_minutes
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOnlineBookingAcceptOptions(serviceId: string) {
  const supabase = await createClient();

  const [
    { data: employeeMappings, error: employeeMappingsError },
    { data: roomMappings, error: roomMappingsError },
  ] = await Promise.all([
    supabase
      .from("employee_services")
      .select(
        `
        employee_id,
        employees (
          id,
          display_name,
          is_active
        )
      `,
      )
      .eq("service_id", serviceId),

    supabase
      .from("service_rooms")
      .select(
        `
        room_id,
        rooms (
          id,
          name,
          is_active
        )
      `,
      )
      .eq("service_id", serviceId),
  ]);

  if (employeeMappingsError) throw new Error(employeeMappingsError.message);
  if (roomMappingsError) throw new Error(roomMappingsError.message);

  const employees =
    employeeMappings
      ?.map((row: any) => row.employees)
      .filter((employee: any) => employee?.is_active) ?? [];

  const rooms =
    roomMappings
      ?.map((row: any) => row.rooms)
      .filter((room: any) => room?.is_active) ?? [];

  return { employees, rooms };
}

export async function getOnlineBookingAutoSuggestion(args: {
  date: string;
  serviceId: string;
  durationMinutes: number;
  requestedStartTime: string;
}) {
  const result = await getSmartAvailability({
    date: args.date,
    items: [
      {
        service_id: args.serviceId,
        duration_minutes: args.durationMinutes,
      },
    ],
    intervalMinutes: 30,
    maxSuggestions: 999,
  });

  const requestedStartTime = args.requestedStartTime.slice(0, 5);

  const exactSuggestion = result.suggestions.find(
    (suggestion) => suggestion.start_time.slice(0, 5) === requestedStartTime,
  );

  return {
    suggestion: exactSuggestion ?? result.suggestions[0] ?? null,
    reason: result.reason,
  };
}
