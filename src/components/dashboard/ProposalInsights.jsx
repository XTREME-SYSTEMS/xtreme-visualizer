import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

export default function ProposalInsights({ leads }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setInsights(null);
    try {
      const won = leads.filter((l) => l.status === "won");
      const lost = leads.filter((l) => l.status === "lost");

      const wonData = won.map((l) => ({
        customer: l.customer_name, sqft: l.square_feet, floorType: l.floor_type,
        estimateLow: l.estimate_low, estimateHigh: l.estimate_high, proposal: l.proposal_total,
        source: l.source, spaceType: l.space_type,
      }));
      const lostData = lost.map((l) => ({
        customer: l.customer_name, sqft: l.square_feet, floorType: l.floor_type,
        estimateLow: l.estimate_low, estimateHigh: l.estimate_high, proposal: l.proposal_total,
        source: l.source, spaceType: l.space_type,
      }));

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these flooring contractor proposals. Compare WON vs LOST to find patterns and suggest scope/price adjustments.

WON jobs (${wonData.length}):
${JSON.stringify(wonData, null, 2)}

LOST jobs (${lostData.length}):
${JSON.stringify(lostData, null, 2)}

Provide a concise analysis with:
1. Win rate by floor type
2. Average proposal amount: won vs lost
3. Price sensitivity patterns (do lost jobs have higher estimates?)
4. Top 3 actionable recommendations to improve close rate
5. Optimal price range recommendation by floor type

Keep it under 300 words, use bullet points.`,
        response_json_schema: {
          type: "object",
          properties: {
            winRate: { type: "string" },
            avgWon: { type: "string" },
            avgLost: { type: "string" },
            patterns: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            optimalRange: { type: "string" },
          },
        },
      });
      setInsights(res);
    } catch (e) {
      setInsights({ error: e.message || "Analysis failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hx-sys-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 12, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={14} /> AI Proposal Optimization
        </h3>
        <button className="hx-mini-btn" onClick={analyze} disabled={loading || !leads?.length}>
          {loading ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />} Analyze
        </button>
      </div>
      {insights && !insights.error && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={{ padding: 8, borderRadius: 8, background: "var(--vx-panel)", border: "1px solid var(--vx-border-soft)" }}>
              <div style={{ fontSize: 10, color: "var(--vx-muted)", textTransform: "uppercase" }}>Win Rate</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--vx-accent)" }}>{insights.winRate || "—"}</div>
            </div>
            <div style={{ padding: 8, borderRadius: 8, background: "var(--vx-panel)", border: "1px solid var(--vx-border-soft)" }}>
              <div style={{ fontSize: 10, color: "var(--vx-muted)", textTransform: "uppercase" }}>Avg Won</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--vx-accent)" }}>{insights.avgWon || "—"}</div>
            </div>
            <div style={{ padding: 8, borderRadius: 8, background: "var(--vx-panel)", border: "1px solid var(--vx-border-soft)" }}>
              <div style={{ fontSize: 10, color: "var(--vx-muted)", textTransform: "uppercase" }}>Avg Lost</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--vx-danger)" }}>{insights.avgLost || "—"}</div>
            </div>
          </div>
          {insights.patterns?.length > 0 && (
            <div>
              <strong style={{ fontSize: 11, color: "var(--vx-muted)" }}>Patterns:</strong>
              {insights.patterns.map((p, i) => <p key={i} style={{ fontSize: 11, color: "var(--vx-text)", margin: "2px 0 0" }}>• {p}</p>)}
            </div>
          )}
          {insights.recommendations?.length > 0 && (
            <div>
              <strong style={{ fontSize: 11, color: "var(--vx-accent)" }}>Recommendations:</strong>
              {insights.recommendations.map((r, i) => <p key={i} style={{ fontSize: 11, color: "var(--vx-text)", margin: "2px 0 0" }}>• {r}</p>)}
            </div>
          )}
          {insights.optimalRange && (
            <div style={{ padding: 8, borderRadius: 8, background: "rgba(156,255,0,.06)", border: "1px solid var(--vx-accent)" }}>
              <strong style={{ fontSize: 11, color: "var(--vx-accent)" }}>Optimal Range: </strong>
              <span style={{ fontSize: 11, color: "var(--vx-text)" }}>{insights.optimalRange}</span>
            </div>
          )}
        </div>
      )}
      {insights?.error && <p style={{ fontSize: 11, color: "var(--vx-danger)" }}>{insights.error}</p>}
    </div>
  );
}