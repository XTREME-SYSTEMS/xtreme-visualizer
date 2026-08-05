import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Sparkles, Send, Check } from "lucide-react";

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

  useEffect(() => {
    fetchInbox();
  }, []);

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
    } catch (e) {
      toast({ title: "Send failed — is Gmail connected?", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Inbox</h1>
          <p>Customer questions, proposal activity, and follow-up conversations.</p>
        </div>
        <button className="icon-button" onClick={fetchInbox} disabled={loading} aria-label="Refresh">
          {loading ? <Loader2 size={22} className="animate-spin" /> : <RefreshCw size={22} />}
        </button>
      </div>
      {!connected ? (
        <div className="content-card">
          <div className="guardrail">Connect your Gmail in Settings to read and reply to customer emails here.</div>
        </div>
      ) : (
        <div className="content-card">
          <div className="message-list">
            {items?.length === 0 && !loading && <div className="empty">No messages found.</div>}
            {items?.map((m) => (
              <button key={m.id} className="message" onClick={() => open(m.id)}>
                <span className="avatar">{initials(m.from)}</span>
                <span>
                  <strong>{m.from}</strong>
                  <p>{m.snippet || m.subject}</p>
                </span>
                <time>{m.date || ""}</time>
              </button>
            ))}
          </div>
          {activeId && (
            <div style={{ marginTop: 20 }}>
              {reading ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Loader2 className="animate-spin" size={22} />
                </div>
              ) : detail ? (
                <div>
                  <div className="guardrail" style={{ marginBottom: 12 }}>
                    <strong>{detail.subject}</strong>
                    <br />
                    {detail.body}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="gold-button" onClick={draftReply} disabled={drafting} style={{ minHeight: 44, fontSize: 13 }}>
                      {drafting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Draft AI reply
                    </button>
                    <button className="gold-button" onClick={send} disabled={!reply || sending} style={{ minHeight: 44, fontSize: 13, background: "#111", color: "#fff" }}>
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send reply
                    </button>
                  </div>
                  {reply && (
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      style={{ width: "100%", minHeight: 140, marginTop: 12, borderRadius: 13, border: "1px solid var(--xv-line)", padding: 12, fontSize: 13 }}
                    />
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </>
  );
}