import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, CreditCard, CheckCircle2, ExternalLink, DollarSign } from "lucide-react";

export default function DepositCheckout({ leadId }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const inv = await base44.entities.Invoice.filter({ lead_id: leadId, type: "deposit" }, "-created_date");
      setInvoice(inv?.[0] || null);
    } catch { setInvoice(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [leadId]);

  if (loading) return <div className="flex items-center gap-2 text-[12px] text-slate-500"><Loader2 size={14} className="animate-spin" /> Checking deposit status…</div>;

  if (!invoice) return <p className="text-[13px] text-slate-500">No deposit invoice yet. It auto-generates when the proposal is signed.</p>;

  const paid = invoice.status === "paid";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[13px] text-slate-900 flex items-center gap-1.5">
            {paid ? <CheckCircle2 size={14} className="text-emerald-600" /> : <DollarSign size={14} className="text-amber-600" />}
            Deposit · ${Number(invoice.amount).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">{invoice.description}</p>
        </div>
        <span className={`text-[11px] font-bold px-2 py-1 rounded ${paid ? "bg-emerald-100 text-emerald-700" : invoice.checkout_url ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
          {invoice.status}
        </span>
      </div>
      {!paid && invoice.checkout_url && (
        <a href={invoice.checkout_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
          <CreditCard size={14} /> Pay Deposit <ExternalLink size={12} />
        </a>
      )}
      {!paid && !invoice.checkout_url && (
        <Link to="/billing" className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:border-slate-400">
          <CreditCard size={14} /> Go to Billing to charge
        </Link>
      )}
    </div>
  );
}