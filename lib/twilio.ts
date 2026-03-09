import twilio from 'twilio'

// Client Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

// Envoyer un SMS via Twilio
export async function sendSMS(to: string, message: string): Promise<{ sid: string; status: string }> {
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  })
  return { sid: result.sid, status: result.status }
}
