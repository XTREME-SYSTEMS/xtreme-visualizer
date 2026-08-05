import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const zipCode: string = body.zipCode;
    const systemName: string = body.systemName || 'epoxy flake flooring';
    if (!zipCode) return Response.json({ error: 'zipCode required' }, { status: 400 });

    const prompt = `Search the web for concrete coating and epoxy flooring contractors near ZIP code ${zipCode} in the USA. Find the average installed price per square foot (including materials and labor) for "${systemName}" in that local market. Look at contractor websites, HomeAdvisor, Angi, Fixr, and similar pricing aggregators for the ${zipCode} area. Return the typical low, median, and high price per square foot. If no local data exists for that exact ZIP, use the regional average for the metro area or state containing ${zipCode}.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          low: { type: 'number', description: 'Low-end installed price per sq ft in USD' },
          mid: { type: 'number', description: 'Median installed price per sq ft in USD' },
          high: { type: 'number', description: 'High-end installed price per sq ft in USD' },
          summary: { type: 'string', description: 'Brief summary of local market pricing found' },
          confidence: { type: 'string', description: 'high, medium, or low' },
          metro_area: { type: 'string', description: 'Metro area or region used for the estimate' },
          sources: { type: 'array', items: { type: 'string' }, description: 'URLs or source names consulted' },
        },
      },
    });

    const low = Number(result.low) || 0;
    const mid = Number(result.mid) || 0;
    const high = Number(result.high) || 0;

    // Persist the lookup for audit and reuse
    try {
      await base44.entities.MarketPrice.create({
        trade: systemName,
        zip_code: zipCode,
        low, mid, high,
        unit: 'per sq ft',
        summary: String(result.summary || ''),
        confidence: String(result.confidence || 'low'),
      });
    } catch { /* best-effort */ }

    return Response.json({
      zipCode,
      systemName,
      low, mid, high,
      summary: result.summary,
      confidence: result.confidence,
      metro_area: result.metro_area,
      sources: result.sources || [],
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}