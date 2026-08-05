import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Sparkles, Loader2, FileText, Wand2, Layers, Mail, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { systemRates, money } from "@/lib/refData";
import { getSystemColorRecords, getSystemRepresentative } from "@/lib/floorColors";
import { computeRange, money as moneyFmt } from "@/lib/pricing";
import { PRICE_DISCLOSURE } from "@/lib/brand";

const CONDITIONS = ["good", "fair", "poor"];

const BID_TIERS = [
  { key: "essential", label: "Essential", factor: 0.92, blurb: "Core system, standard color, standard prep." },
  { key: "recommended", label: "Recommended", factor: 1.0, blurb: "Premium color + full prep + sealing." },
  { key: "premier", label: "Premier", factor: 1.12, blurb: "Decorative finish, coving, moisture barrier." },
];

export default function Visualizer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [image, setImage] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [system, setSystem] = useState("Flake Epoxy");
  const [color, setColor] = useState("");
  const [sqft, setSqft] = useState(850);
  const [condition, setCondition] = useState("fair");
  const [needsGrinding, setNeedsGrinding] = useState(true);
  const [needsMoisture, setNeedsMoisture] = useState(false);
  const [crackLf, setCrackLf] = useState(0);
  const [patchCount, setPatchCount] = useState(0);
  const [excessivePatch, setExcessivePatch] = useState(0);
  const [largePatch, setLargePatch] = useState(0);
  const [jointLf, setJointLf] = useState(0);
  const [covingLf, setCovingLf] = useState(0);
  const [demoSqft, setDemoSqft] = useState(0);
  const [extraPrep, setExtraPrep] = useState(false);
  const [showBlemishes, setShowBlemishes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [concept, setConcept] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickedTier, setPickedTier] = useState("recommended");

  const rates = systemRates[system];
  const colorRecords = useMemo(() => getSystemColorRecords(system), [system]);
  const selectedColor = colorRecords.find((c) => c.name === color) || colorRecords[0];

  const range = useMemo(
    () =>
      computeRange({
        square_feet: sqft,
        condition,
        base_rate_low: rates.low,
        base_rate_high: rates.high,
        needs_grinding: needsGrinding,
        needs_moisture_mitigation: needsMoisture,
        linear_feet_cracks: crackLf,
        linear_feet_coving: covingLf,
        linear_feet_joints: jointLf,
        patch_count: patchCount,
        excessive_patch_count: excessivePatch,
        large_patch_count: largePatch,
        demolition_sqft: demoSqft,
        extra_prep: extraPrep,
      }),
    [sqft, condition, rates, needsGrinding, needsMoisture, crackLf, covingLf, jointLf, patchCount, excessivePatch, largePatch, demoSqft, extraPrep]
  );

  const bids = BID_TIERS.map((t) => ({
    ...t,
    low: Math.round((range.low * t.factor) / 25) * 25,
    high: Math.round((range.high * t.factor) / 25) * 25,
  }));

  const activeBid = bids.find((b) => b.key === pickedTier) || bids[1];
  const midPrice = Math.round((activeBid.low + activeBid.high) / 2);
  const perSqft = sqft ? (midPrice / sqft).toFixed(2) : "—";

  const hasBlemishes = crackLf || patchCount || excessivePatch || largePatch || jointLf || covingLf || demoSqft || extraPrep;

  const prepParts = [];
  if (needsGrinding) prepParts.push("Grinding");
  if (needsMoisture) prepParts.push("Moisture barrier");
  if (crackLf) prepParts.push(crackLf + " lf cracks");
  if (patchCount) prepParts.push(patchCount + " patches");
  if (excessivePatch) prepParts.push(excessivePatch + " excessive");
  if (largePatch) prepParts.push(largePatch + " large");
  if (jointLf) prepParts.push(jointLf + " lf joints");
  if (covingLf) prepParts.push(covingLf + " lf coving");
  if (demoSqft) prepParts.push(demoSqft + " sqft demo");
  if (extraPrep) prepParts.push("Extra prep");
  const prepSummary = prepParts.length ? prepParts.join(", ") : "None";

  const bidText =
    "VISUAL-X PRELIMINARY BID\n" +
    "Project: Vizualizer Project\n" +
    "System: " + system + "\n" +
    "Color: " + (selectedColor?.name || "Standard") + "\n" +
    "Square feet: " + sqft + "\n" +
    "Condition: " + condition + "\n" +
    "Prep: " + prepSummary + "\n\n" +
    activeBid.label + " package: " + moneyFmt(activeBid.low) + " – " + moneyFmt(activeBid.high) + "\n" +
    "Estimated mid: " + moneyFmt(midPrice) + " (" + perSqft + "/sq ft)\n\n" +
    "This is a preliminary, non-binding range based on the information provided. Final pricing requires an onsite verification. Valid for 30 days.";

  const shareSubject = "Preliminary bid — " + system + " floor (" + sqft + " sq ft)";
  const shareEmail = "mailto:?subject=" + encodeURIComponent(shareSubject) + "&body=" + encodeURIComponent(bidText);
  const shareSms = "sms:?&body=" + encodeURIComponent(bidText);

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
    setConcept("");
    toast({ title: "Photo loaded for concept preview." });
  };

  const generate = async () => {
    if (!image && !fileUrl) {
      toast({ title: "Upload a photo first.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setConcept("");
    try {
      const colorName = selectedColor?.name || "";
      const prompt = 'Photorealistic interior design rendering of the uploaded room with a newly installed ' + system + ' floor in the color "' + colorName + '". Seamless, glossy, professional concrete coating finish. Same room geometry, walls, and lighting as the original photo. High-end real-estate photography, wide angle, natural light.';
      const res = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: fileUrl ? [fileUrl] : undefined,
      });
      setConcept(res.url);
      toast({ title: "Visualization concept generated." });
    } catch (err) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const save = async (tier) => {
    setSaving(true);
    try {
      const lead = await base44.entities.Lead.create({
        customer_name: "Vizualizer Project",
        project_address: "Site verification pending",
        square_feet: Number(sqft) || 0,
        system_name: system,
        floor_type: system,
        color_name: selectedColor?.name || "",
        color_hex: selectedColor?.hex || "",
        condition,
        needs_grinding: needsGrinding,
        needs_moisture_mitigation: needsMoisture,
        linear_feet_cracks: Number(crackLf) || 0,
        linear_feet_coving: Number(covingLf) || 0,
        linear_feet_joints: Number(jointLf) || 0,
        patch_count: Number(patchCount) || 0,
        excessive_patch_count: Number(excessivePatch) || 0,
        large_patch_count: Number(largePatch) || 0,
        demolition_sqft: Number(demoSqft) || 0,
        extra_prep: extraPrep,
        estimate_low: tier ? tier.low : range.low,
        estimate_high: tier ? tier.high : range.high,
        pricing_version: range.version,
        photo_url: fileUrl || image || undefined,
        status: "new",
        source: "visualizer",
      });
      try {
        await base44.entities.ActivityReceipt.create({
          action: "visualization_saved",
          detail: system + " concept saved with preliminary range " + moneyFmt(range.low) + "–" + moneyFmt(range.high),
          category: "visualization",
        });
      } catch {}
      if (concept) {
        try {
          await base44.entities.Visualization.create({
            lead_id: lead.id,
            image_url: concept,
            source_photo_url: fileUrl || image || undefined,
            system_name: system,
            color_name: selectedColor?.name || "",
            label: "AI concept",
            disclosure: "AI concept visualization, not a completed customer project.",
          });
        } catch {}
      }
      toast({ title: "Visualization project saved." });
      navigate("/leads/" + lead.id);
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="visualizer-flow">
      {/* 1. Upload hero */}
      <section className="viz-step">
        <div className="viz-step-head">
          <span className="viz-step-num">1</span>
          <h2>Upload the customer's space</h2>
        </div>
        <div className="upload-zone viz-upload-hero">
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
        <div className="guardrail">
          <strong>AI concept guardrail:</strong> Visualizations are design concepts, not completed customer projects. Final system suitability requires site verification.
        </div>
      </section>

      {/* 2. System + color + specs */}
      <section className="viz-step">
        <div className="viz-step-head">
          <span className="viz-step-num">2</span>
          <h2>Choose floor system &amp; color</h2>
        </div>
        <div className="swatches">
          {Object.entries(systemRates).filter(([name]) => name !== "Joint Fill & Repair").map(([name]) => {
            const rep = getSystemRepresentative(name);
            return (
              <button
                key={name}
                className={"swatch " + (system === name ? "active" : "")}
                onClick={() => { setSystem(name); setColor(""); setConcept(""); }}
              >
                <span className="swatch-color viz-swatch-tile">
                  {rep?.image_url ? (
                    <img src={rep.image_url} alt={rep.name} loading="lazy" />
                  ) : (
                    <span className="viz-swatch-fill" style={{ background: rep?.hex || "#888" }} />
                  )}
                </span>
                <strong>{name}</strong>
              </button>
            );
          })}
        </div>
        <div className="vx-color-chart-preview" style={{ marginTop: 14 }}>
          <div className="vx-section-title"><h3>{system} color chart</h3></div>
          <div className="vx-chart-strip">
            {colorRecords.map((c) => (
              <button
                key={c.code}
                className={"vx-chart-chip " + (selectedColor?.name === c.name ? "active" : "")}
                title={c.name + " (" + c.code + ")"}
                onClick={() => setColor(c.name)}
                style={{ border: selectedColor?.name === c.name ? "1px solid var(--vx-accent)" : undefined }}
              >
                {c.image_url ? <img src={c.image_url} alt={c.name} loading="lazy" /> : <span style={{ background: c.hex }} />}
                <small>{c.name}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="viz-specs">
          <label className="field">
            Project square feet
            <input type="number" min="1" value={sqft} onChange={(e) => setSqft(Math.max(1, Number(e.target.value || 1)))} />
          </label>
          <div className="field">
            <span>Slab condition</span>
            <div className="vx-tabbar">
              {CONDITIONS.map((c) => (
                <button key={c} className={condition === c ? "active" : ""} onClick={() => setCondition(c)} style={{ textTransform: "capitalize" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="viz-toggle-row">
            <button className={"vx-btn compact " + (needsGrinding ? "outline-accent" : "")} onClick={() => setNeedsGrinding((v) => !v)}>Grinding prep</button>
            <button className={"vx-btn compact " + (needsMoisture ? "outline-accent" : "")} onClick={() => setNeedsMoisture((v) => !v)}>Moisture barrier</button>
          </div>
          <label className="field">
            Linear feet of cracks
            <input type="number" min="0" value={crackLf} onChange={(e) => setCrackLf(Math.max(0, Number(e.target.value || 0)))} />
          </label>

          {/* Blemishes expandable */}
          <button className="viz-blemish-toggle" onClick={() => setShowBlemishes((v) => !v)}>
            <span>
              {hasBlemishes ? "Blemishes & repairs (" + prepParts.length + " items)" : "Add patches, joints, coving, demo & other blemishes"}
            </span>
            {showBlemishes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showBlemishes && (
            <div className="viz-blemish-grid">
              <label className="field">
                Patch count
                <input type="number" min="0" value={patchCount} onChange={(e) => setPatchCount(Math.max(0, Number(e.target.value || 0)))} />
              </label>
              <label className="field">
                Excessive patches
                <input type="number" min="0" value={excessivePatch} onChange={(e) => setExcessivePatch(Math.max(0, Number(e.target.value || 0)))} />
              </label>
              <label className="field">
                Large patches / deep spalls
                <input type="number" min="0" value={largePatch} onChange={(e) => setLargePatch(Math.max(0, Number(e.target.value || 0)))} />
              </label>
              <label className="field">
                Linear feet of joints
                <input type="number" min="0" value={jointLf} onChange={(e) => setJointLf(Math.max(0, Number(e.target.value || 0)))} />
              </label>
              <label className="field">
                Linear feet of coving
                <input type="number" min="0" value={covingLf} onChange={(e) => setCovingLf(Math.max(0, Number(e.target.value || 0)))} />
              </label>
              <label className="field">
                Demolition sq ft
                <input type="number" min="0" value={demoSqft} onChange={(e) => setDemoSqft(Math.max(0, Number(e.target.value || 0)))} />
              </label>
              <button className={"vx-btn compact " + (extraPrep ? "outline-accent" : "")} onClick={() => setExtraPrep((v) => !v)}>
                Extra site prep (+$250)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. Generate before/after */}
      <section className="viz-step">
        <div className="viz-step-head">
          <span className="viz-step-num">3</span>
          <h2>Show the customer</h2>
        </div>
        <button className="gold-button viz-generate-btn" onClick={generate} disabled={generating || (!image && !fileUrl)}>
          {generating ? <Loader2 size={19} style={{ animation: "spin .8s linear infinite" }} /> : <Wand2 size={19} />}
          {generating ? "Rendering concept…" : "Generate before / after"}
        </button>
        {(image || concept) && (
          <div className="viz-before-after">
            <div className="viz-ba-panel">
              <span className="viz-ba-label">Before</span>
              {image ? <img src={image} alt="Before" /> : <div className="viz-ba-empty"><Upload size={28} /></div>}
            </div>
            <div className="viz-ba-panel">
              <span className="viz-ba-label">After</span>
              {generating ? (
                <div className="viz-ba-empty"><Loader2 size={28} style={{ animation: "spin .8s linear infinite" }} /></div>
              ) : concept ? (
                <img src={concept} alt="After" />
              ) : (
                <div className="viz-ba-empty"><Sparkles size={28} /></div>
              )}
            </div>
          </div>
        )}
        {concept && <p className="viz-disclosure">{PRICE_DISCLOSURE}</p>}
      </section>

      {/* 4. Instant bid options */}
      <section className="viz-step">
        <div className="viz-step-head">
          <span className="viz-step-num">4</span>
          <h2>Instant bid options</h2>
        </div>
        <div className="price-panel" style={{ marginBottom: 12 }}>
          <span className="range-label">Preliminary installed range</span>
          <span className="range">{moneyFmt(range.low)} – {moneyFmt(range.high)}</span>
          <span style={{ fontSize: 12, color: "#bbb" }}>
            {money.format(rates.low)} – {money.format(rates.high)} per sq ft · includes prep, mobilization, condition factor.
          </span>
        </div>
        <div className="viz-bids">
          {bids.map((b) => (
            <div key={b.key} className={"viz-bid-card " + (b.key === "recommended" ? "featured" : "")}>
              {b.key === "recommended" && <span className="viz-bid-badge">Best value</span>}
              <strong>{b.label}</strong>
              <span className="viz-bid-range">{moneyFmt(b.low)} – {moneyFmt(b.high)}</span>
              <small>{b.blurb}</small>
              <button className="vx-btn primary" onClick={() => save(b)} disabled={saving}>
                <FileText size={16} /> Save as {b.label}
              </button>
            </div>
          ))}
        </div>
        <button className="vx-btn outline-accent" style={{ width: "100%", marginTop: 10 }} onClick={() => save(null)} disabled={saving}>
          <Layers size={18} /> {saving ? "Saving…" : "Save without tier"}
        </button>
      </section>

      {/* 5. Physical bid + share */}
      <section className="viz-step viz-bid-document">
        <div className="viz-step-head">
          <span className="viz-step-num">5</span>
          <h2>Share the estimate</h2>
        </div>
        <div className="viz-bid-paper">
          <div className="viz-bid-paper-head">
            <div>
              <span className="vx-kicker">VISUAL-X · PRELIMINARY BID</span>
              <h3>{system} — {selectedColor?.name || "Standard"}</h3>
            </div>
            <div className="viz-bid-tier-pick">
              {bids.map((b) => (
                <button key={b.key} className={pickedTier === b.key ? "active" : ""} onClick={() => setPickedTier(b.key)}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="viz-bid-lines">
            <div className="viz-bid-line"><span>Floor system</span><strong>{system}</strong></div>
            <div className="viz-bid-line"><span>Color</span><strong>{selectedColor?.name || "Standard"}</strong></div>
            <div className="viz-bid-line"><span>Square feet</span><strong>{sqft.toLocaleString()} sq ft</strong></div>
            <div className="viz-bid-line"><span>Slab condition</span><strong style={{ textTransform: "capitalize" }}>{condition}</strong></div>
            <div className="viz-bid-line"><span>Prep included</span><strong>{prepSummary}</strong></div>
            <div className="viz-bid-line"><span>Package</span><strong>{activeBid.label}</strong></div>
          </div>
          <div className="viz-bid-total">
            <div>
              <small>Estimated range</small>
              <strong>{moneyFmt(activeBid.low)} – {moneyFmt(activeBid.high)}</strong>
              <small>{perSqft}/sq ft · mid {moneyFmt(midPrice)}</small>
            </div>
          </div>
          <p className="viz-bid-fineprint">{PRICE_DISCLOSURE} Valid for 30 days. Final pricing requires onsite verification.</p>
          <div className="viz-bid-share">
            <a className="vx-btn primary" href={shareEmail}>
              <Mail size={18} /> Email bid
            </a>
            <a className="vx-btn outline-accent" href={shareSms}>
              <MessageSquare size={18} /> SMS bid
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}