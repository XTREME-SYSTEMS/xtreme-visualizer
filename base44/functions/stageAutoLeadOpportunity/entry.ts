import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const input = await req.json().catch(() => ({}));
    const title = String(input.title || '').trim();
    const sourceUrl = String(input.source_url || '').trim();
    if (!title || !sourceUrl) return Response.json({ error: 'title and source_url are required' }, { status: 400 });

    let parsed;
    try {
      parsed = new URL(sourceUrl);
    } catch {
      return Response.json({ error: 'source_url must be a valid URL' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return Response.json({ error: 'source_url must use http or https' }, { status: 400 });
    }

    const confidence = Number(input.confidence || 0);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return Response.json({ error: 'confidence must be between 0 and 1' }, { status: 400 });
    }

    const existing = await base44.entities.AutoLeadOpportunity.list('-created_date', 500).catch(() => []);
    const jurisdiction = String(input.jurisdiction || '').trim();
    const duplicate = (existing || []).find((item) =>
      item.source_url === parsed.toString() ||
      (input.source_id && item.source_id === input.source_id) ||
      (String(item.title || '').toLowerCase() === title.toLowerCase() &&
        String(item.jurisdiction || '').toLowerCase() === jurisdiction.toLowerCase())
    );
    if (duplicate) return Response.json({ ok: true, duplicate: true, opportunity: duplicate });

    const opportunity = await base44.entities.AutoLeadOpportunity.create({
      title,
      jurisdiction,
      source_url: parsed.toString(),
      source_id: String(input.source_id || '').trim(),
      stage: 'qualification',
      decision: 'review',
      confidence,
      verification_status: 'needs_review',
      verification_notes: '',
      rejection_reason: '',
      estimated_value: Math.max(0, Number(input.estimated_value || 0)),
      data_class: input.data_class === 'production' ? 'production' : 'NON_PRODUCTION_EXAMPLE'
    });

    return Response.json({ ok: true, duplicate: false, opportunity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}