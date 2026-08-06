import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, Edit2, Save, X, FileText } from "lucide-react";

const VOICES = ["river", "honey", "sunny", "storm", "spark"];
const CATEGORIES = ["intake", "followup", "reminder", "custom"];

const DEFAULT_INTAKE = {
  name: "New Caller Intake Script",
  category: "intake",
  voice: "river",
  script_text:
    "Hi! Thanks for calling. I'm the virtual assistant and I'd love to get a few details so our team can prepare your free quote. " +
    "Could I get your name and a good callback number? " +
    "What type of floor are you most interested in — metallic epoxy, flake, polished concrete, or something else? " +
    "What city and state is the project in? " +
    "How would you describe the condition of the existing slab — good, fair, or poor? " +
    "What is the current surface of the floor right now? " +
    "What's the approximate square footage of the project? " +
    "And which rooms are we looking at? " +
    "Perfect — I'll get this to our team and we'll reach out to schedule your site visit. Thanks!",
  intake_fields: [
    "Contact name & phone",
    "Floor type interest",
    "City & state",
    "Existing slab condition",
    "Current floor surface",
    "Approximate sq ft",
    "Rooms",
  ],
};

const empty = { name: "", category: "intake", voice: "river", script_text: "", intake_fields: [] };

export default function ScriptManager({ notify }) {
  const [scripts, setScripts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [fieldInput, setFieldInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => base44.entities.VoiceScript.list("-created_date", 50).then(setScripts).catch(() => setScripts([]));
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const addField = () => { if (fieldInput.trim()) { set("intake_fields", [...form.intake_fields, fieldInput.trim()]); setFieldInput(""); } };
  const removeField = (i) => set("intake_fields", form.intake_fields.filter((_, x) => x !== i));

  const startNew = () => { setEditing("new"); setForm(empty); };
  const startEdit = (s) => { setEditing(s.id); setForm({ name: s.name, category: s.category, voice: s.voice, script_text: s.script_text, intake_fields: s.intake_fields || [] }); };
  const useTemplate = () => { setEditing("new"); setForm(DEFAULT_INTAKE); };

  const save = async () => {
    if (!form.name || !form.script_text) { notify("Name and script text are required"); return; }
    setSaving(true);
    try {
      if (editing === "new") await base44.entities.VoiceScript.create(form);
      else await base44.entities.VoiceScript.update(editing, form);
      notify("Script saved");
      setEditing(null); setForm(empty);
      load();
    } catch (e) { notify("Save failed: " + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (s) => { await base44.entities.VoiceScript.delete(s.id); load(); };

  return (
    <div className="hx-scraper-form">
      <div className="hx-bid-input-label"><FileText size={15} /> Voice Scripts</div>
      <div className="hx-scraper-actionbar">
        <button className="hx-mini-btn" onClick={startNew}><Plus size={14} /> New Script</button>
        <button className="hx-mini-btn dark" onClick={useTemplate}><FileText size={14} /> Use Intake Template</button>
      </div>

      <div className="hx-list" style={{ maxHeight: 280 }}>
        {!scripts ? <div className="hx-loading"><Loader2 size={18} className="spin" /></div> :
         scripts.length === 0 ? <div className="hx-empty"><span>🎙</span>No scripts yet. Use the intake template to start.</div> :
         scripts.map((s) => (
           <div key={s.id} className="hx-sys-card" style={{ padding: 12 }}>
             <div className="hx-sys-head">
               <div className="hx-sys-title" style={{ minWidth: 0 }}>
                 <div className="hx-sys-icon"><FileText size={16} /></div>
                 <div style={{ minWidth: 0 }}>
                   <strong>{s.name}</strong>
                   <span>{s.category} · {s.voice} · {s.active ? "active" : "inactive"}</span>
                 </div>
               </div>
               <div style={{ display: "flex", gap: 6 }}>
                 <button className="hx-lead-delete" onClick={() => startEdit(s)}><Edit2 size={13} /></button>
                 <button className="hx-lead-delete" onClick={() => remove(s)}><Trash2 size={13} /></button>
               </div>
             </div>
             <p style={{ margin: "8px 0 0", fontSize: 11, color: "#A0A0A0", lineHeight: 1.4 }}>{s.script_text?.slice(0, 120)}…</p>
           </div>
         ))}
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: "88vh" }}>
            <div className="modal-head">
              <div><div className="eyebrow">{editing === "new" ? "New" : "Edit"} Script</div><h2 style={{ fontSize: 18 }}>Voice Script</h2></div>
              <button className="close-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="form-grid two">
                <div className="field"><label>Category</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="field"><label>Voice</label>
                  <select value={form.voice} onChange={(e) => set("voice", e.target.value)}>{VOICES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
                </div>
              </div>
              <div className="field"><label>Script text</label><textarea className="hx-bid-textarea" style={{ minHeight: 120 }} value={form.script_text} onChange={(e) => set("script_text", e.target.value)} /></div>
              <div className="field"><label>Intake questions (what the agent must collect)</label>
                <div className="hx-sys-chips">
                  {form.intake_fields.map((f, i) => <span key={i} className="hx-sys-chip" style={{ cursor: "pointer" }} onClick={() => removeField(i)}>{f} <X size={10} style={{ verticalAlign: "middle" }} /></span>)}
                </div>
                <div className="hx-scraper-row" style={{ marginTop: 6 }}>
                  <input className="hx-scraper-input" placeholder="Add a question" value={fieldInput} onChange={(e) => setFieldInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addField()} />
                  <button className="hx-bid-logo-btn" onClick={addField}><Plus size={13} /></button>
                </div>
              </div>
            </div>
            <button className="gold-button form-submit" style={{ justifyContent: "center" }} onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save Script
            </button>
          </div>
        </div>
      )}
    </div>
  );
}