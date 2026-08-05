import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const HUBSPOT_CONNECTOR_ID = '69db228b2439d854c8587167';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { leadId, customerName, email, phone, address, squareFeet, systemName, estimateLow, estimateHigh } = body;
    if (!customerName) return Response.json({ error: 'customerName is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(HUBSPOT_CONNECTOR_ID);
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const parts = (customerName as string).trim().split(/\s+/);
    const firstname = parts[0] || '';
    const lastname = parts.slice(1).join(' ') || '';

    // Create contact
    const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        properties: { firstname, lastname, email: email || '', phone: phone || '', address: address || '' },
      }),
    });
    const contact = await contactRes.json();
    if (!contactRes.ok) return Response.json({ error: 'HubSpot contact creation failed', detail: contact }, { status: 502 });

    // Create deal
    const dealName = `${customerName} — ${systemName || 'Floor project'}`;
    const dealRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        properties: {
          dealname: dealName,
          dealstage: 'appointmentscheduled',
          amount: String(estimateHigh || 0),
          pipeline: 'default',
        },
      }),
    });
    const deal = await dealRes.json();
    if (!dealRes.ok) return Response.json({ error: 'HubSpot deal creation failed', detail: deal }, { status: 502 });

    // Associate contact to deal
    if (contact.id && deal.id) {
      await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${deal.id}/associations/contacts/${contact.id}/deal_to_contact`, {
        method: 'PUT',
        headers: authHeader,
      });
    }

    // Update lead record with HubSpot IDs
    if (leadId) {
      try {
        await base44.entities.Lead.update(leadId, {
          hubspot_contact_id: contact.id,
          hubspot_deal_id: deal.id,
          status: 'qualified',
        });
      } catch { /* non-fatal */ }
    }

    return Response.json({ contactId: contact.id, dealId: deal.id, dealName });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}