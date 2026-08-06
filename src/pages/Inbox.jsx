import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Sparkles, Send, Mail } from "lucide-react";

function initials(name = "") {
  const parts = name.split(" ").filter(Boolean);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export default function Inbox() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reading, setReading] = useState(false);
  const [reply, setReply] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("gmail", { action: "list" });
      setItems(res.data?.items || []);
      setConnected(true);
    } catch {
      setConnected(false);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInbox(); }, []);

  const open = async (id) => {
    setActiveId(id);
    setDetail(null);
    setReading(true);
    setReply("");
    try {
      const res = await base44.functions.invoke("gmail", { action: "read", id });
      setDetail(res.data);
    } finally {
      setReading(false);
    }
  };

  const draftReply = async () => {
    if (!detail) return;
    setDrafting(true);
    try {
      const out = await base44.integrations.Core.InvokeLLM({
        prompt: `A flooring contractor received this email. Draft a professional, concise reply that addresses the customer's question, offers clear next steps, and never promises a final price, fixed date, or warranty. Sign off as the contractor. Keep under 180 words.\n\nFrom: ${detail.from}\nSubject: ${detail.subject}\n\nEmail:\n${detail.body}`,
      });
      setReply(String(out));
    } finally {
      setDrafting(false);
    }
  };

  const send = async () => {
    setSending(true);
    try {
      const to = (detail.from || "").match(/<([^>]+)>/)?.[1] || detail.from;
      const subject = detail.subject?.startsWith("Re:") ? detail.subject : `Re: ${detail.subject || ""}`;
      const res = await base44.functions.invoke("gmail", { action: "send", to, subject, text: reply });
      if (res.data?.ok) toast({ title: "Reply sent." });
      else toast({ title: res.data?.error || "Send failed", variant: "destructive" });
    } catch {
      toast({ title: "Send failed — is Gmail connected?", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page hx-page">
      <div className="hx-page-head">
        <div>
          <h1>Inbox</h1>
          <p>Customer questions, proposal activity, and follow-ups.</p>
        </div>
        <button className="hx-icon-btn" onClick={fetchInbox} disabled={loading} aria-label="Refresh">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </div>

      {!connected ? (
        <div className="hx-notice">Connect your Gmail in Settings to read and reply to customer emails here.</div>
      ) : (
        <div className="hx-list">
          {loading && !items && <div className="hx-loading"><Loader2 size={24} /></div>}
          {items && items.length === 0 && !loading && (
            <div className="hx-empty"><div><span>0</span>No messages found.</div></div>
          )}
          {items?.map((m) => (
            <button key={m.id} className={`hx-mail-row ${activeId === m.id ? "active" : ""}`} onClick={() => open(m.id)}>
              <span className="hx-mail-avatar">{initials(m.from)}</span>
              <span className="hx-mail-info">
                <strong>{m.from}</strong>
                <p>{m.snippet || m.subject}</p>
              </span>
              <time>{m.date || ""}</time>
            </button>
          ))}
        </div>
      )}

      {activeId && detail && (
        <div className="hx-mail-detail">
          <div className="hx-mail-detail-head">
            <strong>{detail.subject}</strong>
            <button className="hx-icon-btn" onClick={() => { setActiveId(null); setDetail(null); }}>✕</button>
          </div>
          <p className="hx-mail-body">{detail.body}</p>
          <div className="hx-mail-actions">
            <button className="hx-mini-btn" onClick={draftReply} disabled={drafting}>
              {drafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Draft AI reply
            </button>
            <button className="hx-mini-btn dark" onClick={send} disabled={!reply || sending}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send reply
            </button>
          </div>
          {reply && (
            <textarea
              className="hx-mail-textarea"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
          )}
        </div>
      )}
    </div>
  );
}