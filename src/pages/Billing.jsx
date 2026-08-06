import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, CreditCard, Receipt, DollarSign, Send, X, CheckCircle2, Clock, FileText } from "lucide-react";
import MaintenanceSubscriptions from "@/components/billing/MaintenanceSubscriptions";
import ResponsiveSelect from "@/components/vq/ResponsiveSelect";

const TYPE_LABEL = { deposit: "Deposit", final: "Final Invoice" };
const STATUS_STYLE = {
  draft: { color: "#707070", bg: "var(--vx-panel)" },
  pending: { color: "#ffd200", bg: "rgba(255,210,0,.08)" },
  paid: { color: "var(--vx-accent)", bg: "var(--vx-accent-soft)" },
  void: { color: "var(--vx-danger)", bg: "rgba(255,82,88,.08)" },
};

export default function Billing() {
  const [invoices, setInvoices] = useState(null);
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [form, setForm] = useState({ lead_id: "", work_order_id: "", type: "deposit", amount: "", description: "", due_date: "" });

  const notify = (msg) => { const t = document.createElement("div"); t.className = "vx-toast"; t.textContent = msg; t.style.cssText = "position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:200"; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

  const load = async () => {
    try {
      const [inv, ld, wos] = await Promise.all([
        base44.entities.Invoice.list("-created_date", 100),
        base44.entities.Lead.list("-created_date", 50),
        base44.entities.WorkOrder.list("-created_date", 50),
      ]);
      setInvoices(inv);
      setLeads(ld);
      setWorkOrders(wos || []);
    } catch { setInvoices([]); }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const createInvoice = async () => {
    if (!form.amount || parseFloat(form.amount) < 0.5) { notify("Amount must be at least $0.50"); return; }
    const lead = leads.find((l) => l.id === form.lead_id);
    try {
      const wo = workOrders.find((w) => w.id === form.work_order_id);
      await base44.entities.Invoice.create({
        lead_id: form.lead_id || wo?.lead_id || null,
        work_order_id: form.work_order_id || null,
        customer_name: wo?.customer_name || lead?.customer_name || "Customer",
        customer_email: lead?.email || "",
        type: form.type,
        description: form.description || (form.type === "deposit" ? "Project deposit" : "Final payment"),
        amount: parseFloat(form.amount),
        currency: "USD",
        status: "draft",
        due_date: form.due_date || null,
      });
      notify("Invoice created");
      setShowForm(false);
      setForm({ lead_id: "", work_order_id: "", type: "deposit", amount: "", description: "", due_date: "" });
      load();
    } catch (e) { notify("Create failed: " + e.message); }
  };

  const charge = async (inv) => {
    setBusy(inv.id);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId: inv.id });
      const data = res.data || res;
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        notify("Checkout failed: " + (data.error || "no redirect URL"));
        setBusy(null);
      }
    } catch (e) {
      notify("Checkout failed: " + (e?.response?.data?.error || e.message));
      setBusy(null);
    }
  };

  const remove = async (inv) => {
    if (inv.status === "pending" || inv.status === "paid") { notify("Can't delete a pending/paid invoice"); return; }
    await base44.entities.Invoice.delete(inv.id);
    load();
  };

  const totalPaid = (invoices || []).filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = (invoices || []).filter((i) => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="page hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Billing & Invoices</h1>
          <p>Collect deposits and final payments. Final invoices auto-complete the linked work order when paid.</p>
        </div>
        <button className="hx-mini-btn" onClick={() => setShowForm(true)}><Plus size={15} /> New</button>
      </div>

      <div className="hx-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="hx-stat"><DollarSign size={16} /><strong>${totalPaid.toLocaleString()}</strong><span>Paid</span></div>
        <div className="hx-stat"><Clock size={16} /><strong>${totalPending.toLocaleString()}</strong><span>Pending</span></div>
        <div className="hx-stat"><Receipt size={16} /><strong>{(invoices || []).length}</strong><span>Total</span></div>
      </div>

      <div className="hx-list">
        {!invoices ? <div className="hx-loading"><Loader2 className="spin" size={20} /></div> :
         invoices.length === 0 ? <div className="hx-empty"><span>🧾</span>No invoices yet. Create a deposit or final invoice to start collecting payments.</div> :
         invoices.map((inv) => {
           const st = STATUS_STYLE[inv.status] || STATUS_STYLE.draft;
           return (
             <div key={inv.id} className="hx-sys-card">
               <div className="hx-sys-head">
                 <div className="hx-sys-title">
                   <div className="hx-sys-icon">{inv.type === "final" ? <FileText size={18} /> : <CreditCard size={18} />}</div>
                   <div>
                     <strong>{TYPE_LABEL[inv.type]} — {inv.customer_name}</strong>
                     <span>${(inv.amount || 0).toLocaleString()} · {inv.description || ""}</span>
                   </div>
                 </div>
                 <span className="hx-sys-chip" style={{ color: st.color, background: st.bg, borderColor: st.color }}>{inv.status}</span>
               </div>
               <div className="hx-bid-controls" style={{ marginTop: 8 }}>
                 {inv.status === "draft" && (
                   <button className="gold-button" style={{ justifyContent: "center", flex: 1 }} onClick={() => charge(inv)} disabled={busy === inv.id}>
                     {busy === inv.id ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Charge Customer
                   </button>
                 )}
                 {inv.status === "pending" && (
                   <button className="hx-sys-edit" style={{ justifyContent: "center", flex: 1 }} onClick={() => charge(inv)} disabled={busy === inv.id}>
                     {busy === inv.id ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Resend Checkout Link
                   </button>
                 )}
                 {inv.status === "paid" && (
                   <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--vx-accent)", fontSize: 12, fontWeight: 700, flex: 1, justifyContent: "center" }}>
                     <CheckCircle2 size={14} /> Paid {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ""}
                   </div>
                 )}
                 {(inv.status === "draft" || inv.status === "void") && (
                   <button className="hx-lead-delete" onClick={() => remove(inv)}><Trash2 size={14} /></button>
                 )}
               </div>
             </div>
           );
         })}
      </div>

      <MaintenanceSubscriptions leads={leads} workOrders={workOrders} notify={notify} />

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><div className="eyebrow">Billing</div><h2>New Invoice</h2></div>
              <button className="close-button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Linked Work Order (optional)</label>
                <ResponsiveSelect
                  value={form.work_order_id}
                  onValueChange={(v) => set("work_order_id", v)}
                  options={[{ value: "", label: "— None —" }, ...workOrders.map((w) => ({ value: w.id, label: `${w.customer_name || "Untitled"}${w.project_address ? ` · ${w.project_address}` : ""}` }))]}
                />
              </div>
              <div className="field"><label>Linked Lead (optional)</label>
                <ResponsiveSelect
                  value={form.lead_id}
                  onValueChange={(v) => set("lead_id", v)}
                  options={[{ value: "", label: "— None —" }, ...leads.map((l) => ({ value: l.id, label: `${l.customer_name}${l.project_address ? ` · ${l.project_address}` : ""}` }))]}
                />
              </div>
              <div className="field"><label>Type</label>
                <ResponsiveSelect
                  value={form.type}
                  onValueChange={(v) => set("type", v)}
                  options={[{ value: "deposit", label: "Deposit" }, { value: "final", label: "Final Invoice" }]}
                />
              </div>
              <div className="field"><label>Amount (USD)</label><input type="number" min="0.5" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" /></div>
              <div className="field"><label>Due Date (optional)</label><input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
              <div className="field"><label>Description</label><input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={form.type === "deposit" ? "Project deposit" : "Final payment"} /></div>
              <button className="gold-button form-submit" onClick={createInvoice}><Plus size={15} /> Create Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}