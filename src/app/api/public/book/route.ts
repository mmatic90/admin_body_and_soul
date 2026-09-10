import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSmartAvailability } from "@/features/availability/smart-availability";
import type { AppointmentServiceInput } from "@/features/appointments/types";

type Slot = {
  start_time: string;
  end_time: string;
  employee_id: string;
  employee_name: string;
  room_id: string;
  room_name: string;
};

export async function POST(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimit = await checkRateLimit({
    ip,
    endpoint: "public-booking",
    limit: 5,
    windowMinutes: 10,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Previše pokušaja rezervacije. Molimo pokušajte ponovno za nekoliko minuta.",
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const serviceId = String(body.serviceId ?? "").trim();
    const date = String(body.date ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const note = String(body.note ?? "").trim() || null;
    const lang = body.lang === "en" ? "en" : "hr";
    const slot = body.slot as Slot | null;

    if (!serviceId || !date || !fullName || (!phone && !email) || !slot) {
      return NextResponse.json(
        { error: "Ime, kontakt podatak, usluga, datum i termin su obavezni." },
        { status: 400 },
      );
    }

    if (
      !slot.employee_id ||
      !slot.room_id ||
      !slot.start_time ||
      !slot.end_time
    ) {
      return NextResponse.json(
        { error: "Odabrani termin nije valjan." },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.replace(/\s+/g, "");
    const hasCroatianPhone =
      normalizedPhone.startsWith("+385") ||
      normalizedPhone.startsWith("00385") ||
      normalizedPhone.startsWith("09");

    if (phone && !hasCroatianPhone && !email) {
      return NextResponse.json(
        {
          error:
            "SMS potvrde šalju se samo na hrvatske brojeve. Ako nemate hrvatski broj, unesite email.",
        },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const [
      { data: service, error: serviceError },
      { data: employeeService, error: employeeServiceError },
      { data: employee, error: employeeError },
    ] = await Promise.all([
      supabase
        .from("services")
        .select("id, duration_minutes, is_active, is_online_bookable")
        .eq("id", serviceId)
        .eq("is_active", true)
        .eq("is_online_bookable", true)
        .maybeSingle(),
      supabase
        .from("employee_services")
        .select("employee_id")
        .eq("service_id", serviceId)
        .eq("employee_id", slot.employee_id)
        .maybeSingle(),
      supabase
        .from("employees")
        .select("id, is_active")
        .eq("id", slot.employee_id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    if (serviceError) {
      return NextResponse.json({ error: serviceError.message }, { status: 500 });
    }
    if (employeeServiceError) {
      return NextResponse.json(
        { error: employeeServiceError.message },
        { status: 500 },
      );
    }
    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    if (!service) {
      return NextResponse.json(
        { error: "Odabrana usluga nije dostupna za online rezervacije." },
        { status: 404 },
      );
    }

    if (!employeeService || !employee) {
      return NextResponse.json(
        { error: "Odabrani terapeut ne može raditi ovu uslugu." },
        { status: 400 },
      );
    }

    // Always recompute availability before accepting the public request. This
    // prevents stale/tampered slots and respects current shifts, breaks, rooms
    // and existing appointments even if the schedule changed after the client
    // initially loaded the list of available times.
    const availabilityItems: AppointmentServiceInput[] = [
      {
        service_id: service.id,
        duration_minutes: service.duration_minutes,
      },
    ];

    const freshAvailability = await getSmartAvailability({
      date,
      items: availabilityItems,
      intervalMinutes: 30,
      maxSuggestions: 999,
      employeeId: slot.employee_id,
    });

    const freshSlot = freshAvailability.suggestions.find(
      (candidate) =>
        candidate.employee_id === slot.employee_id &&
        candidate.start_time.slice(0, 5) === slot.start_time.slice(0, 5) &&
        candidate.end_time.slice(0, 5) === slot.end_time.slice(0, 5) &&
        candidate.room_id === slot.room_id,
    );

    if (!freshSlot) {
      return NextResponse.json(
        {
          error:
            "Odabrani termin više nije dostupan. Molimo osvježi dostupne termine i odaberi drugi sat.",
        },
        { status: 409 },
      );
    }

    const { data: recentDuplicateRequest, error: recentDuplicateError } =
      await supabase
        .from("online_booking_requests")
        .select("id")
        .eq("client_phone", phone)
        .eq("service_id", serviceId)
        .eq("requested_date", date)
        .eq("start_time", freshSlot.start_time)
        .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString())
        .limit(1);

    if (recentDuplicateError) {
      return NextResponse.json(
        { error: recentDuplicateError.message },
        { status: 500 },
      );
    }

    if (recentDuplicateRequest && recentDuplicateRequest.length > 0) {
      return NextResponse.json(
        { error: "Zahtjev je već poslan. Molimo pričekajte." },
        { status: 400 },
      );
    }

    const { data: existingRequest, error: existingRequestError } =
      await supabase
        .from("online_booking_requests")
        .select("id")
        .eq("requested_date", date)
        .eq("start_time", freshSlot.start_time)
        .eq("suggested_employee_id", freshSlot.employee_id)
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
        .eq("start_time", freshSlot.start_time)
        .eq("employee_id", freshSlot.employee_id)
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
        start_time: freshSlot.start_time,
        end_time: freshSlot.end_time,
        duration_minutes: service.duration_minutes,
        suggested_employee_id: freshSlot.employee_id,
        suggested_room_id: freshSlot.room_id,
        final_employee_id: freshSlot.employee_id,
        final_room_id: freshSlot.room_id,
        final_duration_minutes: service.duration_minutes,
        client_full_name: fullName,
        client_phone: phone,
        client_email: email,
        client_note: note,
        language: lang,
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
