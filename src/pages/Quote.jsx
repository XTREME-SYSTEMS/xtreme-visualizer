import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Save, FileText, Loader2 } from "lucide-react";
import { Card, Chip, EmptyState, Kicker, Notice, PageHeader, Btn, Field } from "@/components/vx/Primitives";
import QuoteLineEditor from "@/components/quote/QuoteLineEditor";
import { useVisualX } from "@/components/vx/VisualXContext";
import { baseLineItems, money, quoteTotals, receipt } from "@/lib/vx";

export default function Quote() {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    (async () => {
      if (session.quoteId) {
        const existing = await base44.entities.Quote.filter({ id: session.quoteId }, "-updated_date", 1);
        if (existing[0]) {
          setDraft(existing[0]);
          setLoading(false);
          return;
        }
      }
      const [latest] = await base44.entities.Quote.list("-updated_date", 1);
      setDraft(latest || null);
      setLoading(false);
    })();
  }, [session.quoteId]);

  const startDraft = async () => {
    const [system] = await base44.entities.FloorSystem.filter({ slug: session.systemSlug }, "name", 1);
    const [lead] = session.leadId
      ? await base44.entities.Lead.filter({ id: session.leadId }, "-updated_date", 1)
      : await base44.entities.Lead.list("-updated_date", 1);
    setDraft({
      customer_name: lead?.customer_name || "",
      address: lead?.project_address || "",
      lead_id: lead?.id,
      square_feet: session.squareFeet || lead?.square_feet || 0,
      system_name: system?.name || "",
      margin_percent: 25,
      line_items: baseLineItems(session.squareFeet || lead?.square_feet || 0, system),
      status: "internal_draft",
    });
  };

  if (loading) {
    return (
      <Card className="text-xs" style={{ color: "var(--vx-faint)" }}>
        Loading quote drafts…
      </Card>
    );
  }

  if (!draft) {
    return (
      <div className="space-y-4">
        <PageHeader title="Smart Quote" subtitle="Draft pricing workspace" />
        <EmptyState
          title="No quote yet"
          text="Create a quote and enter operator-approved line items. Customer-facing pricing stays disabled until a source and approver are recorded."
          action={
            <Btn className="mt-1" onClick={startDraft}>
              <Plus className="h-4 w-4" /> Create Quote Draft
            </Btn>
          }
        />
      </div>
    );
  }

  const items = draft.line_items || [];
  const totals = quoteTotals(items, draft.margin_percent);
  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const setItem = (index, item) =>
    set("line_items", items.map((x, i) => (i === index ? item : x)));

  const save = async () => {
    setBusy("save");
    const payload = {
      ...draft,
      subtotal: totals.subtotal,
      margin_amount: totals.margin,
      total: totals.total,
      range_low: totals.low,
      range_high: totals.high,
      status: draft.price_source && draft.approver ? "approved_internal" : "internal_draft",
    };
    const saved = draft.id
      ? await base44.entities.Quote.update(draft.id, payload)
      : await base44.entities.Quote.create(payload);
    patch({ quoteId: saved.id });
    setDraft(saved);
    await receipt({
      action: draft.id ? "quote_updated" : "quote_created",
      detail: `Quote ${saved.id} saved as ${payload.status}. Subtotal ${money.format(totals.subtotal)}.`,
      category: "quote",
      lead_id: draft.lead_id,
    });
    setBusy("");
  };

  const generateProposal = async () => {
    setBusy("proposal");
    let quote = draft;
    if (!draft.id) {
      quote = await base44.entities.Quote.create({
        ...draft,
        subtotal: totals.subtotal,
        margin_amount: totals.margin,
        total: totals.total,
        range_low: totals.low,
        range_high: totals.high,
      });
      patch({ quoteId: quote.id });
      setDraft(quote);
    }
    const proposal = await base44.entities.Proposal.create({
      quote_id: quote.id,
      lead_id: quote.lead_id,
      reference: `PRO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
      customer_name: quote.customer_name || "Customer",
      address: quote.address,
      system: quote.system_name || "System pending",
      timeline: "Schedule pending operator approval",
      warranty: "Could not verify. Final contractor terms required.",
      total: totals.total,
      scope_summary: items.map((i) => `${i.name}: ${i.description || ""}`).join("\n"),
      status: "draft",
      signature_status: "not_requested",
    });
    patch({ proposalId: proposal.id });
    await receipt({
      action: "proposal_generated",
      detail: `Proposal ${proposal.reference} generated from quote ${quote.id}. Delivery remains disabled.`,
      category: "proposal",
      lead_id: quote.lead_id,
    });
    setBusy("");
    navigate("/app/proposal");
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <Kicker>Project</Kicker>
        <input
          className="vx-input"
          value={draft.customer_name || ""}
          placeholder="Customer name"
          onChange={(e) => set("customer_name", e.target.value)}
        />
        <input
          className="vx-input"
          value={draft.address || ""}
          placeholder="Project address"
          onChange={(e) => set("address", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Square feet">
            <input
              className="vx-input"
              type="number"
              value={draft.square_feet ?? ""}
              onChange={(e) => set("square_feet", Number(e.target.value))}
            />
          </Field>
          <Field label="Margin %">
            <input
              className="vx-input"
              type="number"
              value={draft.margin_percent ?? ""}
              onChange={(e) => set("margin_percent", Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone="draft">{draft.status === "approved_internal" ? "Approved internal" : "Internal draft"}</Chip>
          <Chip tone="blocked">Customer-facing pricing disabled</Chip>
        </div>
      </Card>

      <Kicker>Line items</Kicker>
      <div className="space-y-2">
        {items.map((item, i) => (
          <QuoteLineEditor
            key={i}
            item={item}
            index={i}
            onChange={setItem}
            onRemove={(index) => set("line_items", items.filter((_, x) => x !== index))}
          />
        ))}
      </div>
      <button
        onClick={() => set("line_items", [...items, { name: "", description: "", quantity: 0, rate: 0 }])}
        className="flex items-center gap-1.5 text-[11px] font-semibold"
        style={{ color: "var(--vx-accent)" }}
      >
        <Plus className="h-3.5 w-3.5" /> Add line item
      </button>

      <Card className="space-y-2 text-sm">
        <div className="flex justify-between" style={{ color: "var(--vx-muted)" }}>
          <span className="text-[11px] font-semibold uppercase tracking-wide">Subtotal</span>
          <strong>{money.format(totals.subtotal)}</strong>
        </div>
        <div className="flex justify-between" style={{ color: "var(--vx-muted)" }}>
          <span className="text-[11px] font-semibold uppercase tracking-wide">Margin</span>
          <strong>
            {Number(draft.margin_percent || 0)}% · {money.format(totals.margin)}
          </strong>
        </div>
        <div
          className="flex items-center justify-between border-t pt-2 text-base"
          style={{ borderColor: "var(--vx-border-soft)", color: "var(--vx-accent)" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide">Estimated total</span>
          <strong>{money.format(totals.total)}</strong>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: "var(--vx-panel-2)" }}>
          <Kicker>Estimated price range</Kicker>
          <strong className="block text-lg" style={{ color: "var(--vx-text)" }}>
            {money.format(totals.low)} – {money.format(totals.high)}
          </strong>
          <span className="text-[10px]" style={{ color: "var(--vx-faint)" }}>
            Internal estimate until product, labor, tax, and freight sources are approved.
          </span>
        </div>
      </Card>

      <Card className="space-y-2">
        <Kicker>Approval record</Kicker>
        <input
          className="vx-input"
          value={draft.price_source || ""}
          placeholder="Price source (supplier quote, invoice, price list)"
          onChange={(e) => set("price_source", e.target.value)}
        />
        <input
          className="vx-input"
          value={draft.approver || ""}
          placeholder="Approver name"
          onChange={(e) => set("approver", e.target.value)}
        />
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Btn variant="outline" onClick={save} disabled={busy === "save"}>
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
        </Btn>
        <Btn onClick={generateProposal} disabled={busy === "proposal" || !draft.customer_name}>
          {busy === "proposal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Generate Proposal
        </Btn>
      </div>

      <Notice>
        Quotes stay internal drafts until a current price source and an approver are recorded. Taxes, freight, and
        schedule are not included.
      </Notice>
    </div>
  );
}