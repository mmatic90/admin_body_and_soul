import { createClient } from "@/lib/supabase/server";
import type { ServiceItem } from "./types";

export async function getServicesWithPriceRange(): Promise<ServiceItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select(
      `
        id,
        name,
        name_en,
        description,
        description_en,
        duration_minutes,
        price_cents,
        price_min_cents,
        price_max_cents,
        service_group,
        service_group_en,
        priority_room,
        is_active,
        is_online_bookable
      `,
    )
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    throw new Error("Nije moguće dohvatiti usluge.");
  }

  return (data ?? []) as ServiceItem[];
}
