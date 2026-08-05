import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { systemRates, money } from "@/lib/refData";

export default function Visualizer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [image, setImage] = useState("");
  const [system, setSystem] = useState("Epoxy Flake System");
  const [sqft, setSqft] = useState(850);
  const [saving, setSaving] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const rates = systemRates[system];
  const low = Math.round(sqft * rates.low);
  const high = Math.round(sqft * rates.high);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
    } catch {
      /* preview only */
    }
    toast({ title: "Photo loaded for concept preview." });
  };

  const save = async () => {
    setSaving(true);
    try {
      const lead = await base44.entities.Lead.create({
        customer_name: "Vizualizer Project",
        project_address: "Site verification pending",
        square_feet: Number(sqft) || 0,
        system_name: system,
        floor_type: system,
        estimate_low: low,
        estimate_high: high,
        photo_url: fileUrl || image || undefined,
        status: "new",
        source: "visualizer",
      });
      try {
        await base44.entities.ActivityReceipt.create({
          action: "visualization_saved",
          detail: `${system} concept saved with preliminary range`,
          category: "visualization",
        });
      } catch {}
      window.dispatchEvent(new Event("xv-projects-changed"));
      toast({ title: "Visualization project saved." });
      navigate(`/leads/${lead.id}`);
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="content-header">
        <div>
          <h1>Vizualizer</h1>
          <p>Upload the customer's space, compare systems, and build a preliminary range.</p>
        </div>
      </div>
      <div className="content-card visualizer-grid">
        <div>
          <div className="upload-zone">
            {image ? (
              <img src={image} alt="Uploaded project" />
            ) : (
              <div className="upload-message">
                <Upload size={42} />
                <strong>Upload a customer photo</strong>
                <span>Tap anywhere to select a garage, basement, warehouse, showroom, or patio photo.</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={onFile} />
          </div>
          <div className="guardrail" style={{ marginTop: 14 }}>
            <strong>AI concept guardrail:</strong> Visualizations are design concepts, not completed customer projects. Final system suitability requires site verification.
          </div>
        </div>
        <div>
          <h2 className="section-title" style={{ fontSize: 20 }}>Floor system</h2>
          <div className="swatches">
            {Object.entries(systemRates).map(([name, r]) => (
              <button
                key={name}
                className={`swatch ${system === name ? "active" : ""}`}
                onClick={() => setSystem(name)}
              >
                <span className="swatch-color" style={{ background: r.gradient }} />
                <strong>{name}</strong>
              </button>
            ))}
          </div>
          <label className="field" style={{ marginTop: 17 }}>
            Project square feet
            <input type="number" min="1" value={sqft} onChange={(e) => setSqft(Math.max(1, Number(e.target.value || 1)))} />
          </label>
          <div className="price-panel">
            <span className="range-label">Preliminary installed range</span>
            <span className="range">{money.format(low)} – {money.format(high)}</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>
              {money.format(rates.low)} – {money.format(rates.high)} per sq ft before verified prep, repairs, mobilization, tax, or site conditions.
            </span>
            <button className="gold-button" onClick={save} disabled={saving}>
              <FileText size={19} /> {saving ? "Saving…" : "Save Project"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}