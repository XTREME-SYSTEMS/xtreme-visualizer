import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, XCircle } from "lucide-react";

function formatToolName(name) {
  return (name || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status;
  const isError = status === "failed" || status === "error";
  const isRunning = status === "pending" || status === "running" || status === "in_progress";

  let parsedResults = null;
  try {
    parsedResults = typeof toolCall.results === "string" ? JSON.parse(toolCall.results) : toolCall.results;
  } catch {
    parsedResults = toolCall.results;
  }

  let parsedArgs = null;
  try {
    parsedArgs = typeof toolCall.arguments_string === "string" ? JSON.parse(toolCall.arguments_string) : toolCall.arguments_string;
  } catch {
    parsedArgs = toolCall.arguments_string;
  }

  const projection = toolCall.display_projection || {};
  const hideDetails = projection.hide_details && projection.details_redacted;
  const label = projection.label || formatToolName(toolCall.name);
  const activeLabel = projection.active_label || label;
  const errorLabel = projection.error_label || label;
  const displayLabel = isError ? errorLabel : isRunning ? activeLabel : label;

  return (
    <div
      style={{
        marginTop: 8,
        fontSize: 12,
        borderRadius: 10,
        border: `1px solid ${isError ? "var(--vx-danger)" : "var(--vx-border-soft)"}`,
        background: "var(--vx-panel)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 10px",
          border: 0,
          background: "transparent",
          color: "var(--vx-text)",
          textAlign: "left",
          cursor: hideDetails ? "default" : "pointer",
        }}
      >
        {isError ? (
          <XCircle style={{ width: 14, height: 14, color: "var(--vx-danger)", flexShrink: 0 }} />
        ) : isRunning ? (
          <Loader2 style={{ width: 14, height: 14, color: "var(--vx-accent)", flexShrink: 0, animation: "spin 0.8s linear infinite" }} />
        ) : (
          <CheckCircle2 style={{ width: 14, height: 14, color: "var(--vx-accent)", flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, color: isRunning ? "var(--vx-muted)" : "var(--vx-text)", fontWeight: 600 }}>
          {displayLabel}
          {isRunning && "…"}
        </span>
        {!hideDetails &&
          (expanded ? (
            <ChevronDown style={{ width: 14, height: 14, color: "var(--vx-faint)" }} />
          ) : (
            <ChevronRight style={{ width: 14, height: 14, color: "var(--vx-faint)" }} />
          ))}
      </button>
      {expanded && !hideDetails && (
        <div style={{ padding: "0 10px 10px", borderTop: "1px solid var(--vx-border-soft)" }}>
          {parsedArgs != null && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--vx-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Parameters
              </div>
              <pre style={{ margin: 0, fontSize: 11, color: "var(--vx-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflow: "auto" }}>
                {JSON.stringify(parsedArgs, null, 2)}
              </pre>
            </div>
          )}
          {parsedResults != null && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--vx-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Result
              </div>
              <pre style={{ margin: 0, fontSize: 11, color: "var(--vx-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflow: "auto" }}>
                {JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div
        style={{
          maxWidth: "85%",
          padding: isUser ? "10px 14px" : "12px 14px",
          borderRadius: 14,
          background: isUser ? "var(--vx-accent)" : "var(--vx-panel-2)",
          color: isUser ? "#1A1A1A" : "var(--vx-text)",
          border: isUser ? "none" : "1px solid var(--vx-border-soft)",
        }}
      >
        {message.content &&
          (isUser ? (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{message.content}</p>
          ) : (
            <div className="vizzy-markdown" style={{ fontSize: 14, lineHeight: 1.5 }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: "0 0 8px", paddingLeft: 18 }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                  h1: ({ children }) => <h3 style={{ fontSize: 15, margin: "8px 0 4px" }}>{children}</h3>,
                  h2: ({ children }) => <h3 style={{ fontSize: 15, margin: "8px 0 4px" }}>{children}</h3>,
                  h3: ({ children }) => <h4 style={{ fontSize: 14, margin: "6px 0 3px" }}>{children}</h4>,
                  strong: ({ children }) => <strong style={{ color: "var(--vx-accent)" }}>{children}</strong>,
                  code: ({ children }) => (
                    <code style={{ fontSize: 12, padding: "1px 4px", borderRadius: 4, background: "var(--vx-panel-3)" }}>{children}</code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ))}
        {message.tool_calls?.map((tc, i) => (
          <FunctionDisplay key={i} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}