import { createClient } from "@/lib/supabase/server";
import { getSmartAvailability } from "@/features/availability/smart-availability";

export type OnlineBookingStatus =
  | "today"
  | "all"
  | "archive"
  | "pending"
  | "accepted"
  | "rejected";

const onlineBookingSelect = `
  *,
  services (
    id,
    name,
    duration_minutes
  ),
  suggested_employee:employees!online_booking_requests_suggested_employee_id_fkey (
    id,
    display_name
  ),
  suggested_room:rooms!online_booking_requests_suggested_room_id_fkey (
    id,
    name
  ),
  final_employee:employees!online_booking_requests_final_employee_id_fkey (
    id,
    display_name
  ),
  final_room:rooms!online_booking_requests_final_room_id_fkey (
    id,
    name
  )
`;

function getTodayValue() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getOnlineBookings(status: OnlineBookingStatus = "today") {
  const supabase = await createClient();

  let query = supabase
    .from("online_booking_requests")
    .select(onlineBookingSelect)
    .order("created_at", { ascending: false });

  if (status === "archive") {
    query = query.not("archived_at", "is", null);
  } else {
    query = query.is("archived_at", null);

    if (status === "today") {
      query = query.eq("requested_date", getTodayValue());
    } else if (status !== "all") {
      query = query.eq("status", status);
    }
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
  const todayValue = getTodayValue();

  const [
    { count: today },
    { count: all },
    { count: pending },
    { count: accepted },
    { count: rejected },
    { count: archive },
  ] = await Promise.all([
    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("requested_date", todayValue),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("status", "pending"),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("status", "accepted"),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("status", "rejected"),

    supabase
      .from("online_booking_requests")
      .select("id", { count: "exact", head: true })
      .not("archived_at", "is", null),
  ]);

  return {
    today: today ?? 0,
    all: all ?? 0,
    pending: pending ?? 0,
    accepted: accepted ?? 0,
    rejected: rejected ?? 0,
    archive: archive ?? 0,
  };
}

export async function getOnlineBookingRequestById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("online_booking_requests")
    .select(onlineBookingSelect)
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
