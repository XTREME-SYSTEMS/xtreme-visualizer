import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin approval required' }, { status: 403 });

    const input = await req.json().catch(() => ({}));
    if (!input.opportunity_id || input.approved !== true) {
      return Response.json({ error: 'opportunity_id and approved=true are required' }, { status: 400 });
    }

    const opportunity = await base44.entities.AutoLeadOpportunity.get(input.opportunity_id);
    if (!opportunity) return Response.json({ error: 'Opportunity not found' }, { status: 404 });

    if (opportunity.decision === 'decline' || opportunity.verification_status === 'rejected') {
      return Response.json({ error: 'Rejected opportunities cannot be converted' }, { status: 409 });
    }
    if (
      opportunity.verification_status !== 'verified' ||
      !opportunity.last_verified_date ||
      Number(opportunity.confidence || 0) < 0.6
    ) {
      return Response.json({ error: 'Opportunity must be verified with confidence >= 0.60' }, { status: 409 });
    }

    const leads = await base44.entities.Lead.list('-created_date', 500).catch(() => []);
    const duplicate = (leads || []).find((lead: any) =>
      String(lead.notes || '').includes(`AutoLead Opportunity: ${opportunity.id}`) ||
      String(lead.notes || '').includes(`Source: ${opportunity.source_url}`) ||
      (String(lead.project_address || '').toLowerCase() === String(opportunity.jurisdiction || '').toLowerCase() &&
        String(lead.customer_name || '').toLowerCase() === String(opportunity.title || '').toLowerCase())
    );

    const convertedAt = new Date().toISOString();
    if (duplicate) {
      await base44.entities.AutoLeadConversionReceipt.create({
        opportunity_id: opportunity.id,
        lead_id: duplicate.id,
        status: 'duplicate',
        detail: 'Existing Visual X lead matched; no duplicate created',
        converted_at: convertedAt,
        converted_by: user.id
      });
      return Response.json({ ok: true, duplicate: true, lead: duplicate });
    }

    const lead = await base44.entities.Lead.create({
      customer_name: opportunity.title,
      project_address: opportunity.jurisdiction || 'Location pending',
      source: 'lead_generator',
      status: 'new',
      notes: `AutoLead Opportunity: ${opportunity.id}\nSource: ${opportunity.source_url}\nConfidence: ${opportunity.confidence}`
    });

    await base44.entities.AutoLeadOpportunity.update(opportunity.id, {
      decision: 'pursue',
      stage: 'qualification',
      converted_lead_id: lead.id
    });

    await base44.entities.AutoLeadConversionReceipt.create({
      opportunity_id: opportunity.id,
      lead_id: lead.id,
      status: 'converted',
      detail: 'Converted after verified admin approval',
      converted_at: convertedAt,
      converted_by: user.id
    });

    await base44.entities.ActivityReceipt.create({
      action: 'autolead_converted',
      detail: `${opportunity.title} converted to a Visual X lead`,
      category: 'lead',
      lead_id: lead.id
    }).catch(() => null);

    return Response.json({ ok: true, duplicate: false, lead });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}