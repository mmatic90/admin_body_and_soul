import { createClient } from "@/lib/supabase/server";

export type PublicBookingService = {
  id: string;
  name: string;
  duration_minutes: number;
  service_group: string | null;
};

export async function getOnlineBookableServices(): Promise<
  PublicBookingService[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, service_group")
    .eq("is_active", true)
    .eq("is_online_bookable", true)
    .order("service_group", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti usluge za online rezervacije.");
  }

  return (data ?? []) as PublicBookingService[];
}
