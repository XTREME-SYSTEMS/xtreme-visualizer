import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// #18: Finds confirmed appointments starting ~24h from now and sends SMS reminders via Twilio
// Called by the "Appointment Reminders" workflow (hourly)

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // Load Twilio config from IntegrationConfig entity
    const configs = await db.entities.IntegrationConfig.filter({ key: 'twilio' });
    const twilio = configs?.[0];
    if (!twilio?.twilio_sid || !twilio?.twilio_auth_token || !twilio?.twilio_phone) {
      return Response.json({ ok: true, sent: 0, message: 'Twilio not configured — skipping SMS reminders' });
    }

    // Find confirmed appointments with a start time 20-28 hours from now
    const now = Date.now();
    const twentyH = 20 * 3600 * 1000;
    const twentyEightH = 28 * 3600 * 1000;
    const windowStart = new Date(now + twentyH).toISOString();
    const windowEnd = new Date(now + twentyEightH).toISOString();

    const appts = await db.entities.Appointment.filter({ status: 'confirmed' });
    const eligible = appts.filter((a: any) => {
      if (!a.confirmed_start || !a.customer_phone) return false;
      const start = new Date(a.confirmed_start).getTime();
      const diff = start - now;
      return diff > twentyH && diff < twentyEightH;
    });

    let sent = 0;
    for (const appt of eligible) {
      try {
        const apptDate = new Date(appt.confirmed_start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        const msg = `Hi ${appt.customer_name}, this is a reminder from Visual-X about your appointment ${apptDate}. Location: ${appt.location || 'TBD'}. Reply to reschedule. We look forward to seeing you!`;

        const from = twilio.twilio_phone;
        const to = appt.customer_phone.replace(/[^+0-9]/g, '');
        const body = new URLSearchParams({ From: from, To: to, Body: msg });

        const auth = btoa(`${twilio.twilio_sid}:${twilio.twilio_auth_token}`);
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.twilio_sid}/Messages.json`, {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (res.ok) sent++;
        else console.error('Twilio SMS failed', await res.text());
      } catch (e) {
        console.error('Reminder SMS failed for appointment', appt.id, e);
      }
    }

    return Response.json({ ok: true, eligible: eligible.length, sent });
  } catch (err) {
    console.error('runAppointmentReminders error', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}