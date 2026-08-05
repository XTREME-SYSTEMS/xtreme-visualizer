import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useApp } from '@/components/AppProvider';
import { VisualXProvenanceBadge } from '../VisualXPrimitives';
import { connectorIcon } from '../ConnectorIcons';
import { Link2, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface ConnectorDef {
  id: string;
  key: string;
  name: string;
  description: string;
  scopes: string[];
}

const CONNECTORS: ConnectorDef[] = [
  { id: '69db200274332486fd28dd7e', key: 'gmail', name: 'Gmail', description: 'Send proposals and follow-ups from your Gmail address.', scopes: ['gmail.send', 'gmail.readonly'] },
  { id: '69ddcb305a599e0b4a1b3cff', key: 'googlecalendar', name: 'Google Calendar', description: 'Schedule site visits and sync appointments.', scopes: ['calendar.events'] },
  { id: '69db1e5e75a5f8c15c80cf34', key: 'googledrive', name: 'Google Drive', description: 'Store proposals, photos, and project documents.', scopes: ['drive.file'] },
  { id: '69db1fad3c50db37ad0ce8dd', key: 'googlesheets', name: 'Google Sheets', description: 'Export leads and quotes to your own spreadsheets.', scopes: ['spreadsheets'] },
  { id: '69db201897e4e8f9ae073be7', key: 'googletasks', name: 'Google Tasks', description: 'Create follow-up tasks from your leads.', scopes: ['tasks'] },
  { id: '69ddcb7e5d965b5605cd24b4', key: 'googledocs', name: 'Google Docs', description: 'Generate proposal documents in your Drive.', scopes: ['documents'] },
  { id: '69db228b2439d854c8587167', key: 'hubspot', name: 'HubSpot CRM', description: 'Push leads, contacts, and deals into your HubSpot pipeline.', scopes: ['crm.objects.contacts.write', 'crm.objects.deals.write', 'crm.objects.companies.write'] },
];

export function IntegrationsRoute() {
  const { notify } = useApp();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('checkConnectorStatus', { connectorIds: CONNECTORS.map(c => c.id) });
      setStatus(res.data.status || {});
    } catch {
      setStatus({});
    }
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      setAuthed(ok);
      if (ok) await fetchStatus();
      setLoading(false);
    });
  }, [fetchStatus]);

  const handleConnect = async (connectorId: string) => {
    setBusy(connectorId);
    try {
      const url = await base44.connectors.connectAppUser(connectorId);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          void fetchStatus();
          setBusy(null);
          notify('Connection refreshed.');
        }
      }, 600);
    } catch (e) {
      notify('Connect failed: ' + (e instanceof Error ? e.message : 'error'));
      setBusy(null);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    setBusy(connectorId);
    try {
      await base44.connectors.disconnectAppUser(connectorId);
      setStatus(prev => ({ ...prev, [connectorId]: false }));
      notify('Account disconnected.');
    } catch (e) {
      notify('Disconnect failed: ' + (e instanceof Error ? e.message : 'error'));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <>
        <div className="vx-page-header"><div><span className="vx-kicker">INTEGRATIONS</span><h1>Connections</h1><p>Link your accounts to power the workflow.</p></div></div>
        <div className="vx-card" style={{ display: 'grid', placeItems: 'center', padding: 40, gap: 12 }}>
          <Loader2 className="vx-icon" style={{ animation: 'spin .8s linear infinite' }} />
          <span className="vx-muted">Checking connection status…</span>
        </div>
      </>
    );
  }

  if (!authed) {
    return (
      <>
        <div className="vx-page-header"><div><span className="vx-kicker">INTEGRATIONS</span><h1>Connections</h1><p>Link your accounts to power the workflow.</p></div></div>
        <div className="vx-card" style={{ textAlign: 'center', padding: 30, display: 'grid', gap: 14 }}>
          <AlertCircle className="vx-icon vx-icon-lg" style={{ color: 'var(--vx-warning)', justifySelf: 'center' }} />
          <strong>Sign in required</strong>
          <span className="vx-muted" style={{ fontSize: 13 }}>You must be logged in to connect your accounts.</span>
          <button className="vx-btn primary" style={{ justifySelf: 'center' }} onClick={() => base44.auth.redirectToLogin()}>Sign in</button>
        </div>
      </>
    );
  }

  const connectedCount = Object.values(status).filter(Boolean).length;

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">INTEGRATIONS</span><h1>Connections</h1><p>Link your own accounts — Gmail, Calendar, Drive, HubSpot and more. {connectedCount} of {CONNECTORS.length} connected.</p></div></div>

      <div className="vx-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
        <div className="vx-section-title"><h2>Google Workspace</h2><VisualXProvenanceBadge status="VERIFIED" source="Per-user OAuth" /></div>
        <p className="vx-muted" style={{ fontSize: 12, margin: 0 }}>Each user connects their own Google account. Tokens are never shared between users.</p>
      </div>

      <div className="integrations-grid">
        {CONNECTORS.map(c => {
          const Icon = connectorIcon[c.key];
          const connected = status[c.id];
          const isBusy = busy === c.id;
          return (
            <div key={c.id} className={`integration-card ${connected ? 'connected' : ''}`}>
              <div className="integration-icon">{Icon && <Icon size={36} />}</div>
              <div className="integration-body">
                <div className="integration-head">
                  <strong>{c.name}</strong>
                  {connected ? (
                    <span className="vx-chip ready"><Check className="vx-icon vx-icon-sm" /> Connected</span>
                  ) : (
                    <span className="vx-chip">Not linked</span>
                  )}
                </div>
                <p className="vx-muted">{c.description}</p>
                {connected ? (
                  <button className="vx-btn compact" disabled={isBusy} onClick={() => handleDisconnect(c.id)}>
                  {isBusy ? <Loader2 className="vx-icon vx-icon-sm" style={{ animation: 'spin .8s linear infinite' }} /> : <Link2 className="vx-icon vx-icon-sm" />}
                  {isBusy ? 'Working…' : 'Disconnect'}
                  </button>
                ) : (
                  <button className="vx-btn compact outline-accent" disabled={isBusy} onClick={() => handleConnect(c.id)}>
                    {isBusy ? <Loader2 className="vx-icon vx-icon-sm" style={{ animation: 'spin .8s linear infinite' }} /> : <ExternalLink className="vx-icon vx-icon-sm" />}
                    {isBusy ? 'Opening…' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="vx-card" style={{ padding: 14, display: 'grid', gap: 8 }}>
        <div className="vx-section-title"><h2>How it works</h2></div>
        <p className="vx-muted" style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
          Tap <strong>Connect</strong> on any service to authorize Visual X with your own account via a secure Google/HubSpot consent screen.
          Once connected, the lead, quote, and proposal screens can push data into your accounts — create HubSpot deals, schedule Calendar visits, and email proposals from your Gmail.
          Disconnect anytime to revoke access.
        </p>
      </div>
    </>
  );
}