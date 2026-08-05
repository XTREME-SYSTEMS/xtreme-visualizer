import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const HUBSPOT_CONNECTOR_ID = '69db228b2439d854c8587167';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { action } = body;

    // ---- STATUS ----
    if (action === 'status') {
      try {
        await base44.asServiceRole.connectors.getCurrentAppUserConnection(HUBSPOT_CONNECTOR_ID);
        return Response.json({ connected: true });
      } catch {
        return Response.json({ connected: false });
      }
    }

    // ---- PUSH LEAD ----
    if (action === 'pushLead') {
      const { email, firstname, lastname, phone, address, customer_name, floor_type, proposal_total, leadId } = body;
      if (!customer_name) return Response.json({ error: 'customer_name is required' }, { status: 400 });

      let accessToken: string;
      try {
        const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(HUBSPOT_CONNECTOR_ID);
        accessToken = conn.accessToken;
      } catch {
        return Response.json({ error: 'HubSpot not connected' }, { status: 403 });
      }

      const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

      // Create contact
      const contactRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          properties: { firstname: firstname || '', lastname: lastname || '', email: email || '', phone: phone || '', address: address || '' },
        }),
      });
      const contact = await contactRes.json();
      if (!contactRes.ok) return Response.json({ error: 'HubSpot contact creation failed', detail: contact }, { status: 502 });

      // Create deal
      const dealName = `${customer_name} — ${floor_type || 'Floor project'}`;
      const dealRes = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          properties: {
            dealname: dealName,
            dealstage: 'appointmentscheduled',
            amount: String(proposal_total || 0),
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
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}