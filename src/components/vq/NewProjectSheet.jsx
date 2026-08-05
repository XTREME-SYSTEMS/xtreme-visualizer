import React, { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { systemRates } from "@/lib/refData";

export default function NewProjectSheet({ onClose }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    sqft: "",
    system: "Epoxy Flake System",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.sqft) return;
    setSaving(true);
    try {
      const sqft = Number(form.sqft || 0);
      const rates = systemRates[form.system];
      const low = Math.round(sqft * rates.low);
      const high = Math.round(sqft * rates.high);
      await base44.entities.Lead.create({
        customer_name: form.name,
        project_address: form.location,
        square_feet: sqft,
        system_name: form.system,
        floor_type: form.system,
        estimate_low: low,
        estimate_high: high,
        status: "new",
        source: "manual",
      });
      try {
        await base44.entities.ActivityReceipt.create({
          action: "project_created",
          detail: `${form.name} created from the mobile dashboard`,
          category: "audit",
        });
      } catch {}
      window.dispatchEvent(new Event("xv-projects-changed"));
      toast({ title: "Project created and receipt recorded." });
      onClose();
    } catch (err) {
      toast({ title: "Could not create project", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">New opportunity</p>
            <h2>Start a project</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <X size={21} />
          </button>
        </div>
        <div className="form-grid">
          <label className="field">
            Project name
            <input name="name" required placeholder="Johnson Garage" value={form.name} onChange={set("name")} />
          </label>
          <label className="field">
            City and state
            <input name="location" required placeholder="Phoenix, AZ" value={form.location} onChange={set("location")} />
          </label>
          <div className="form-grid two" style={{ marginTop: 0 }}>
            <label className="field">
              Square feet
              <input name="sqft" type="number" min="1" required placeholder="2450" value={form.sqft} onChange={set("sqft")} />
            </label>
            <label className="field">
              Floor system
              <select name="system" value={form.system} onChange={set("system")}>
                {Object.keys(systemRates).map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <button className="gold-button form-submit" type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create project"}
        </button>
      </form>
    </div>
  );
}