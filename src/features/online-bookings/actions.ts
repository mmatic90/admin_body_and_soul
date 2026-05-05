"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendInstantSms } from "@/lib/twilio/sms";
import {
  sendBookingAcceptedEmail,
  sendBookingRejectedEmail,
} from "@/lib/email/booking-email";

type NotificationLang = "hr" | "en";

const SALON_PHONE = "+385 99 328 4199";

function formatDateHr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}.`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addMinutesToTimeString(time: string, minutesToAdd: number) {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function getServiceName(service: { name?: string | null } | null | undefined) {
  return service?.name?.trim() || "Odabrana usluga";
}

function isCroatianPhone(phone: string | null | undefined) {
  const normalized = String(phone ?? "").replace(/\s+/g, "");

  return (
    normalized.startsWith("+385") ||
    normalized.startsWith("00385") ||
    normalized.startsWith("09")
  );
}

function buildAcceptedSms(args: {
  serviceName: string;
  date: string;
  startTime: string;
  lang: NotificationLang;
}) {
  if (args.lang === "en") {
    return `Body & Soul

Your appointment has been confirmed.

Service: ${args.serviceName}
Date: ${formatDateHr(args.date)}
Time: ${args.startTime}

If you cannot attend, please contact the salon at ${SALON_PHONE}.

See you soon!`;
  }

  return `Body & Soul

Vaš termin je potvrđen.

Usluga: ${args.serviceName}
Datum: ${formatDateHr(args.date)}
Vrijeme: ${args.startTime}

Ako ne možete doći, molimo javite salonu na ${SALON_PHONE}.

Vidimo se!`;
}

function buildRejectedSms(args: {
  serviceName: string;
  date: string;
  startTime: string;
  reason: string;
  lang: NotificationLang;
}) {
  if (args.lang === "en") {
    return `Body & Soul

Your booking request could not be confirmed.

Service: ${args.serviceName}
Date: ${formatDateHr(args.date)}
Time: ${args.startTime}

Reason: ${args.reason}

Please contact the salon at ${SALON_PHONE} to arrange another appointment.`;
  }

  return `Body & Soul

Vaš zahtjev za termin nije moguće potvrditi.

Usluga: ${args.serviceName}
Datum: ${formatDateHr(args.date)}
Vrijeme: ${args.startTime}

Razlog: ${args.reason}

Za dogovor novog termina kontaktirajte salon na ${SALON_PHONE}.`;
}

async function getCurrentUserId() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Niste prijavljeni.");
  }

  return user.id;
}

export async function acceptOnlineBookingRequestAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const requestId = String(formData.get("request_id") ?? "").trim();
  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const roomId = String(formData.get("room_id") ?? "").trim();
  const durationMinutes = Number(formData.get("duration_minutes") ?? 0);

  if (!requestId || !employeeId || !roomId || !durationMinutes) {
    throw new Error("Nedostaju podaci za prihvaćanje rezervacije.");
  }

  const { data: request, error: requestError } = await supabase
    .from("online_booking_requests")
    .select(
      `
      *,
      services (
        id,
        name
      )
    `,
    )
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    throw new Error(requestError.message);
  }

  if (!request) {
    throw new Error("Zahtjev nije pronađen.");
  }

  if (request.status !== "pending") {
    throw new Error("Ovaj zahtjev više nije na čekanju.");
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Trajanje mora biti veće od 0.");
  }

  const startTime = String(request.start_time).slice(0, 5);
  const endTime = addMinutesToTimeString(startTime, durationMinutes);

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const { data: existingAppointments, error: existingError } = await supabase
    .from("appointments")
    .select("id, employee_id, room_id, start_time, end_time")
    .eq("appointment_date", request.requested_date)
    .in("status", ["scheduled", "completed"]);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const conflict = (existingAppointments ?? []).some((appointment: any) => {
    const appointmentStart = timeToMinutes(appointment.start_time);
    const appointmentEnd = timeToMinutes(appointment.end_time);

    const sameEmployee = appointment.employee_id === employeeId;
    const sameRoom = appointment.room_id === roomId;

    return (
      (sameEmployee || sameRoom) &&
      overlaps(startMinutes, endMinutes, appointmentStart, appointmentEnd)
    );
  });

  if (conflict) {
    throw new Error(
      "Odabrani djelatnik ili soba već imaju termin u tom vremenu.",
    );
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      full_name: request.client_full_name,
      phone: request.client_phone,
      email: request.client_email,
      note: request.client_note,
      internal_note: "Klijent kreiran iz online zahtjeva za rezervaciju.",
      is_active: true,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    throw new Error(clientError?.message || "Greška pri kreiranju klijenta.");
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      client_id: client.id,
      client_name: request.client_full_name,
      client_phone: request.client_phone,
      client_email: request.client_email,
      client_note: request.client_note,
      internal_note: "Termin potvrđen iz online zahtjeva.",
      service_id: request.service_id,
      employee_id: employeeId,
      room_id: roomId,
      appointment_date: request.requested_date,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    await supabase.from("clients").delete().eq("id", client.id);
    throw new Error(
      appointmentError?.message || "Greška pri kreiranju termina.",
    );
  }

  const { error: appointmentServicesError } = await supabase
    .from("appointment_services")
    .insert({
      appointment_id: appointment.id,
      service_id: request.service_id,
      duration_minutes: durationMinutes,
      sort_order: 1,
    });

  if (appointmentServicesError) {
    await supabase.from("appointments").delete().eq("id", appointment.id);
    await supabase.from("clients").delete().eq("id", client.id);
    throw new Error(appointmentServicesError.message);
  }

  const { error: updateRequestError } = await supabase
    .from("online_booking_requests")
    .update({
      status: "accepted",
      final_employee_id: employeeId,
      final_room_id: roomId,
      final_duration_minutes: durationMinutes,
      appointment_id: appointment.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", requestId);

  if (updateRequestError) {
    throw new Error(updateRequestError.message);
  }

  const notificationLang: NotificationLang =
    request.language === "en" ? "en" : "hr";

  const serviceName = getServiceName(request.services);

  if (isCroatianPhone(request.client_phone)) {
    try {
      await sendInstantSms({
        to: request.client_phone,
        message: buildAcceptedSms({
          serviceName,
          date: request.requested_date,
          startTime,
          lang: notificationLang,
        }),
      });
    } catch (error) {
      console.error("Greška pri slanju SMS potvrde:", error);

      if (request.client_email) {
        try {
          await sendBookingAcceptedEmail({
            to: request.client_email,
            serviceName,
            date: formatDateHr(request.requested_date),
            time: startTime,
            lang: "hr",
          });
        } catch (emailError) {
          console.error("Greška pri slanju email potvrde:", emailError);
        }
      }
    }
  } else if (request.client_email) {
    try {
      await sendBookingAcceptedEmail({
        to: request.client_email,
        serviceName,
        date: formatDateHr(request.requested_date),
        time: startTime,
        lang: notificationLang,
      });
    } catch (error) {
      console.error("Greška pri slanju email potvrde:", error);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/online-bookings");
  revalidatePath(`/dashboard/online-bookings/${requestId}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/calendar/time-grid");

  redirect("/dashboard/online-bookings");
}

export async function rejectOnlineBookingRequestAction(formData: FormData) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const requestId = String(formData.get("request_id") ?? "").trim();
  const rejectionReason = String(formData.get("rejection_reason") ?? "").trim();

  if (!requestId || !rejectionReason) {
    throw new Error("Odaberi razlog odbijanja.");
  }

  const { data: request, error: requestError } = await supabase
    .from("online_booking_requests")
    .select(
      `
      *,
      services (
        name
      )
    `,
    )
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    throw new Error(requestError.message);
  }

  if (!request) {
    throw new Error("Zahtjev nije pronađen.");
  }

  if (request.status !== "pending") {
    throw new Error("Ovaj zahtjev više nije na čekanju.");
  }

  const serviceName = getServiceName(request.services);
  const startTime = String(request.start_time).slice(0, 5);

  const notificationLang: NotificationLang =
    request.language === "en" ? "en" : "hr";

  const smsMessage = buildRejectedSms({
    serviceName,
    date: request.requested_date,
    startTime,
    reason: rejectionReason,
    lang: notificationLang,
  });

  const { error: updateError } = await supabase
    .from("online_booking_requests")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
      rejection_message: smsMessage,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (isCroatianPhone(request.client_phone)) {
    try {
      await sendInstantSms({
        to: request.client_phone,
        message: smsMessage,
      });
    } catch (error) {
      console.error("Greška pri slanju SMS odbijanja:", error);

      if (request.client_email) {
        try {
          await sendBookingRejectedEmail({
            to: request.client_email,
            serviceName,
            date: formatDateHr(request.requested_date),
            time: startTime,
            reason: rejectionReason,
            lang: notificationLang,
          });
        } catch (emailError) {
          console.error("Greška pri slanju email odbijanja:", emailError);
        }
      }
    }
  } else if (request.client_email) {
    try {
      await sendBookingRejectedEmail({
        to: request.client_email,
        serviceName,
        date: formatDateHr(request.requested_date),
        time: startTime,
        reason: rejectionReason,
        lang: notificationLang,
      });
    } catch (error) {
      console.error("Greška pri slanju email odbijanja:", error);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/online-bookings");
  revalidatePath(`/dashboard/online-bookings/${requestId}`);

  redirect("/dashboard/online-bookings");
}
