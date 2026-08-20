import { getTwilioClient } from "./client";

const MAX_GSM7_SEPTETS = 160;
const GSM7_EXTENSION_CHARS = new Set(["^", "{", "}", "\\", "[", "~", "]", "|", "€"]);

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

function toGsm7Text(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Đđ]/g, (char) => (char === "Đ" ? "D" : "d"))
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function gsm7Length(value: string) {
  return Array.from(value).reduce(
    (total, char) => total + (GSM7_EXTENSION_CHARS.has(char) ? 2 : 1),
    0,
  );
}

function trimToGsm7Length(value: string, maxLength: number) {
  if (gsm7Length(value) <= maxLength) return value;

  let result = "";
  let length = 0;

  for (const char of value) {
    const charLength = GSM7_EXTENSION_CHARS.has(char) ? 2 : 1;
    if (length + charLength > maxLength) break;
    result += char;
    length += charLength;
  }

  return result.trimEnd();
}

function withOptionalService(
  serviceName: string,
  buildWithService: (service: string) => string,
  buildWithoutService: () => string,
) {
  const normalizedService = toGsm7Text(serviceName);
  const full = buildWithService(normalizedService);

  if (gsm7Length(full) <= MAX_GSM7_SEPTETS) return full;

  const suffix = '...';
  let low = 1;
  let high = normalizedService.length;
  let best = "";

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidateService = `${normalizedService.slice(0, middle).trimEnd()}${suffix}`;
    const candidate = buildWithService(candidateService);

    if (gsm7Length(candidate) <= MAX_GSM7_SEPTETS) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return best || buildWithoutService();
}

function compactAutomatedSms(rawMessage: string) {
  const message = toGsm7Text(rawMessage);

  const created = message.match(
    /^Bok (.*?), vas termin za "(.*?)" uspjesno je rezerviran za (\d{2})\.(\d{2})\.\d{4} u (\d{2}:\d{2})\. Body & Soul$/,
  );
  if (created) {
    const [, clientName, serviceName, day, month, time] = created;
    return withOptionalService(
      serviceName,
      (service) => `Body & Soul: ${clientName}, termin za "${service}" rezerviran je ${day}.${month}. u ${time}.`,
      () => `Body & Soul: ${clientName}, termin je rezerviran za ${day}.${month}. u ${time}.`,
    );
  }

  const reminder = message.match(
    /^Podsjetnik: sutra imate termin za "(.*?)" u (\d{2}:\d{2}) \((\d{2})\.(\d{2})\.\d{4}\)\. Body & Soul$/,
  );
  if (reminder) {
    const [, serviceName, time] = reminder;
    return withOptionalService(
      serviceName,
      (service) => `Body & Soul: Podsjetnik na termin sutra u ${time} za "${service}".`,
      () => `Body & Soul: Podsjetnik na termin sutra u ${time}. Vidimo se!`,
    );
  }

  const updated = message.match(
    /^Bok (.*?), vas termin za "(.*?)" je izmijenjen\. Novi termin je (\d{2})\.(\d{2})\.\d{4} u (\d{2}:\d{2})\. Body & Soul$/,
  );
  if (updated) {
    const [, clientName, serviceName, day, month, time] = updated;
    return withOptionalService(
      serviceName,
      (service) => `Body & Soul: ${clientName}, termin za "${service}" promijenjen je na ${day}.${month}. u ${time}.`,
      () => `Body & Soul: ${clientName}, termin je promijenjen na ${day}.${month}. u ${time}.`,
    );
  }

  const acceptedHr = message.match(
    /^Body & Soul Vas termin je potvrđen\. Usluga: (.*?) Datum: (\d{2})\.(\d{2})\.\d{4}\. Vrijeme: (\d{2}:\d{2}) Ako ne mozete doci, molimo javite salonu na .*?\. Vidimo se!$/,
  );
  if (acceptedHr) {
    const [, serviceName, day, month, time] = acceptedHr;
    return withOptionalService(
      serviceName,
      (service) => `Body & Soul: Termin za "${service}" potvrdjen je za ${day}.${month}. u ${time}. Vidimo se!`,
      () => `Body & Soul: Vas termin je potvrdjen za ${day}.${month}. u ${time}. Vidimo se!`,
    );
  }

  const acceptedEn = message.match(
    /^Body & Soul Your appointment has been confirmed\. Service: (.*?) Date: (\d{2})\.(\d{2})\.\d{4}\. Time: (\d{2}:\d{2}) If you cannot attend, please contact the salon at .*?\. See you soon!$/,
  );
  if (acceptedEn) {
    const [, serviceName, day, month, time] = acceptedEn;
    return withOptionalService(
      serviceName,
      (service) => `Body & Soul: Your appointment for "${service}" is confirmed for ${day}.${month}. at ${time}. See you soon!`,
      () => `Body & Soul: Your appointment is confirmed for ${day}.${month}. at ${time}. See you soon!`,
    );
  }

  const rejectedHr = message.match(
    /^Body & Soul Vas zahtjev za termin nije moguce potvrditi\. Usluga: .*? Datum: (\d{2})\.(\d{2})\.\d{4}\. Vrijeme: (\d{2}:\d{2}) Razlog: (.*?) Za dogovor novog termina kontaktirajte salon na (.*?)\.$/,
  );
  if (rejectedHr) {
    const [, day, month, time, reason, phone] = rejectedHr;
    const prefix = `Body & Soul: Termin ${day}.${month}. u ${time} nije potvrdjen. Razlog: `;
    const suffix = ` Kontakt: ${phone.replace(/\s+/g, "")}`;
    const available = MAX_GSM7_SEPTETS - gsm7Length(prefix) - gsm7Length(suffix);
    const shortReason = trimToGsm7Length(reason, Math.max(1, available));
    return `${prefix}${shortReason}${suffix}`;
  }

  const rejectedEn = message.match(
    /^Body & Soul Your booking request could not be confirmed\. Service: .*? Date: (\d{2})\.(\d{2})\.\d{4}\. Time: (\d{2}:\d{2}) Reason: (.*?) Please contact the salon at (.*?) to arrange another appointment\.$/,
  );
  if (rejectedEn) {
    const [, day, month, time, reason, phone] = rejectedEn;
    const prefix = `Body & Soul: Your ${day}.${month}. ${time} appointment was not confirmed. Reason: `;
    const suffix = ` Call ${phone.replace(/\s+/g, "")}`;
    const available = MAX_GSM7_SEPTETS - gsm7Length(prefix) - gsm7Length(suffix);
    const shortReason = trimToGsm7Length(reason, Math.max(1, available));
    return `${prefix}${shortReason}${suffix}`;
  }

  const reviewHr = message.match(
    /^Body & Soul Bok .*?, hvala na dolasku\. Ako ste zadovoljni tretmanom, jako bi nam znacila kratka Google recenzija: (\S+) Hvala!$/,
  );
  if (reviewHr) {
    return `Body & Soul: Hvala na dolasku! Znacila bi nam vasa Google recenzija: ${reviewHr[1]}`;
  }

  const compacted = message;
  if (gsm7Length(compacted) <= MAX_GSM7_SEPTETS) return compacted;

  return `${trimToGsm7Length(compacted, MAX_GSM7_SEPTETS - 3)}...`;
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
  const optimizedMessage = compactAutomatedSms(message);

  console.log("[Twilio] instant raw:", to);
  console.log("[Twilio] instant normalized:", normalized);
  console.log("[Twilio] instant service:", messagingServiceSid);
  console.log("[Twilio] instant GSM-7 length:", gsm7Length(optimizedMessage));

  const result = await client.messages.create({
    to: normalized,
    body: optimizedMessage,
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
  const optimizedMessage = compactAutomatedSms(message);

  console.log("[Twilio] scheduled raw:", to);
  console.log("[Twilio] scheduled normalized:", normalized);
  console.log("[Twilio] scheduled sendAt:", sendAt.toISOString());
  console.log("[Twilio] scheduled service:", messagingServiceSid);
  console.log("[Twilio] scheduled GSM-7 length:", gsm7Length(optimizedMessage));

  const result = await client.messages.create({
    to: normalized,
    body: optimizedMessage,
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
