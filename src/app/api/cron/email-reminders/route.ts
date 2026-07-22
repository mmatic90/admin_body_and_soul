import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAppointmentReminderEmail } from "@/lib/email/booking-email";

type AppointmentRow = {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  appointment_date: string;
  start_time: string;
  status: string;
  email_reminder_24h_sent_at: string | null;
  services?:
    | {
        name: string | null;
      }[]
    | null;
};

function formatDateHr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}.`;
}

function isCroatianPhone(phone: string | null | undefined) {
  const normalized = String(phone ?? "").replace(/\s+/g, "");

  return (
    normalized.startsWith("+385") ||
    normalized.startsWith("00385") ||
    normalized.startsWith("09")
  );
}

function getAppointmentStart(date: string, startTime: string) {
  return new Date(`${date}T${startTime.slice(0, 5)}:00`);
}

function getReminderDueWindow() {
  const now = new Date();

  const windowStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

  return { windowStart, windowEnd };
}

function isReminderDue(appointment: AppointmentRow) {
  const { windowStart, windowEnd } = getReminderDueWindow();
  const appointmentStart = getAppointmentStart(
    appointment.appointment_date,
    appointment.start_time,
  );

  return appointmentStart >= windowStart && appointmentStart <= windowEnd;
}

function getReminderLanguage(appointment: AppointmentRow): "hr" | "en" {
  return isCroatianPhone(appointment.client_phone) ? "hr" : "en";
}

function isAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${expectedSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const today = new Date();
  const inTwoDays = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

  const minDate = today.toISOString().slice(0, 10);
  const maxDate = inTwoDays.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      client_name,
      client_email,
      client_phone,
      appointment_date,
      start_time,
      status,
      email_reminder_24h_sent_at,
      services (
        name
      )
    `,
    )
    .eq("status", "scheduled")
    .not("client_email", "is", null)
    .is("email_reminder_24h_sent_at", null)
    .gte("appointment_date", minDate)
    .lte("appointment_date", maxDate);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dueAppointments = ((data ?? []) as AppointmentRow[]).filter(
    (appointment) => {
      if (!isReminderDue(appointment)) return false;

      // Email reminder primarno šaljemo za strane brojeve ili za klijente bez broja.
      // Hrvatski brojevi već imaju Twilio SMS reminder.
      return !isCroatianPhone(appointment.client_phone);
    },
  );

  const results = [];

  for (const appointment of dueAppointments) {
    try {
      await sendAppointmentReminderEmail({
        to: appointment.client_email!,
        clientName: appointment.client_name,
        date: formatDateHr(appointment.appointment_date),
        time: appointment.start_time.slice(0, 5),
        serviceName: appointment.services?.[0].name ?? null,
        lang: getReminderLanguage(appointment),
      });

      await supabase
        .from("appointments")
        .update({
          email_reminder_24h_sent_at: new Date().toISOString(),
          email_reminder_24h_error: null,
        })
        .eq("id", appointment.id);

      results.push({ id: appointment.id, status: "sent" });
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Unknown error";

      await supabase
        .from("appointments")
        .update({
          email_reminder_24h_error: message,
        })
        .eq("id", appointment.id);

      results.push({
        id: appointment.id,
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: data?.length ?? 0,
    due: dueAppointments.length,
    results,
  });
}
