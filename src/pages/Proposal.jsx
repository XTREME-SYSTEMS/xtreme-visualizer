import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import jsPDF from "jspdf";
import { Link2, Download, PenLine, ShieldAlert, Loader2 } from "lucide-react";
import { Card, Chip, EmptyState, Kicker, Notice, PageHeader, Btn } from "@/components/vx/Primitives";
import { useVisualX } from "@/components/vx/VisualXContext";
import { money, receipt } from "@/lib/vx";

export default function ProposalPage() {
  const navigate = useNavigate();
  const { session, patch } = useVisualX();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [signerName, setSignerName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (session.proposalId) {
        const [found] = await base44.entities.Proposal.filter({ id: session.proposalId }, "-updated_date", 1);
        if (found) {
          setProposal(found);
          setLoading(false);
          return;
        }
      }
      const [latest] = await base44.entities.Proposal.list("-updated_date", 1);
      setProposal(latest || null);
      setLoading(false);
    })();
  }, [session.proposalId]);

  const copyLink = async () => {
    const url = `${window.location.origin}/app/proposal`;
    await navigator.clipboard.writeText(url);
    setNote("Internal preview link copied. Customer delivery stays disabled.");
    await receipt({
      action: "proposal_link_copied",
      detail: "Operator copied the internal proposal preview link.",
      category: "proposal",
      lead_id: proposal?.lead_id,
    });
  };

  const downloadPdf = async () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const lines = [
      "VISUAL X PROPOSAL PREVIEW",
      `Reference: ${proposal.reference || proposal.id}`,
      `Customer: ${proposal.customer_name || "Customer"}`,
      `Address: ${proposal.address || "Address pending"}`,
      `System: ${proposal.system || "System pending"}`,
      `Timeline: ${proposal.timeline || "Pending operator approval"}`,
      `Warranty: ${proposal.warranty || "Requires contractor terms"}`,
      `Internal total: ${proposal.total ? money.format(proposal.total) : "Pending verification"}`,
      "",
      "SCOPE SUMMARY",
      ...String(proposal.scope_summary || "Scope pending").split("\n"),
      "",
      "PREVIEW ONLY. Pricing, warranty, availability, taxes, freight,",
      "schedule, and signature terms require final contractor approval.",
      "Legally binding e-signature and customer delivery are disabled.",
    ];
    doc.setFontSize(11);
    lines.forEach((line, i) => doc.text(String(line).slice(0, 95), 54, 64 + i * 18));
    doc.save(`${proposal.reference || "visual-x-proposal"}.pdf`);
    await receipt({
      action: "proposal_downloaded",
      detail: "Operator downloaded the non-binding proposal preview PDF.",
      category: "proposal",
      lead_id: proposal?.lead_id,
    });
  };

  const recordAck = async () => {
    if (!signerName.trim()) return;
    setBusy(true);
    await base44.entities.Signature.create({
      proposal_id: proposal.id,
      signer_name: signerName.trim(),
      status: "local_ack",
      signed_at: new Date().toISOString(),
      legally_binding: false,
    });
    const updated = await base44.entities.Proposal.update(proposal.id, {
      signature_status: "local_ack",
      signature_name: signerName.trim(),
      signed_at: new Date().toISOString(),
    });
    setProposal(updated);
    await receipt({
      action: "proposal_local_ack",
      detail: `Local, non-binding acknowledgement recorded for ${signerName.trim()}.`,
      category: "proposal",
      lead_id: proposal.lead_id,
    });
    setBusy(false);
    setNote("Local acknowledgement recorded. This is not a legally binding signature.");
  };

  if (loading) {
    return (
      <Card className="text-xs" style={{ color: "var(--vx-faint)" }}>
        Loading proposals…
      </Card>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-4">
        <PageHeader title="Proposal Share" subtitle="Non-binding preview" />
        <EmptyState
          title="No proposal draft"
          text="Generate a proposal from a saved quote. Customer delivery and legal e-signature remain disabled."
          action={
            <Btn className="mt-1" onClick={() => navigate("/app/quote")}>
              Open Smart Quote
            </Btn>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="overflow-hidden rounded-[var(--vx-radius)] border p-5"
        style={{
          borderColor: "var(--vx-border-soft)",
          background:
            "radial-gradient(120% 120% at 80% 0%, rgba(156,255,0,0.16), transparent 55%), var(--vx-panel)",
        }}
      >
        <Kicker>Proposal {proposal.reference || ""}</Kicker>
        <h1 className="mt-1 text-xl font-semibold" style={{ color: "var(--vx-text)" }}>
          {proposal.customer_name}
        </h1>
        <p className="text-[11px]" style={{ color: "var(--vx-muted)" }}>
          {proposal.address || "Address pending"}
        </p>
        <div className="mt-3">
          <Kicker>Internal total</Kicker>
          <strong className="block text-2xl" style={{ color: "var(--vx-accent)" }}>
            {proposal.total ? money.format(proposal.total) : "Pending verification"}
          </strong>
        </div>
      </div>

      {[
        ["Included system", proposal.system || "System pending"],
        ["Timeline", proposal.timeline || "Schedule pending operator approval"],
        ["Warranty", proposal.warranty || "Could not verify. Final contractor terms required."],
        ["Scope summary", proposal.scope_summary || "Scope pending"],
      ].map(([label, value]) => (
        <Card key={label} className="space-y-1">
          <Kicker>{label}</Kicker>
          <p className="whitespace-pre-line text-xs leading-relaxed" style={{ color: "var(--vx-muted)" }}>
            {value}
          </p>
        </Card>
      ))}

      <Card className="space-y-2">
        <Kicker>Signature</Kicker>
        <div className="flex flex-wrap gap-2">
          <Chip tone={proposal.signature_status === "local_ack" ? "ready" : "blocked"}>
            {proposal.signature_status === "local_ack"
              ? `Local acknowledgement · ${proposal.signature_name}`
              : "Not requested"}
          </Chip>
          <Chip tone="danger">Legal e-signature disabled</Chip>
        </div>
        <input
          className="vx-input"
          value={signerName}
          placeholder="Name for local acknowledgement"
          onChange={(e) => setSignerName(e.target.value)}
        />
        <Btn variant="outline" onClick={recordAck} disabled={busy || !signerName.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
          Record local acknowledgement
        </Btn>
      </Card>

      {note ? <Chip tone="progress">{note}</Chip> : null}

      <div className="grid grid-cols-3 gap-2">
        <Btn onClick={copyLink} className="px-2 text-xs">
          <Link2 className="h-4 w-4" /> Link
        </Btn>
        <Btn variant="outline" onClick={downloadPdf} className="px-2 text-xs">
          <Download className="h-4 w-4" /> PDF
        </Btn>
        <Btn variant="ghost" disabled title="Legal e-signature is not enabled" className="px-2 text-xs">
          <ShieldAlert className="h-4 w-4" /> E-Sign
        </Btn>
      </div>

      <Notice>
        <strong>Preview only.</strong> Pricing, warranty, product availability, taxes, freight, schedule, and signature
        terms require final contractor approval. Customer email and SMS delivery are disabled.
      </Notice>
    </div>
  );
}