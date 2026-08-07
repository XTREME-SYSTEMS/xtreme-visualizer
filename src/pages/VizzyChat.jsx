import React, { useEffect, useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Plus, Send, ArrowLeft, MessageSquare } from "lucide-react";
import MessageBubble from "@/components/vizzy/MessageBubble";

const AGENT_NAME = "vizzy";

export default function VizzyChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(list || []);
      if (list && list.length > 0) {
        const latest = list[0];
        setActiveId(latest.id);
        setActiveConversation(latest);
        setMessages(latest.messages || []);
        setShowList(false);
      } else {
        setShowList(true);
      }
    } catch (e) {
      setShowList(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeId, (data) => {
      setMessages(data.messages || []);
      if (data.messages && data.messages.length > 0) {
        const last = data.messages[data.messages.length - 1];
        if (last.role === "assistant" && last.content && !last.tool_calls?.some((tc) => tc.status === "pending" || tc.status === "running" || tc.status === "in_progress")) {
          setSending(false);
        }
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [activeId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewChat = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: "New Chat", description: "New conversation with Vizzy" },
      });
      setActiveId(conv.id);
      setActiveConversation(conv);
      setMessages(conv.messages || []);
      setShowList(false);
      setConversations((prev) => [conv, ...(prev || [])]);
    } catch (e) {
      setMessages([]);
      setShowList(false);
    }
  };

  const selectConversation = async (conv) => {
    setActiveId(conv.id);
    setActiveConversation(conv);
    setMessages(conv.messages || []);
    setShowList(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    let conv = activeConversation;
    if (!conv) {
      try {
        conv = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: text.slice(0, 40), description: "New conversation with Vizzy" },
        });
        setActiveId(conv.id);
        setActiveConversation(conv);
        setConversations((prev) => [conv, ...(prev || [])]);
      } catch (e) {
        return;
      }
    }

    setSending(true);
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } catch (e) {
      setSending(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't send that message. Please try again." },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const pickSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: "grid", placeItems: "center", background: "var(--vx-accent-soft)", border: "1px solid #8A7300" }}>
          <Sparkles style={{ width: 24, height: 24, color: "var(--vx-accent)" }} />
        </div>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--vx-border)", borderTopColor: "var(--vx-accent)", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 13, color: "var(--vx-muted)" }}>Starting Vizzy…</p>
      </div>
    );
  }

  if (showList) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0, padding: "0 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: "var(--vx-accent-soft)", border: "1px solid #8A7300" }}>
              <Sparkles style={{ width: 19, height: 19, color: "var(--vx-accent)" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>Vizzy AI</h1>
              <p style={{ fontSize: 12, color: "var(--vx-muted)", margin: 0 }}>Your autonomous copilot</p>
            </div>
          </div>
        </div>

        <button
          onClick={startNewChat}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 48,
            borderRadius: 12,
            border: "1px solid var(--vx-accent)",
            background: "linear-gradient(180deg, #FFB800, #FFD60A)",
            color: "#1A1A1A",
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          <Plus style={{ width: 18, height: 18 }} />
          Start new chat
        </button>

        {conversations.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--vx-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Recent conversations
            </p>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--vx-border-soft)",
                    background: "var(--vx-panel)",
                    color: "var(--vx-text)",
                    textAlign: "left",
                  }}
                >
                  <MessageSquare style={{ width: 18, height: 18, color: "var(--vx-accent)", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conv.metadata?.name || "Untitled chat"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0, padding: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px 10px", borderBottom: "1px solid var(--vx-border-soft)", flexShrink: 0 }}>
        <button
          onClick={() => setShowList(true)}
          style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--vx-border)", background: "var(--vx-panel)", color: "var(--vx-text)", display: "grid", placeItems: "center", flexShrink: 0 }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--vx-accent-soft)", border: "1px solid #8A7300", flexShrink: 0 }}>
          <Sparkles style={{ width: 18, height: 18, color: "var(--vx-accent)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Vizzy AI</h1>
          <p style={{ fontSize: 11, color: "var(--vx-muted)", margin: 0 }}>
            {sending ? "Thinking…" : "Autonomous copilot"}
          </p>
        </div>
        <button
          onClick={startNewChat}
          style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--vx-border)", background: "var(--vx-panel)", color: "var(--vx-accent)", display: "grid", placeItems: "center", flexShrink: 0 }}
        >
          <Plus style={{ width: 18, height: 18 }} />
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "12px 12px 4px",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          scrollbarWidth: "none",
        }}
      >
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, textAlign: "center", padding: "0 20px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, display: "grid", placeItems: "center", background: "var(--vx-accent-soft)", border: "1px solid #8A7300" }}>
              <Sparkles style={{ width: 28, height: 28, color: "var(--vx-accent)" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>Ask Vizzy anything</h2>
              <p style={{ fontSize: 13, color: "var(--vx-muted)", margin: 0, lineHeight: 1.5 }}>
                I can manage your leads, create quotes, schedule appointments, send emails, track job costs, and operate your entire app.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 320 }}>
              {[
                "Show me my new leads",
                "What does my pipeline look like?",
                "Schedule a site visit for tomorrow",
                "Check my Gmail inbox",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => pickSuggestion(suggestion)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--vx-border-soft)",
                    background: "var(--vx-panel)",
                    color: "var(--vx-text)",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {sending && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ padding: "12px 16px", borderRadius: 14, background: "var(--vx-panel-2)", border: "1px solid var(--vx-border-soft)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--vx-accent)", animation: "spin 0.8s linear infinite" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--vx-accent)", opacity: 0.6 }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--vx-accent)", opacity: 0.3 }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "8px 12px 10px", borderTop: "1px solid var(--vx-border-soft)", flexShrink: 0, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Vizzy…"
          rows={1}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 120,
            padding: "11px 14px",
            borderRadius: 12,
            border: "1px solid var(--vx-border)",
            background: "var(--vx-panel-2)",
            color: "var(--vx-text)",
            fontSize: 14,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "1px solid var(--vx-accent)",
            background: "linear-gradient(180deg, #FFB800, #FFD60A)",
            color: "#1A1A1A",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            opacity: !input.trim() || sending ? 0.4 : 1,
            cursor: !input.trim() || sending ? "not-allowed" : "pointer",
          }}
        >
          <Send style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </div>
  );
}