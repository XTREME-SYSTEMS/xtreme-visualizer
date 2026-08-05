import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin approval required' }, { status: 403 });

    const input = await req.json().catch(() => ({}));
    const reason = String(input.reason || '').trim();
    if (!input.opportunity_id || input.approved !== true || !reason) {
      return Response.json({ error: 'opportunity_id, approved=true, and reason are required' }, { status: 400 });
    }

    const opportunity = await base44.entities.AutoLeadOpportunity.get(input.opportunity_id);
    if (!opportunity) return Response.json({ error: 'Opportunity not found' }, { status: 404 });

    const now = new Date().toISOString();
    const updated = await base44.entities.AutoLeadOpportunity.update(opportunity.id, {
      decision: 'decline',
      verification_status: 'rejected',
      rejection_reason: reason
    });

    await base44.entities.AutoLeadVerificationReceipt.create({
      opportunity_id: opportunity.id,
      status: 'rejected',
      confidence: Number(opportunity.confidence || 0),
      notes: reason,
      source_url: opportunity.source_url,
      verified_at: now,
      verified_by: user.id
    });

    return Response.json({ ok: true, opportunity: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}