import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, X, ClipboardList, Send, FolderTree, ExternalLink, Calendar, DollarSign, CheckCircle2, AlertTriangle, Camera, Package, Mail } from "lucide-react";

const STATUSES = ["draft", "assigned", "in_progress", "completed", "cancelled"];
const STATUS_COLORS = { draft: "#707070", assigned: "#43a9ff", in_progress: "#ffd000", completed: "#9cff00", cancelled: "#ff5258" };
const PHOTO_CATEGORIES = ["site_before", "prep", "primer", "base_coat", "color_install", "topcoat", "site_after"];

const empty = { project_id: "", customer_name: "", customer_email: "", customer_phone: "", project_address: "", crew_leader_name: "", scheduled_date: "", notes: "", scope_items: [], materials_list: [] };

export default function WorkOrderManager({ notify }) {
  const [orders, setOrders] = useState(null);
  const [leads, setLeads] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [photosByOrder, setPhotosByOrder] = useState({});
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [invBusy, setInvBusy] = useState(null);

  const load = async () => {
    const [ord, inv] = await Promise.all([
      base44.entities.WorkOrder.list("-created_date", 50).catch(() => []),
      base44.entities.Invoice.list("-created_date", 100).catch(() => []),
    ]);
    setOrders(ord);
    setInvoices(inv);
    // Load photo counts per order
    if (ord.length) {
      const counts = {};
      await Promise.all(ord.map(async (o) => {
        try {
          const photos = await base44.entities.FieldPhoto.filter({ work_order_id: o.id });
          counts[o.id] = photos.map((p) => p.category);
        } catch { counts[o.id] = []; }
      }));
      setPhotosByOrder(counts);
    }
  };
  useEffect(() => {
    load();
    base44.entities.Lead.list("-created_date", 100).then(setLeads).catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // --- Scope items ---
  const addScope = () => setForm((p) => ({ ...p, scope_items: [...p.scope_items, { label: "", detail: "" }] }));
  const setScope = (i, k, v) => setForm((p) => ({ ...p, scope_items: p.scope_items.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));
  const delScope = (i) => setForm((p) => ({ ...p, scope_items: p.scope_items.filter((_, idx) => idx !== i) }));

  // --- Materials ---
  const addMaterial = () => setForm((p) => ({ ...p, materials_list: [...p.materials_list, { name: "", qty: 1, unit: "gal", cost: 0 }] }));
  const setMaterial = (i, k, v) => setForm((p) => ({ ...p, materials_list: p.materials_list.map((m, idx) => idx === i ? { ...m, [k]: v } : m) }));
  const delMaterial = (i) => setForm((p) => ({ ...p, materials_list: p.materials_list.filter((_, idx) => idx !== i) }));

  const pickLead = (id) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return set("project_id", id);
    setForm((p) => ({
      ...p,
      project_id: id,
      lead_id: id,
      customer_name: lead.customer_name || p.customer_name,
      customer_email: lead.email || p.customer_email,
      customer_phone: lead.phone || p.customer_phone,
      project_address: lead.project_address || p.project_address,
      scope_items: lead.specifications || [],
    }));
  };

  const save = async () => {
    if (!form.project_id) { notify("Select a project/lead first"); return; }
    setSaving(true);
    try {
      const payload = { ...form, scheduled_date: form.scheduled_date ? new Date(form.scheduled_date).toISOString() : null };
      if (editing === "new") await base44.entities.WorkOrder.create(payload);
      else await base44.entities.WorkOrder.update(editing, payload);
      notify("Work order saved");
      setEditing(null); setForm(empty);
      load();
    } catch (e) { notify("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (o) => { await base44.entities.WorkOrder.delete(o.id); load(); };

  // --- Status change with photo gate ---
  const changeStatus = async (o, newStatus) => {
    if (newStatus === "completed") {
      const cats = photosByOrder[o.id] || [];
      const missing = PHOTO_CATEGORIES.filter((c) => !cats.includes(c));
      if (missing.length > 0) {
        notify(`Cannot complete: missing ${missing.length} required photo(s): ${missing.join(", ")}`);
        return;
      }
    }
    try {
      await base44.entities.WorkOrder.update(o.id, { status: newStatus });
      notify("Status updated");

      // #10: Auto-sync calendar when assigned + has scheduled date
      if (newStatus === "assigned" && o.scheduled_date && !o.calendar_event_id) {
        try {
          const start = new Date(o.scheduled_date);
          const end = new Date(start.getTime() + 8 * 3600000);
          const res = await base44.functions.invoke("createCalendarAppointment", {
            summary: `Job — ${o.customer_name || "Work Order"}`,
            description: o.notes || `Crew: ${o.crew_leader_name || "TBD"}`,
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            location: o.project_address || "",
            leadId: o.lead_id,
          });
          const calData = res.data || res;
          if (calData.eventId || calData.calendar_event_id) {
            await base44.entities.WorkOrder.update(o.id, {
              calendar_event_id: calData.eventId || calData.calendar_event_id,
              calendar_link: calData.htmlLink || calData.calendar_link,
            });
            notify("Calendar event auto-created");
          }
        } catch (e) { /* connector not connected — silent */ }
      }

      // #13: Prompt subcontractor rating on completion
      if (newStatus === "completed" && o.subcontractor_id) {
        try {
          const subs = await base44.entities.Subcontractor.filter({ id: o.subcontractor_id });
          const sub = subs?.[0];
          if (sub && confirm(`Rate ${sub.name} for this job?\n\nClick OK for 5 stars, Cancel for 3 stars.`)) {
            const newRating = prompt(`Rate ${sub.name} (1-5):`, "5");
            const rating = Math.max(1, Math.min(5, Number(newRating) || 5));
            const avgRating = Math.round(((sub.rating * 5 + rating) / 6) * 10) / 10;
            await base44.entities.Subcontractor.update(sub.id, { rating: avgRating });
            notify(`${sub.name} rated ${rating}★ (avg: ${avgRating})`);
          }
        } catch (e) { /* silent */ }
      }

      load();
    } catch (e) { notify("Update failed: " + e.message); }
  };

  // --- Invoice generation ---
  const generateInvoice = async (o, type) => {
    setInvBusy(o.id + type);
    try {
      const res = await base44.functions.invoke("generateInvoice", { workOrderId: o.id, type });
      const data = res.data || res;
      if (data.ok) {
        notify(`${type === "deposit" ? "Deposit" : "Final"} invoice created — go to Billing to charge`);
        load();
      } else {
        notify(data.error || "Invoice generation failed");
      }
    } catch (e) {
      const data = e?.response?.data || {};
      notify(data.error || e.message || "Invoice generation failed");
    } finally { setInvBusy(null); }
  };

  // --- Deposit status ---
  const depositStatus = (orderId) => {
    const deps = invoices.filter((i) => i.work_order_id === orderId && i.type === "deposit");
    if (deps.some((i) => i.status === "paid")) return { label: "Deposit Paid", color: "var(--vx-accent)" };
    if (deps.some((i) => i.status === "pending" || i.status === "draft")) return { label: "Deposit Pending", color: "var(--vx-warning)" };
    return { label: "No Deposit", color: "var(--vx-faint)" };
  };

  // --- Drive folder ---
  const [driveBusy, setDriveBusy] = useState(null);
  const createFolder = async (o) => {
    setDriveBusy(o.id);
    try {
      await base44.functions.invoke("createDriveFolder", { customerName: o.customer_name, address: o.project_address, template: "res", workOrderId: o.id });
      notify("Drive folder created");
      load();
    } catch (e) { notify("Drive failed: " + (e?.response?.data?.error || e.message)); }
    finally { setDriveBusy(null); }
  };

  // --- Material order email (#11) ---
  const [matBusy, setMatBusy] = useState(null);
  const orderMaterials = async (o) => {
    if (!o.materials_list?.length) { notify("No materials on this work order"); return; }
    const supplier = prompt("Supplier email (leave blank to generate list only):", "");
    if (supplier === null) return;
    setMatBusy(o.id);
    try {
      const res = await base44.functions.invoke("sendMaterialOrder", { work_order_id: o.id, supplier_email: supplier });
      const d = res.data || res;
      if (d.ok) notify(d.message || "Material order sent");
      else notify(d.error || "Failed");
    } catch (e) { notify("Material order failed: " + (e?.response?.data?.error || e.message)); }
    finally { setMatBusy(null); }
  };

  // --- Calendar sync ---
  const [calBusy, setCalBusy] = useState(null);
  const syncCalendar = async (o) => {
    if (!o.scheduled_date) { notify("Set a scheduled date first"); return; }
    setCalBusy(o.id);
    try {
      const start = new Date(o.scheduled_date);
      const end = new Date(start.getTime() + 8 * 3600000);
      const res = await base44.functions.invoke("createCalendarAppointment", {
        summary: `Job — ${o.customer_name || "Work Order"}`,
        description: o.notes || `Crew: ${o.crew_leader_name || "TBD"}`,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        location: o.project_address || "",
        leadId: o.lead_id,
      });
      const data = res.data || res;
      if (data.eventId) {
        await base44.entities.WorkOrder.update(o.id, { calendar_event_id: data.eventId, calendar_link: data.htmlLink });
        notify("Synced to Google Calendar");
        load();
      } else { notify("Calendar sync failed: " + (data.error || "connect Google Calendar")); }
    } catch (e) { notify("Calendar failed: " + (e?.response?.data?.error || e.message)); }
    finally { setCalBusy(null); }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="hx-scraper-actionbar">
        <button className="hx-mini-btn" onClick={() => { setEditing("new"); setForm(empty); }}><Plus size={14} /> New Work Order</button>
      </div>
      <div className="hx-list" style={{ maxHeight: 460 }}>
        {!orders ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
         orders.length === 0 ? <div className="hx-empty"><span>📋</span>No work orders yet.</div> :
         orders.map((o) => {
           const dep = depositStatus(o.id);
           const photoCount = (photosByOrder[o.id] || []).length;
           const photosComplete = PHOTO_CATEGORIES.every((c) => (photosByOrder[o.id] || []).includes(c));
           return (
            <div key={o.id} className="hx-sys-card" style={{ padding: 12 }}>
              <div className="hx-sys-head">
                <div className="hx-sys-title" style={{ minWidth: 0 }}>
                  <div className="hx-sys-icon"><ClipboardList size={16} /></div>
                  <div style={{ minWidth: 0 }}>
                    <strong>{o.customer_name || "Untitled"}</strong>
                    <span>{o.crew_leader_name ? `Crew: ${o.crew_leader_name}` : "Unassigned"} · {o.scope_items?.length || 0} scope · {o.materials_list?.length || 0} materials</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, color: STATUS_COLORS[o.status] || "#707070", border: `1px solid ${STATUS_COLORS[o.status] || "#707070"}` }}>{o.status}</span>
                  <button className="hx-lead-delete" onClick={() => remove(o)}><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Badges row */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: dep.color, border: `1px solid ${dep.color}`, background: "var(--vx-panel)" }}><DollarSign size={10} style={{ verticalAlign: "middle" }} /> {dep.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: photosComplete ? "var(--vx-accent)" : "var(--vx-warning)", border: `1px solid ${photosComplete ? "var(--vx-accent)" : "var(--vx-warning)"}`, background: "var(--vx-panel)" }}><Camera size={10} style={{ verticalAlign: "middle" }} /> {photoCount}/7 photos</span>
              </div>

              {o.scheduled_date && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#A0A0A0" }}>Scheduled: {new Date(o.scheduled_date).toLocaleString()}</p>}

              {/* Status changer */}
              <div style={{ marginTop: 8 }}>
                <select className="hx-scraper-input" style={{ fontSize: 12, padding: "6px 10px" }} value={o.status} onChange={(e) => changeStatus(o, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="hx-bid-controls" style={{ marginTop: 8 }}>
                {o.drive_folder_url ? (
                  <a href={o.drive_folder_url} target="_blank" rel="noreferrer" className="hx-sys-edit" style={{ color: "var(--vx-accent)", borderColor: "var(--vx-accent)", textDecoration: "none", justifyContent: "center" }}><ExternalLink size={13} /> Drive</a>
                ) : (
                  <button className="hx-sys-edit" onClick={() => createFolder(o)} disabled={driveBusy === o.id}>
                    {driveBusy === o.id ? <Loader2 size={13} className="spin" /> : <FolderTree size={13} />} Drive
                  </button>
                )}
                {o.calendar_link ? (
                  <a href={o.calendar_link} target="_blank" rel="noreferrer" className="hx-sys-edit" style={{ textDecoration: "none", justifyContent: "center" }}><ExternalLink size={13} /> Calendar</a>
                ) : (
                  <button className="hx-sys-edit" onClick={() => syncCalendar(o)} disabled={calBusy === o.id}>
                    {calBusy === o.id ? <Loader2 size={13} className="spin" /> : <Calendar size={13} />} Calendar
                  </button>
                )}
                <button className="hx-sys-edit" style={{ color: "var(--vx-accent)", borderColor: "var(--vx-accent)" }} onClick={() => generateInvoice(o, "deposit")} disabled={invBusy === o.id + "deposit"}>
                  {invBusy === o.id + "deposit" ? <Loader2 size={13} className="spin" /> : <DollarSign size={13} />} Deposit
                </button>
                <button className="hx-sys-edit" style={{ color: "var(--vx-accent)", borderColor: "var(--vx-accent)" }} onClick={() => generateInvoice(o, "final")} disabled={invBusy === o.id + "final"}>
                  {invBusy === o.id + "final" ? <Loader2 size={13} className="spin" /> : <DollarSign size={13} />} Final
                </button>
                {o.materials_list?.length > 0 && (
                  <button className="hx-sys-edit" onClick={() => orderMaterials(o)} disabled={matBusy === o.id}>
                    {matBusy === o.id ? <Loader2 size={13} className="spin" /> : <Mail size={13} />} Order Materials
                  </button>
                )}
              </div>
            </div>
          );
         })}
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: "90vh" }}>
            <div className="modal-head">
              <div><div className="eyebrow">Work Order</div><h2 style={{ fontSize: 18 }}>{editing === "new" ? "New" : "Edit"} Work Order</h2></div>
              <button className="close-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-grid" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div className="field"><label>Project / Lead</label>
                <select value={form.project_id} onChange={(e) => pickLead(e.target.value)}>
                  <option value="">Select a lead…</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.customer_name || "Unknown"}{l.project_address ? ` — ${l.project_address}` : ""}</option>)}
                </select>
              </div>
              <div className="form-grid two">
                <div className="field"><label>Customer name</label><input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} /></div>
                <div className="field"><label>Crew leader</label><input value={form.crew_leader_name} onChange={(e) => set("crew_leader_name", e.target.value)} /></div>
              </div>
              <div className="form-grid two">
                <div className="field"><label>Customer email</label><input value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} /></div>
                <div className="field"><label>Customer phone</label><input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} /></div>
              </div>
              <div className="field"><label>Project address</label><input value={form.project_address} onChange={(e) => set("project_address", e.target.value)} /></div>
              <div className="field"><label>Scheduled date</label><input type="datetime-local" value={form.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)} /></div>
              <div className="field"><label>Notes</label><textarea className="hx-bid-textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>

              {/* Scope items editor */}
              <div className="field">
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Scope of Work Items</span>
                  <button type="button" className="hx-mini-btn" style={{ fontSize: 11 }} onClick={addScope}><Plus size={11} /> Add</button>
                </label>
                {form.scope_items.length === 0 ? <p style={{ fontSize: 11, color: "var(--vx-faint)", margin: "4px 0" }}>No scope items. Selecting a lead auto-fills these.</p> :
                  form.scope_items.map((s, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 6, marginBottom: 6 }}>
                      <input placeholder="Label (e.g. Surface Prep)" value={s.label} onChange={(e) => setScope(i, "label", e.target.value)} style={{ fontSize: 12 }} />
                      <input placeholder="Detail (e.g. Diamond grind 250 grit)" value={s.detail} onChange={(e) => setScope(i, "detail", e.target.value)} style={{ fontSize: 12 }} />
                      <button type="button" className="hx-lead-delete" onClick={() => delScope(i)}><Trash2 size={12} /></button>
                    </div>
                  ))
                }
              </div>

              {/* Materials list editor */}
              <div className="field">
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><Package size={12} style={{ verticalAlign: "middle" }} /> Materials List (30% overage auto-applied)</span>
                  <button type="button" className="hx-mini-btn" style={{ fontSize: 11 }} onClick={addMaterial}><Plus size={11} /> Add</button>
                </label>
                {form.materials_list.length === 0 ? <p style={{ fontSize: 11, color: "var(--vx-faint)", margin: "4px 0" }}>No materials specified.</p> :
                  form.materials_list.map((m, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 6, marginBottom: 6 }}>
                      <input placeholder="Material name" value={m.name} onChange={(e) => setMaterial(i, "name", e.target.value)} style={{ fontSize: 12 }} />
                      <input type="number" step="0.01" placeholder="Qty" value={m.qty} onChange={(e) => setMaterial(i, "qty", parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                      <input placeholder="Unit (gal, lb, kit)" value={m.unit} onChange={(e) => setMaterial(i, "unit", e.target.value)} style={{ fontSize: 12 }} />
                      <input type="number" step="0.01" placeholder="$ Cost" value={m.cost} onChange={(e) => setMaterial(i, "cost", parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                      <button type="button" className="hx-lead-delete" onClick={() => delMaterial(i)}><Trash2 size={12} /></button>
                    </div>
                  ))
                }
                {form.materials_list.length > 0 && (
                  <p style={{ fontSize: 11, color: "var(--vx-accent)", margin: "4px 0 0" }}>
                    Total material cost: ${form.materials_list.reduce((s, m) => s + (m.qty * m.cost || 0), 0).toLocaleString()} (order qty × {1.3} with overage)
                  </p>
                )}
              </div>
            </div>
            <button className="gold-button form-submit" style={{ justifyContent: "center" }} onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : <Send size={15} />} Save Work Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}