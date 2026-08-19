import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, RefreshCw, Sparkles, Send, Mail, Search, Plus, X, AlertTriangle,
} from "lucide-react";
import { PullToRefresh } from "@/components/visual-x/PullToRefresh";

const GMAIL_CONNECTOR_ID = "69db200274332486fd28dd7e";

function parseFrom(from = "") {
  const m = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].replace(/"/g, "").trim() || m[2], email: m[2] };
  return { name: from, email: from };
}
function initials(name = "") {
  const p = name.split(" ").filter(Boolean);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return `${Math.floor(diff / 3600)}h`;
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Inbox() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reading, setReading] = useState(false);
  const [reply, setReply] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", text: "" });
  const [sendingCompose, setSendingCompose] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("gmail", { action: "list" });
      const out = res.data ?? res;
      if (out.error) throw new Error(out.error);
      setItems(out.items || []);
      setConnected(true);
    } catch (e) {
      const msg = String(e?.message || e);
      if (/not connected|403/i.test(msg)) { setConnected(false); setItems([]); }
      else { setConnected(true); setItems([]); toast({ title: "Couldn't load inbox", description: msg, variant: "destructive" }); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInbox(); }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const url = await base44.connectors.connectAppUser(GMAIL_CONNECTOR_ID);
      window.location.href = url;
    } catch (e) {
      toast({ title: "Connect failed", description: String(e?.message || e), variant: "destructive" });
      setConnecting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => [m.from, m.subject, m.snippet].filter(Boolean).some((v) => v.toLowerCase().includes(q)));
  }, [items, search]);

  const unreadCount = useMemo(() => (items || []).filter((m) => m.unread).length, [items]);

  const open = async (m) => {
    setActiveId(m.id);
    setDetail(null);
    setReading(true);
    setReply("");
    try {
      const res = await base44.functions.invoke("gmail", { action: "read", id: m.id });
      const out = res.data ?? res;
      setDetail(out);
      if (m.unread) {
        base44.functions.invoke("gmail", { action: "markRead", id: m.id }).catch(() => {});
        setItems((arr) => (arr || []).map((x) => (x.id === m.id ? { ...x, unread: false } : x)));
      }
    } catch (e) {
      toast({ title: "Couldn't open message", description: String(e?.message || e), variant: "destructive" });
      setActiveId(null);
    } finally {
      setReading(false);
    }
  };

  const closeDetail = () => { setActiveId(null); setDetail(null); setReply(""); };

  const draftReply = async () => {
    if (!detail) return;
    setDrafting(true);
    try {
      const out = await base44.integrations.Core.InvokeLLM({
        prompt: `A flooring contractor received this email. Draft a professional, concise reply that addresses the customer's question, offers clear next steps, and never promises a final price, fixed date, or warranty. Sign off as the contractor. Keep under 180 words.\n\nFrom: ${detail.from}\nSubject: ${detail.subject}\n\nEmail:\n${detail.body}`,
      });
      setReply(String(out));
    } catch {
      toast({ title: "AI draft failed", variant: "destructive" });
    } finally {
      setDrafting(false);
    }
  };

  const send = async () => {
    if (!reply.trim() || !detail) return;
    setSending(true);
    try {
      const to = (detail.from || "").match(/<([^>]+)>/)?.[1] || detail.from;
      const subject = detail.subject?.startsWith("Re:") ? detail.subject : `Re: ${detail.subject || ""}`;
      const res = await base44.functions.invoke("gmail", { action: "send", to, subject, text: reply });
      const out = res.data ?? res;
      if (out.ok) { toast({ title: "Reply sent" }); closeDetail(); }
      else toast({ title: out.error || "Send failed", variant: "destructive" });
    } catch (e) {
      toast({ title: "Send failed — is Gmail connected?", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendCompose = async () => {
    if (!compose.to || !compose.subject) { toast({ title: "Recipient and subject are required", variant: "destructive" }); return; }
    setSendingCompose(true);
    try {
      const res = await base44.functions.invoke("gmail", { action: "send", to: compose.to, subject: compose.subject, text: compose.text });
      const out = res.data ?? res;
      if (out.ok) { toast({ title: "Message sent" }); setComposing(false); setCompose({ to: "", subject: "", text: "" }); }
      else toast({ title: out.error || "Send failed", variant: "destructive" });
    } catch (e) {
      toast({ title: "Send failed — is Gmail connected?", variant: "destructive" });
    } finally {
      setSendingCompose(false);
    }
  };

  return (
    <PullToRefresh onRefresh={fetchInbox}>
    <div className="page hx-page" style={{ gap: 10 }}>
      <div className="hx-page-head">
        <div>
          <h1>Inbox</h1>
          <p>Customer emails, proposal replies, and follow-ups{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}.</p>
        </div>
        <div className="top-actions">
          <button className="hx-icon-btn" onClick={fetchInbox} disabled={loading} aria-label="Refresh">
            {loading ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
          </button>
          <button className="hx-mini-btn" onClick={() => setComposing(true)} disabled={!connected}>
            <Plus size={16} /> <span>Compose</span>
          </button>
        </div>
      </div>

      {!connected ? (
        <div className="hx-sys-card" style={{ textAlign: "center", padding: 28, display: "grid", gap: 14, placeItems: "center" }}>
          <div className="hx-portal-icon" style={{ width: 56, height: 56 }}><Mail size={26} /></div>
          <div>
            <strong style={{ fontSize: 16, display: "block", marginBottom: 4 }}>Connect your Gmail</strong>
            <span style={{ fontSize: 13, color: "#A0A0A0" }}>Sync your customer inbox to read and reply to emails right here.</span>
          </div>
          <button className="gold-button" style={{ justifyContent: "center" }} onClick={connect} disabled={connecting}>
            {connecting ? <Loader2 size={16} className="spin" /> : <Mail size={16} />} {connecting ? "Connecting…" : "Connect Gmail"}
          </button>
        </div>
      ) : (
        <>
          <div className="hx-search-card">
            <div className="hx-search">
              <Search size={16} />
              <input placeholder="Search sender, subject, or snippet…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="hx-list">
            {loading && !items && (
              [0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="hx-mail-row" style={{ cursor: "default" }}>
                  <span className="hx-mail-avatar" style={{ opacity: 0.3 }}>··</span>
                  <span className="hx-mail-info">
                    <strong style={{ color: "#404040" }}>Loading…</strong>
                    <p style={{ color: "#404040" }}>·············</p>
                  </span>
                  <time style={{ color: "#404040" }}>···</time>
                </div>
              ))
            )}
            {items && filtered.length === 0 && !loading && (
              <div className="hx-empty">
                <span>✉</span>
                {items.length === 0 ? "No messages in your inbox yet." : "No matches found."}
              </div>
            )}
            {filtered.map((m) => {
              const { name } = parseFrom(m.from);
              return (
                <button key={m.id} className={`hx-mail-row ${activeId === m.id ? "active" : ""}`} onClick={() => open(m)}>
                  <span className="hx-mail-avatar" style={m.unread ? { borderColor: "var(--vx-accent)", boxShadow: "var(--vx-glow)" } : {}}>{initials(name)}</span>
                  <span className="hx-mail-info">
                    <strong style={m.unread ? { color: "#fff" } : {}}>{name}</strong>
                    <p style={m.unread ? { color: "#d0d0d0", fontWeight: 600 } : {}}>{m.subject || m.snippet}</p>
                    {!m.subject && m.snippet && <p style={{ fontSize: 10 }}>{m.snippet}</p>}
                  </span>
                  <span style={{ display: "grid", gap: 4, justifyItems: "end" }}>
                    <time>{formatDate(m.date)}</time>
                    {m.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--vx-accent)", boxShadow: "var(--vx-glow)" }} />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Message detail */}
      {activeId && (
        <div className="overlay" onClick={closeDetail}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: "88vh" }}>
            <div className="modal-head">
              <div style={{ minWidth: 0 }}>
                <div className="eyebrow">Message</div>
                <h2 style={{ fontSize: 17, wordBreak: "break-word" }}>{detail?.subject || "Opening…"}</h2>
              </div>
              <button className="close-button" onClick={closeDetail}><X size={18} /></button>
            </div>
            {reading ? (
              <div style={{ display: "grid", placeItems: "center", padding: 30 }}><Loader2 size={22} className="spin" style={{ color: "var(--vx-accent)" }} /></div>
            ) : detail ? (
              <>
                <div style={{ display: "grid", gap: 4, padding: "10px 12px", borderRadius: 12, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)", marginBottom: 12 }}>
                  <strong style={{ fontSize: 13 }}>{detail.from}</strong>
                  <span style={{ fontSize: 11, color: "#A0A0A0" }}>{detail.snippet ? formatDate(detail.snippet) : ""}</span>
                </div>
                <p className="hx-mail-body" style={{ whiteSpace: "pre-wrap", maxHeight: 260, overflowY: "auto", padding: 2 }}>{detail.body || "(no body)"}</p>

                <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 12, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase" }}>Reply</strong>
                    <button className="hx-bid-logo-btn" onClick={draftReply} disabled={drafting}>
                      {drafting ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} AI Draft
                    </button>
                  </div>
                  <textarea className="hx-mail-textarea" placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
                  <button className="gold-button" style={{ justifyContent: "center" }} onClick={send} disabled={!reply.trim() || sending}>
                    {sending ? <Loader2 size={15} className="spin" /> : <Send size={15} />} Send Reply
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "grid", placeItems: "center", padding: 30, gap: 8, textAlign: "center" }}>
                <AlertTriangle size={22} style={{ color: "var(--vx-warning)" }} />
                <span style={{ fontSize: 13, color: "#A0A0A0" }}>Couldn't load this message.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose */}
      {composing && (
        <div className="overlay" onClick={() => !sendingCompose && setComposing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">New Message</div>
                <h2 style={{ fontSize: 18 }}>Compose</h2>
              </div>
              <button className="close-button" onClick={() => !sendingCompose && setComposing(false)} disabled={sendingCompose}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="field"><label>To</label><input placeholder="customer@email.com" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} /></div>
              <div className="field"><label>Subject</label><input placeholder="Subject" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} /></div>
              <div className="field"><label>Message</label><textarea className="hx-mail-textarea" style={{ minHeight: 140 }} placeholder="Write your message…" value={compose.text} onChange={(e) => setCompose({ ...compose, text: e.target.value })} /></div>
            </div>
            <button className="gold-button form-submit" style={{ justifyContent: "center" }} onClick={sendCompose} disabled={sendingCompose}>
              {sendingCompose ? <Loader2 size={15} className="spin" /> : <Send size={15} />} Send
            </button>
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}