import { createClient } from "@/lib/supabase/server";

export type PublicBookingService = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  duration_minutes: number;
  price_cents: number | null;
  service_group: string | null;
  service_group_en: string | null;
};

export async function getOnlineBookableServices(): Promise<
  PublicBookingService[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, name_en, description, duration_minutes, price_cents, service_group, service_group_en",
    )
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
