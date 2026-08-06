import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GOOGLE_SHEETS_CONNECTOR_ID = '69db1fad3c50db37ad0ce8dd';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let accessToken: string;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GOOGLE_SHEETS_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'Google Sheets not connected' }, { status: 403 });
    }

    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Fetch all leads
    const leads = await base44.entities.Lead.list('-created_date', 500);

    // Create a new spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        properties: { title: `Visual-X Leads Export ${new Date().toISOString().slice(0, 10)}` },
        sheets: [{ properties: { title: 'Leads' } }],
      }),
    });
    const sheet = await createRes.json();
    if (!createRes.ok) return Response.json({ error: 'Sheet creation failed', detail: sheet }, { status: 502 });

    const spreadsheetId = sheet.spreadsheetId;

    // Build rows
    const headers = ['Customer Name', 'Email', 'Phone', 'Address', 'Square Feet', 'System', 'Floor Type', 'Color', 'Estimate Low', 'Estimate High', 'Status', 'Created Date'];
    const rows = leads.map((l: any) => [
      l.customer_name || '',
      l.email || '',
      l.phone || '',
      l.project_address || '',
      l.square_feet || '',
      l.system_name || '',
      l.floor_type || '',
      l.color_name || '',
      l.estimate_low || '',
      l.estimate_high || '',
      l.status || '',
      l.created_date ? new Date(l.created_date).toISOString().slice(0, 10) : '',
    ]);

    // Write values
    const range = `Leads!A1`;
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ values: [headers, ...rows] }),
      }
    );
    const writeData = await writeRes.json();
    if (!writeRes.ok) return Response.json({ error: 'Sheet write failed', detail: writeData }, { status: 502 });

    return Response.json({
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      rowsSynced: leads.length,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}