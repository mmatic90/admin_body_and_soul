import { createClient } from "@/lib/supabase/server";

export async function getPendingOnlineBookings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("online_booking_requests")
    .select(
      `
      *,
      services (
        name
      )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
