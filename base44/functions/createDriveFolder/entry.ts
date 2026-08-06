import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const DRIVE_CONNECTOR_ID = '69db1e5e75a5f8c15c80cf34';

const TEMPLATES = {
  res: ['Chosen Color Image', 'Before Photos', 'Prep & Patch', 'Primer', 'Base Coat', 'Color Install', 'Topcoat', 'After Photos', 'Warranty', 'Scope & Proposals', 'Invoices'],
  com: ['Chosen Color Image', 'Before Photos', 'Prep & Patch', 'Primer', 'Base Coat', 'Color Install', 'Topcoat', 'After Photos', 'Warranty', 'Scope & Proposals', 'Invoices', 'Change Orders', 'COIs'],
  gov: ['Chosen Color Image', 'Before Photos', 'Prep & Patch', 'Primer', 'Base Coat', 'Color Install', 'Topcoat', 'After Photos', 'Warranty', 'Scope & Proposals', 'Invoices', 'Change Orders', 'COIs', 'Compliance Docs']
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { customerName, address, template, workOrderId } = body;
    if (!customerName) return Response.json({ error: 'customerName required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(DRIVE_CONNECTOR_ID);
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const rootName = `${customerName} - ${address || 'Project'}`;
    const rootRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST', headers,
      body: JSON.stringify({ name: rootName, mimeType: 'application/vnd.google-apps.folder' })
    });
    if (!rootRes.ok) return Response.json({ error: 'Drive API error creating root folder' }, { status: 502 });
    const root = await rootRes.json();

    const subs = TEMPLATES[template] || TEMPLATES.res;
    const subfolderIds = {};
    for (const name of subs) {
      const r = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST', headers,
        body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [root.id] })
      });
      if (r.ok) subfolderIds[name] = (await r.json()).id;
    }

    const folderUrl = `https://drive.google.com/drive/folders/${root.id}`;

    if (workOrderId) {
      try {
        await base44.entities.WorkOrder.update(workOrderId, { drive_folder_id: root.id, drive_folder_url: folderUrl });
      } catch {}
    }

    return Response.json({ folderId: root.id, folderUrl, subfolderIds });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}