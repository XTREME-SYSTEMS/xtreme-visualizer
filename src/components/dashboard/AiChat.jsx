import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AiChat({ contextSummary }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Ask me anything about your business metrics, leads, pipeline, or how to improve your close rate." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    const next = [...messages, { role: "user", content: userMsg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history = next.map((m) => `${m.role}: ${m.content}`).join("\n");
      const prompt = `You are an AI business analyst for a floor coating contractor app. Here is the current business data:\n${contextSummary}\n\nConversation so far:\n${history}\n\nRespond concisely and helpfully as the assistant. Use the data to give specific, actionable insights.`;
      const reply = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't process that right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hx-sys-card" style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0, flex: 1 }}>
      <div className="hx-section-head">
        <h2 style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={16} style={{ color: "var(--vx-accent)" }} /> AI Business Analyst</h2>
      </div>
      <div ref={scrollRef} style={{ flex: 1, minHeight: 120, maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", padding: "9px 13px", borderRadius: 12, fontSize: 13, lineHeight: 1.45, background: m.role === "user" ? "var(--vx-accent-soft)" : "var(--vx-panel)", border: `1px solid ${m.role === "user" ? "var(--vx-accent)" : "var(--vx-border-soft)"}`, color: m.role === "user" ? "var(--vx-accent)" : "var(--vx-text)", whiteSpace: "pre-wrap" }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ alignSelf: "flex-start", padding: "9px 13px" }}><Loader2 size={16} className="spin" style={{ color: "var(--vx-accent)" }} /></div>}
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <input className="hx-scraper-input" placeholder="Ask about your metrics…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} style={{ flex: 1 }} />
        <button className="gold-button" style={{ justifyContent: "center" }} onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}