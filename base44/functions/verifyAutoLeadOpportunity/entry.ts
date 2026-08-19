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

    const confidence = Number(input.confidence);
    if (!Number.isFinite(confidence) || confidence < 0.6 || confidence > 1) {
      return Response.json({ error: 'confidence must be between 0.60 and 1.00' }, { status: 400 });
    }

    const opportunity = await base44.entities.AutoLeadOpportunity.get(input.opportunity_id);
    if (!opportunity) return Response.json({ error: 'Opportunity not found' }, { status: 404 });

    const verifiedAt = new Date().toISOString();
    const updated = await base44.entities.AutoLeadOpportunity.update(opportunity.id, {
      verification_status: 'verified',
      confidence,
      verification_notes: String(input.notes || ''),
      last_verified_date: verifiedAt,
      rejection_reason: ''
    });

    await base44.entities.AutoLeadVerificationReceipt.create({
      opportunity_id: opportunity.id,
      status: 'verified',
      confidence,
      notes: String(input.notes || ''),
      source_url: opportunity.source_url,
      verified_at: verifiedAt,
      verified_by: user.id
    });

    return Response.json({ ok: true, opportunity: updated });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}