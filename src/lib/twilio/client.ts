import twilio from "twilio";

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Nedostaju TWILIO_ACCOUNT_SID ili TWILIO_AUTH_TOKEN.");
  }

  return twilio(accountSid, authToken);
}
