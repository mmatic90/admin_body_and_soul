import { getTwilioClient } from "./client";

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "").trim();

  if (cleaned.startsWith("09")) {
    return `+385${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("385")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("00385")) {
    return `+${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  throw new Error(`Neispravan format broja telefona: ${phone}`);
}

function getMessagingServiceSid() {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!messagingServiceSid) {
    throw new Error("Nedostaje TWILIO_MESSAGING_SERVICE_SID.");
  }

  return messagingServiceSid;
}

export async function sendInstantSms({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  const client = getTwilioClient();
  const messagingServiceSid = getMessagingServiceSid();
  const normalized = normalizePhone(to);

  console.log("[Twilio] instant raw:", to);
  console.log("[Twilio] instant normalized:", normalized);
  console.log("[Twilio] instant service:", messagingServiceSid);

  const result = await client.messages.create({
    to: normalized,
    body: message,
    messagingServiceSid,
  });

  console.log("[Twilio] instant result:", {
    sid: result.sid,
    status: result.status,
    to: result.to,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
  });

  return result;
}

export async function scheduleSms({
  to,
  message,
  sendAt,
}: {
  to: string;
  message: string;
  sendAt: Date;
}) {
  const client = getTwilioClient();
  const messagingServiceSid = getMessagingServiceSid();
  const normalized = normalizePhone(to);

  console.log("[Twilio] scheduled raw:", to);
  console.log("[Twilio] scheduled normalized:", normalized);
  console.log("[Twilio] scheduled sendAt:", sendAt.toISOString());
  console.log("[Twilio] scheduled service:", messagingServiceSid);

  const result = await client.messages.create({
    to: normalized,
    body: message,
    messagingServiceSid,
    scheduleType: "fixed",
    sendAt,
  });

  console.log("[Twilio] scheduled result:", {
    sid: result.sid,
    status: result.status,
    to: result.to,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
  });

  return result;
}

export async function cancelScheduledSms(messageSid: string) {
  const client = getTwilioClient();

  return client.messages(messageSid).update({
    status: "canceled",
  });
}
