import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart3, Sparkles, QrCode, Mail, MessageSquare, FileText, Eye, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";

const TYPE_META = {
  card_open: { label: "Card Opened", icon: Eye },
  brochure_open: { label: "Brochure Opened", icon: Eye },
  qr_scan: { label: "QR Scanned", icon: QrCode },
  email_sent: { label: "Email Sent", icon: Mail },
  sms_sent: { label: "SMS Sent", icon: MessageSquare },
  whatsapp_sent: { label: "WhatsApp Sent", icon: MessageSquare },
  esign_viewed: { label: "eSign Viewed", icon: FileText },
  esign_signed: { label: "eSign Signed", icon: Check },
  share_clicked: { label: "Share Clicked", icon: Sparkles },
  link_copied: { label: "Link Copied", icon: FileText },
  proposal_viewed: { label: "Proposal Viewed", icon: Eye },
  appointment_booked: { label: "Appointment Booked", icon: Check },
};

export default function Tracking() {
  const [events, setEvents] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    base44.entities.TrackingEvent.list("-created_date", 500).then(setEvents).catch(() => setEvents([]));
  }, []);

  const byType = useMemo(() => {
    if (!events) return [];
    const map = {};
    events.forEach((e) => { map[e.event_type] = (map[e.event_type] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: (TYPE_META[k]?.label || k).replace(" ", "\n"), count: v, key: k }));
  }, [events]);

  const overTime = useMemo(() => {
    if (!events) return [];
    const days = {};
    events.forEach((e) => {
      const d = new Date(e.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days[d] = (days[d] || 0) + 1;
    });
    return Object.entries(days).reverse().slice(-14).map(([name, count]) => ({ name, count }));
  }, [events]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysis("");
    try {
      const summary = byType.map((t) => `${TYPE_META[t.key]?.label || t.key}: ${t.count}`).join(", ");
      const prompt = `You are a marketing analytics expert for a floor coating contractor. Here are their tracking event counts: ${summary}. Total events: ${events.length}. Analyze engagement, identify what's working, what's underperforming, and give 3 specific actionable recommendations to improve lead engagement and conversions. Be concise and specific.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setAnalysis(res);
    } catch (e) {
      setAnalysis("Analysis failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!events) return <div className="hx-loading"><Loader2 className="spin" size={26} /></div>;

  const ChartCard = ({ title, children, height = 180 }) => (
    <div className="hx-sys-card" style={{ minHeight: 0 }}>
      <h3 style={{ fontSize: 12, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 8px" }}>{title}</h3>
      <div style={{ height, width: "100%" }}>{children}</div>
    </div>
  );

  return (
    <div className="hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Analytics & Tracking</h1>
          <p>Engagement metrics across cards, brochures, QR, eSign, email, and SMS.</p>
        </div>
        <button className="hx-mini-btn" onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />} AI Analyze
        </button>
      </div>

      <div className="hx-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
        <div className="hx-stat"><BarChart3 size={16} /><strong>{events.length}</strong><span>Total Events</span></div>
        <div className="hx-stat"><QrCode size={16} /><strong>{byType.find((t) => t.key === "qr_scan")?.count || 0}</strong><span>QR Scans</span></div>
        <div className="hx-stat"><Mail size={16} /><strong>{(byType.find((t) => t.key === "email_sent")?.count || 0)}</strong><span>Emails Sent</span></div>
        <div className="hx-stat"><Check size={16} /><strong>{(byType.find((t) => t.key === "esign_signed")?.count || 0)}</strong><span>eSign Signed</span></div>
      </div>

      {events.length === 0 ? (
        <div className="hx-empty"><span>📊</span>No tracking events yet. Share a card or brochure to start collecting metrics.</div>
      ) : (
        <>
          <ChartCard title="Events by Type">
            <ResponsiveContainer>
              <BarChart data={byType} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
                <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#f0f40b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {overTime.length > 1 && (
            <ChartCard title="Events Over Time (14 days)">
              <ResponsiveContainer>
                <AreaChart data={overTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="evt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#43a9ff" stopOpacity={0.6} /><stop offset="100%" stopColor="#43a9ff" stopOpacity={0.05} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2f2f2f" />
                  <XAxis dataKey="name" tick={{ fill: "#A0A0A0", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#A0A0A0", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #4a4a4a", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#43a9ff" strokeWidth={2} fill="url(#evt)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <div className="hx-list">
            {events.slice(0, 30).map((e) => {
              const meta = TYPE_META[e.event_type] || { label: e.event_type, icon: BarChart3 };
              const Icon = meta.icon;
              return (
                <div key={e.id} className="hx-sys-card" style={{ cursor: "default", padding: 12 }}>
                  <div className="hx-sys-head">
                    <div className="hx-sys-title">
                      <div className="hx-sys-icon"><Icon size={16} /></div>
                      <div>
                        <strong>{meta.label}</strong>
                        <span>{e.asset_name || e.channel || ""}{e.recipient ? ` · ${e.recipient}` : ""}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: "#707070" }}>{new Date(e.created_date).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {analysis && (
        <div className="hx-sys-card" style={{ border: "1px solid var(--vx-accent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Sparkles size={14} style={{ color: "var(--vx-accent)" }} />
            <strong style={{ fontSize: 12, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase" }}>AI Analysis</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--vx-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{analysis}</p>
        </div>
      )}
    </div>
  );
}