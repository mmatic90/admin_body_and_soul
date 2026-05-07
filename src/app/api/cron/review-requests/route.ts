import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInstantSms } from "@/lib/twilio/sms";
import { sendGoogleReviewRequestEmail } from "@/lib/email/booking-email";

type AppointmentRow = {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  appointment_date: string;
  end_time: string;
  status: string;
  review_request_sent_at: string | null;
};

function isAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  return Boolean(expectedSecret) && authHeader === `Bearer ${expectedSecret}`;
}

function isCroatianPhone(phone: string | null | undefined) {
  const normalized = String(phone ?? "").replace(/\s+/g, "");

  return (
    normalized.startsWith("+385") ||
    normalized.startsWith("00385") ||
    normalized.startsWith("09")
  );
}

function getAppointmentEnd(date: string, endTime: string) {
  return new Date(`${date}T${endTime.slice(0, 5)}:00`);
}

function shouldSendReviewRequest(appointment: AppointmentRow) {
  const now = new Date();
  const appointmentEnd = getAppointmentEnd(
    appointment.appointment_date,
    appointment.end_time,
  );

  const twoHoursAfterEnd = new Date(
    appointmentEnd.getTime() + 2 * 60 * 60 * 1000,
  );

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return appointmentEnd >= sevenDaysAgo && now >= twoHoursAfterEnd;
}

function buildReviewSms(args: { clientName: string; reviewUrl: string }) {
  return `Body & Soul

Bok ${args.clientName}, hvala na dolasku.

Ako ste zadovoljni tretmanom, jako bi nam značila kratka Google recenzija:
${args.reviewUrl}

Hvala!`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewUrl = "https://g.page/r/CYmLX4RPOCS1EAE/review";

  if (!reviewUrl) {
    return NextResponse.json(
      { error: "Missing GOOGLE_REVIEW_URL" },
      { status: 500 },
    );
  }

  const supabase = createAdminClient();

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      client_name,
      client_email,
      client_phone,
      appointment_date,
      end_time,
      status,
      review_request_sent_at
    `,
    )
    .eq("status", "completed")
    .is("review_request_sent_at", null)
    .gte("appointment_date", sevenDaysAgo.toISOString().slice(0, 10))
    .lte("appointment_date", today.toISOString().slice(0, 10));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dueAppointments = ((data ?? []) as AppointmentRow[]).filter(
    shouldSendReviewRequest,
  );

  const results = [];

  for (const appointment of dueAppointments) {
    try {
      if (isCroatianPhone(appointment.client_phone)) {
        await sendInstantSms({
          to: appointment.client_phone!,
          message: buildReviewSms({
            clientName: appointment.client_name,
            reviewUrl,
          }),
        });
      } else if (appointment.client_email) {
        await sendGoogleReviewRequestEmail({
          to: appointment.client_email,
          clientName: appointment.client_name,
          reviewUrl,
          lang: "en",
        });
      } else {
        throw new Error("Nema telefona ni emaila za slanje review requesta.");
      }

      await supabase
        .from("appointments")
        .update({
          review_request_sent_at: new Date().toISOString(),
          review_request_error: null,
        })
        .eq("id", appointment.id);

      results.push({ id: appointment.id, status: "sent" });
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Unknown error";

      await supabase
        .from("appointments")
        .update({
          review_request_error: message,
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
