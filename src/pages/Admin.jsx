import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Link2, Unlink, Phone, Save, ShieldCheck, AlertTriangle, Check } from "lucide-react";

const CONNECTORS = [
  { id: "69db200274332486fd28dd7e", name: "Google Gmail", type: "gmail", desc: "Inbox sync & email send" },
  { id: "69ddcb305a599e0b4a1b3cff", name: "Google Calendar", type: "googlecalendar", desc: "Appointment sync" },
  { id: "69db1e5e75a5f8c15c80cf34", name: "Google Drive", type: "googledrive", desc: "Project folder automation" },
  { id: "69db1fad3c50db37ad0ce8dd", name: "Google Sheets", type: "googlesheets", desc: "Lead export" },
  { id: "69ddcb7e5d965b5605cd24b4", name: "Google Docs", type: "googledocs", desc: "Document generation" },
  { id: "69ddcb201897e4e8f9ae073be7", name: "Google Tasks", type: "googletasks", desc: "Task sync" },
  { id: "69db228b2439d854c8587167", name: "HubSpot", type: "hubspot", desc: "CRM push" },
  { id: "69e521c8418f5cecefb2567c", name: "Supabase", type: "supabase", desc: "Database" },
];

export default function Admin() {
  const [status, setStatus] = useState({}); // connectorId -> 'unknown' | 'connected' | 'disconnected'
  const [busy, setBusy] = useState({});
  const [twilio, setTwilio] = useState({ twilio_sid: "", twilio_auth_token: "", twilio_phone: "", twilio_sic_code: "" });
  const [twilioId, setTwilioId] = useState(null);
  const [savingTwilio, setSavingTwilio] = useState(false);
  const [saved, setSaved] = useState(false);

  const notify = (msg) => {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:300;background:var(--vx-panel);border:1px solid var(--vx-accent);color:var(--vx-accent);padding:10px 16px;border-radius:10px;font-size:13px;font-weight:700";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  };

  // Check each connector by trying its backend function
  const checkAll = async () => {
    const checks = {
      "69db200274332486fd28dd7e": () => base44.functions.invoke("gmail", { action: "list", max: 1 }).then(() => true).catch(() => false),
      "69ddcb305a599e0b4a1b3cff": () => base44.functions.invoke("createCalendarAppointment", { ping: true }).then(() => true).catch(() => false),
      "69db1fad3c50db37ad0ce8dd": () => base44.functions.invoke("syncLeadsToGoogleSheet", { ping: true }).then(() => true).catch(() => false),
      "69db228b2439d854c8587167": () => base44.functions.invoke("pushLeadToHubSpot", { ping: true }).then(() => true).catch(() => false),
    };
    const next = { ...status };
    await Promise.all(CONNECTORS.map(async (c) => {
      if (checks[c.id]) {
        next[c.id] = (await checks[c.id]()) ? "connected" : "disconnected";
      } else {
        next[c.id] = "unknown";
      }
    }));
    setStatus(next);
  };

  const loadTwilio = async () => {
    try {
      const rows = await base44.entities.IntegrationConfig.filter({ key: "twilio" });
      if (rows.length > 0) {
        setTwilio(rows[0]);
        setTwilioId(rows[0].id);
      }
    } catch {}
  };

  useEffect(() => { checkAll(); loadTwilio(); }, []);

  const connect = async (c) => {
    setBusy((b) => ({ ...b, [c.id]: true }));
    try {
      const url = await base44.connectors.connectAppUser(c.id);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkAll();
          setBusy((b) => ({ ...b, [c.id]: false }));
        }
      }, 600);
    } catch (e) {
      notify("Connect failed: " + e.message);
      setBusy((b) => ({ ...b, [c.id]: false }));
    }
  };

  const disconnect = async (c) => {
    setBusy((b) => ({ ...b, [c.id]: true }));
    try {
      await base44.connectors.disconnectAppUser(c.id);
      setStatus((s) => ({ ...s, [c.id]: "disconnected" }));
      notify(c.name + " disconnected");
    } catch (e) {
      notify("Disconnect failed");
    } finally {
      setBusy((b) => ({ ...b, [c.id]: false }));
    }
  };

  const saveTwilio = async () => {
    setSavingTwilio(true);
    try {
      const payload = { key: "twilio", ...twilio };
      if (twilioId) {
        await base44.entities.IntegrationConfig.update(twilioId, payload);
      } else {
        const created = await base44.entities.IntegrationConfig.create(payload);
        setTwilioId(created.id);
      }
      setSaved(true);
      notify("Twilio config saved");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      notify("Save failed: " + e.message);
    } finally {
      setSavingTwilio(false);
    }
  };

  const statusDot = (s) => {
    if (s === "connected") return <span style={{ color: "var(--vx-accent)", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} /> Connected</span>;
    if (s === "disconnected") return <span style={{ color: "var(--vx-danger)", fontSize: 11, fontWeight: 700 }}>Not connected</span>;
    return <span style={{ color: "var(--vx-faint)", fontSize: 11 }}>Unknown</span>;
  };

  return (
    <div className="hx-page" style={{ gap: 14 }}>
      <div className="hx-page-head">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}><ShieldCheck size={22} style={{ color: "var(--vx-accent)" }} /> Admin · Integrations</h1>
          <p>Hidden admin console. Connect OAuth services and configure Twilio voice.</p>
        </div>
        <button className="hx-mini-btn dark" onClick={checkAll}>Refresh</button>
      </div>

      <div className="hx-notice" style={{ borderColor: "#9a7b00", background: "rgba(255,210,0,.06)" }}>
        <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
        This page is not linked in navigation. Bookmark <code style={{ color: "var(--vx-accent)" }}>/admin</code> to access it.
      </div>

      {/* OAuth Connectors */}
      <div className="hx-sys-grid">
        {CONNECTORS.map((c) => (
          <div key={c.id} className="hx-sys-card">
            <div className="hx-sys-head">
              <div className="hx-sys-title">
                <div className="hx-sys-icon"><Link2 size={18} /></div>
                <div>
                  <strong>{c.name}</strong>
                  <span>{c.desc}</span>
                </div>
              </div>
              {statusDot(status[c.id])}
            </div>
            <div className="hx-bid-controls">
              {status[c.id] === "connected" ? (
                <button className="hx-sys-edit" style={{ color: "var(--vx-danger)", borderColor: "var(--vx-danger)" }} onClick={() => disconnect(c)} disabled={busy[c.id]}>
                  {busy[c.id] ? <Loader2 size={14} className="spin" /> : <Unlink size={14} />} Disconnect
                </button>
              ) : (
                <button className="hx-sys-edit" style={{ color: "var(--vx-accent)", borderColor: "var(--vx-accent)" }} onClick={() => connect(c)} disabled={busy[c.id]}>
                  {busy[c.id] ? <Loader2 size={14} className="spin" /> : <Link2 size={14} />} Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Twilio */}
      <div className="hx-scraper-form">
        <div className="hx-bid-input-label"><Phone size={15} /> Twilio Voice Agent</div>
        <p style={{ fontSize: 12, color: "var(--vx-muted)", margin: "0 0 4px" }}>Enter your Twilio credentials to enable the AI voice assistant. Saved to the admin-only IntegrationConfig store.</p>
        <div className="form-grid two">
          <div className="field"><label>Account SID</label><input value={twilio.twilio_sid} onChange={(e) => setTwilio({ ...twilio, twilio_sid: e.target.value })} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></div>
          <div className="field"><label>Auth Token</label><input type="password" value={twilio.twilio_auth_token} onChange={(e) => setTwilio({ ...twilio, twilio_auth_token: e.target.value })} placeholder="••••••••••••••••" /></div>
        </div>
        <div className="form-grid two">
          <div className="field"><label>Twilio Phone Number</label><input value={twilio.twilio_phone} onChange={(e) => setTwilio({ ...twilio, twilio_phone: e.target.value })} placeholder="+1XXXXXXXXXX" /></div>
          <div className="field"><label>SIC Code</label><input value={twilio.twilio_sic_code} onChange={(e) => setTwilio({ ...twilio, twilio_sic_code: e.target.value })} placeholder="e.g. 1541" /></div>
        </div>
        <button className="gold-button" style={{ justifyContent: "center", marginTop: 8 }} onClick={saveTwilio} disabled={savingTwilio}>
          {savingTwilio ? <Loader2 size={15} className="spin" /> : saved ? <Check size={15} /> : <Save size={15} />} {saved ? "Saved" : "Save Twilio Config"}
        </button>
      </div>
    </div>
  );
}