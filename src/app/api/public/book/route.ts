import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Slot = {
  start_time: string;
  end_time: string;
  employee_id: string;
  employee_name: string;
  room_id: string;
  room_name: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const serviceId = String(body.serviceId ?? "").trim();
    const date = String(body.date ?? "").trim();

    const fullName = String(body.fullName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const note = String(body.note ?? "").trim() || null;

    const slot = body.slot as Slot | null;

    if (!serviceId || !date || !fullName || !phone || !slot) {
      return NextResponse.json(
        { error: "Ime, broj telefona, usluga, datum i termin su obavezni." },
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
      return NextResponse.json(
        { error: serviceError.message },
        { status: 500 },
      );
    }

    if (!service) {
      return NextResponse.json(
        { error: "Odabrana usluga nije dostupna za online rezervacije." },
        { status: 404 },
      );
    }

    const { data: existingRequest, error: existingRequestError } =
      await supabase
        .from("online_booking_requests")
        .select("id")
        .eq("requested_date", date)
        .eq("start_time", slot.start_time)
        .eq("suggested_employee_id", slot.employee_id)
        .eq("status", "pending")
        .maybeSingle();

    if (existingRequestError) {
      return NextResponse.json(
        { error: existingRequestError.message },
        { status: 500 },
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          error:
            "Za ovaj termin već postoji zahtjev za rezervaciju. Molimo odaberi drugi termin.",
        },
        { status: 409 },
      );
    }

    const { data: existingAppointment, error: existingAppointmentError } =
      await supabase
        .from("appointments")
        .select("id")
        .eq("appointment_date", date)
        .eq("start_time", slot.start_time)
        .eq("employee_id", slot.employee_id)
        .in("status", ["scheduled", "completed"])
        .maybeSingle();

    if (existingAppointmentError) {
      return NextResponse.json(
        { error: existingAppointmentError.message },
        { status: 500 },
      );
    }

    if (existingAppointment) {
      return NextResponse.json(
        {
          error:
            "Termin je u međuvremenu rezerviran. Molimo odaberi drugi termin.",
        },
        { status: 409 },
      );
    }

    const { data: requestRow, error: requestError } = await supabase
      .from("online_booking_requests")
      .insert({
        service_id: serviceId,
        requested_date: date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration_minutes: service.duration_minutes,

        suggested_employee_id: slot.employee_id,
        suggested_room_id: slot.room_id,

        final_employee_id: slot.employee_id,
        final_room_id: slot.room_id,
        final_duration_minutes: service.duration_minutes,

        client_full_name: fullName,
        client_phone: phone,
        client_email: email,
        client_note: note,

        status: "pending",
      })
      .select("id")
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json(
        {
          error:
            requestError?.message ||
            "Greška pri spremanju zahtjeva za rezervaciju.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      requestId: requestRow.id,
      message:
        "Zahtjev za rezervaciju je poslan. Salon će provjeriti termin i poslati potvrdu.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
