import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSmartAvailability } from "@/features/availability/smart-availability";
import type { AppointmentServiceInput } from "@/features/appointments/types";

type PublicAvailabilityBody = {
  date?: string;
  serviceId?: string;
};

export async function POST(request: Request) {
  let body: PublicAvailabilityBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Neispravan JSON payload." },
      { status: 400 },
    );
  }

  const date = typeof body.date === "string" ? body.date : "";
  const serviceId =
    typeof body.serviceId === "string" ? body.serviceId.trim() : "";

  if (!date || !serviceId) {
    return NextResponse.json(
      { error: "Datum i usluga su obavezni." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes, is_active, is_online_bookable")
    .eq("id", serviceId)
    .eq("is_active", true)
    .eq("is_online_bookable", true)
    .maybeSingle();

  if (serviceError) {
    return NextResponse.json({ error: serviceError.message }, { status: 500 });
  }

  if (!service) {
    return NextResponse.json(
      { error: "Usluga nije dostupna za online rezervacije." },
      { status: 404 },
    );
  }

  const items: AppointmentServiceInput[] = [
    {
      service_id: service.id,
      duration_minutes: service.duration_minutes,
    },
  ];

  try {
    const result = await getSmartAvailability({
      date,
      items,
      intervalMinutes: 30,
      maxSuggestions: 999,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška pri dohvaćanju dostupnosti.",
      },
      { status: 500 },
    );
  }
}
