import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, X, ClipboardList, Send, FolderTree, ExternalLink, Calendar } from "lucide-react";

const STATUSES = ["draft", "assigned", "in_progress", "completed", "cancelled"];
const STATUS_COLORS = { draft: "#707070", assigned: "#43a9ff", in_progress: "#ffd000", completed: "#9cff00", cancelled: "#ff5258" };

const empty = { project_id: "", customer_name: "", customer_email: "", customer_phone: "", project_address: "", crew_leader_name: "", scheduled_date: "", notes: "", scope_items: [], materials_list: [] };

export default function WorkOrderManager({ notify }) {
  const [orders, setOrders] = useState(null);
  const [leads, setLeads] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.WorkOrder.list("-created_date", 50).then(setOrders).catch(() => setOrders([]));
  useEffect(() => {
    load();
    base44.entities.Lead.list("-created_date", 100).then(setLeads).catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const pickLead = (id) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return set("project_id", id);
    setForm((p) => ({
      ...p,
      project_id: id,
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

  const [driveBusy, setDriveBusy] = useState(null);
  const createFolder = async (o) => {
    setDriveBusy(o.id);
    try {
      const res = await base44.functions.invoke("createDriveFolder", { customerName: o.customer_name, address: o.project_address, template: "res", workOrderId: o.id });
      notify("Drive folder created");
      load();
    } catch (e) { notify("Drive failed: " + (e?.response?.data?.error || e.message)); }
    finally { setDriveBusy(null); }
  };

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
      <div className="hx-list" style={{ maxHeight: 420 }}>
        {!orders ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
         orders.length === 0 ? <div className="hx-empty"><span>📋</span>No work orders yet.</div> :
         orders.map((o) => (
           <div key={o.id} className="hx-sys-card" style={{ padding: 12 }}>
             <div className="hx-sys-head">
               <div className="hx-sys-title" style={{ minWidth: 0 }}>
                 <div className="hx-sys-icon"><ClipboardList size={16} /></div>
                 <div style={{ minWidth: 0 }}>
                   <strong>{o.customer_name || "Untitled"}</strong>
                   <span>{o.crew_leader_name ? `Crew: ${o.crew_leader_name}` : "Unassigned"} · {o.scope_items?.length || 0} scope items</span>
                 </div>
               </div>
               <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                 <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, color: STATUS_COLORS[o.status] || "#707070", border: `1px solid ${STATUS_COLORS[o.status] || "#707070"}` }}>{o.status}</span>
                 <button className="hx-lead-delete" onClick={() => remove(o)}><Trash2 size={13} /></button>
               </div>
             </div>
             {o.scheduled_date && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#A0A0A0" }}>Scheduled: {new Date(o.scheduled_date).toLocaleString()}</p>}
             <div className="hx-bid-controls" style={{ marginTop: 8 }}>
               {o.drive_folder_url ? (
                 <a href={o.drive_folder_url} target="_blank" rel="noreferrer" className="hx-sys-edit" style={{ color: "var(--vx-accent)", borderColor: "var(--vx-accent)", textDecoration: "none", justifyContent: "center" }}><ExternalLink size={13} /> Open Drive Folder</a>
               ) : (
                 <button className="hx-sys-edit" onClick={() => createFolder(o)} disabled={driveBusy === o.id}>
                   {driveBusy === o.id ? <Loader2 size={13} className="spin" /> : <FolderTree size={13} />} Create Drive Folder
                 </button>
               )}
               {o.calendar_link ? (
                 <a href={o.calendar_link} target="_blank" rel="noreferrer" className="hx-sys-edit" style={{ textDecoration: "none", justifyContent: "center" }}><ExternalLink size={13} /> Calendar Event</a>
               ) : (
                 <button className="hx-sys-edit" onClick={() => syncCalendar(o)} disabled={calBusy === o.id}>
                   {calBusy === o.id ? <Loader2 size={13} className="spin" /> : <Calendar size={13} />} Sync Calendar
                 </button>
               )}
             </div>
             </div>
             ))}
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: "88vh" }}>
            <div className="modal-head">
              <div><div className="eyebrow">Work Order</div><h2 style={{ fontSize: 18 }}>{editing === "new" ? "New" : "Edit"} Work Order</h2></div>
              <button className="close-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-grid">
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