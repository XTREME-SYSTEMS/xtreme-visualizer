import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { base44 } from '@/api/base44Client';
import { VisualXField, VisualXProvenanceBadge } from '../VisualXPrimitives';
import { systemRates, money } from '@/lib/refData';
import { getSystemColors, getSystemColorRecords } from '@/lib/floorColors';
import { computeRange, money as moneyFmt } from '@/lib/pricing';
import { PRICE_DISCLOSURE } from '@/lib/brand';
import { Upload, FileText, MapPin, Loader2, Check } from 'lucide-react';

const CONDITIONS = ['good', 'fair', 'poor'] as const;

export function VisualizerRoute() {
  const { notify, refresh, optimisticAdd, optimisticRemove } = useApp();
  const navigate = useNavigate();
  const [image, setImage] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [system, setSystem] = useState('Flake Epoxy');
  const [sqft, setSqft] = useState(850);
  const [condition, setCondition] = useState<'good' | 'fair' | 'poor'>('fair');
  const [needsGrinding, setNeedsGrinding] = useState(true);
  const [needsMoisture, setNeedsMoisture] = useState(false);
  const [crackLf, setCrackLf] = useState(0);
  const [saving, setSaving] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [localRates, setLocalRates] = useState<{ low: number; high: number; summary: string; confidence: string } | null>(null);
  const [fetchingPricing, setFetchingPricing] = useState(false);

  const baseRates = localRates || systemRates[system];
  const colorRecords = useMemo(() => getSystemColorRecords(system), [system]);
  const range = useMemo(() => computeRange({
    square_feet: sqft,
    condition,
    base_rate_low: baseRates.low,
    base_rate_high: baseRates.high,
    needs_grinding: needsGrinding,
    needs_moisture_mitigation: needsMoisture,
    linear_feet_cracks: crackLf,
  }), [sqft, condition, baseRates, needsGrinding, needsMoisture, crackLf]);

  const fetchLocalPricing = async () => {
    if (!zipCode.trim()) { notify('Enter a ZIP code first.'); return; }
    setFetchingPricing(true);
    try {
      const res = await base44.functions.invoke('fetchLocalPricing', { zipCode: zipCode.trim(), systemName: system });
      const d = res.data;
      if (d.low && d.high) {
        setLocalRates({ low: d.low, high: d.high, summary: d.summary || '', confidence: d.confidence || 'low' });
        notify(`Local pricing applied — ${moneyFmt(d.low)}–${moneyFmt(d.high)}/sq ft (${d.confidence} confidence)`);
      } else {
        notify('Could not find local pricing for that ZIP.');
      }
    } catch (e) { notify('Local pricing failed: ' + (e instanceof Error ? e.message : 'error')); }
    finally { setFetchingPricing(false); }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    try { setFileUrl(await api.uploadFile(file)); } catch { /* preview only */ }
    notify('Photo loaded for concept preview.');
  };

  const save = async () => {
    if (!fileUrl && !image) { notify('Upload a photo first.'); return; }
    setSaving(true);
    const tempId = 'pending-' + Date.now();
    optimisticAdd('leads', { id: tempId, customerName: 'Visualizer Project', address: 'Site verification pending', squareFeet: sqft, status: 'new' });
    try {
      await api.v2.create('leads', {
        customerName: 'Visualizer Project',
        address: 'Site verification pending',
        squareFeet: sqft,
        systemName: system,
        floorType: system,
        condition,
        needsGrinding,
        needsMoistureMitigation: needsMoisture,
        linearFeetCracks: crackLf,
        estimateLow: range.low,
        estimateHigh: range.high,
        pricingVersion: range.version,
        photoUrl: fileUrl || image,
        status: 'new',
        source: 'visualizer',
      });
      try { await api.v2.create('activityReceipts', { action: 'visualization_saved', detail: `${system} concept saved with preliminary range ${moneyFmt(range.low)}–${moneyFmt(range.high)} (v${range.version})`, category: 'visualization' }); } catch {}
      notify('Visualization project saved.');
      setFileUrl(''); setImage('');
      await refresh();
      navigate('/app/quote');
    } catch (e) { notify('Save failed: ' + (e instanceof Error ? e.message : 'error')); optimisticRemove('leads', tempId); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">LIVE VISUALIZER</span><h1>Visualizer</h1><p>Upload the customer's space, compare systems, and build a preliminary range.</p></div></div>
      <div className="vx-card visualizer-grid">
        <div>
          <div className="upload-zone">
            {image ? (
              <img src={image} alt="Uploaded project" />
            ) : (
              <div className="upload-message">
                <Upload className="vx-icon vx-icon-lg" />
                <strong>Upload a customer photo</strong>
                <span>Tap anywhere to select a garage, basement, warehouse, showroom, or patio photo.</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={onFile} />
          </div>
          <div className="guardrail">
            <strong>AI concept guardrail:</strong> Visualizations are design concepts, not completed customer projects. Final system suitability requires site verification.
          </div>
        </div>
        <div>
          <div className="vx-section-title"><h2>Floor system</h2><VisualXProvenanceBadge status="VERIFIED" source="XPS catalog rates" /></div>
          <div className="viz-swatches">
            {Object.entries(systemRates).map(([name, r]) => {
              const colors = getSystemColors(name);
              return (
                <button key={name} className={`viz-swatch ${system === name ? 'active' : ''}`} onClick={() => { setSystem(name); setLocalRates(null); }}>
                  <span className="viz-swatch-color">
                    {colors.slice(0, 6).map((hex, i) => (
                      <span key={i} style={{ background: hex }} />
                    ))}
                  </span>
                  <strong>{name}</strong>
                </button>
              );
            })}
          </div>
          <div className="vx-color-chart-preview">
            <div className="vx-section-title"><h2>{system} color chart</h2><VisualXProvenanceBadge status="VERIFIED" source="Xtreme Polishing Systems" /></div>
            <div className="vx-chart-strip">
              {colorRecords.map(c => (
                <div key={c.code} className="vx-chart-chip" title={`${c.name} (${c.code})`}>
                  {c.image_url ? <img src={c.image_url} alt={c.name} loading="lazy" /> : <span style={{ background: c.hex }} />}
                  <small>{c.name}</small>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 17, display: 'grid', gap: 12 }}>
            <VisualXField label="Project square feet" inputProps={{ type: 'number', min: 1, value: sqft, onChange: e => setSqft(Math.max(1, Number(e.target.value || 1))) }} />
            <div className="vx-field">
              <label>Slab condition</label>
              <div className="vx-tabbar">
                {CONDITIONS.map(c => <button key={c} className={condition === c ? 'active' : ''} onClick={() => setCondition(c)} style={{ textTransform: 'capitalize' }}>{c}</button>)}
              </div>
            </div>
            <div className="vx-grid vx-grid-2">
              <button className={`vx-btn compact ${needsGrinding ? 'outline-accent' : ''}`} onClick={() => setNeedsGrinding(v => !v)}>Grinding prep</button>
              <button className={`vx-btn compact ${needsMoisture ? 'outline-accent' : ''}`} onClick={() => setNeedsMoisture(v => !v)}>Moisture barrier</button>
            </div>
            <VisualXField label="Linear feet of cracks" inputProps={{ type: 'number', min: 0, value: crackLf, onChange: e => setCrackLf(Math.max(0, Number(e.target.value || 0))) }} />
          </div>
          <div className="price-panel">
            <span className="range-label">Preliminary installed range</span>
            <span className="range">{moneyFmt(range.low)} – {moneyFmt(range.high)}</span>
            <span className="price-detail">{money.format(baseRates.low)} – {money.format(baseRates.high)} per sq ft · includes prep, mobilization, condition factor. {PRICE_DISCLOSURE}</span>
            {localRates && (
              <span className="vx-chip ready" style={{ display: 'inline-flex', gap: 4, alignItems: 'center', marginTop: 6 }}>
                <Check className="vx-icon vx-icon-sm" /> Local pricing · {localRates.confidence} confidence
              </span>
            )}
          </div>
          <div className="vx-card local-pricing-panel">
            <div className="vx-section-title"><h2>Local pricing</h2><VisualXProvenanceBadge status="VERIFIED" source="Web-scraped local market rates" /></div>
            <p className="vx-muted" style={{ fontSize: 12, margin: '0 0 10px' }}>Enter your ZIP code to scrape live local contractor pricing for your area instead of using the national catalog average.</p>
            <div className="vx-grid vx-grid-2" style={{ alignItems: 'end' }}>
              <VisualXField label="ZIP code" inputProps={{ type: 'text', inputMode: 'numeric', maxLength: 5, value: zipCode, onChange: e => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5)), placeholder: '33101' }} />
              <button className="vx-btn outline-accent" onClick={fetchLocalPricing} disabled={fetchingPricing}>
                {fetchingPricing ? <Loader2 className="vx-icon" style={{ animation: 'spin .8s linear infinite' }} /> : <MapPin className="vx-icon" />}
                {fetchingPricing ? 'Scraping…' : 'Get local pricing'}
              </button>
            </div>
            {localRates && localRates.summary && (
              <div className="vx-card-soft" style={{ padding: 10, marginTop: 10 }}>
                <small className="vx-muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{localRates.summary}</small>
              </div>
            )}
          </div>
          <button className="vx-btn primary" style={{ width: '100%' }} onClick={save} disabled={saving}>
            <FileText className="vx-icon" /> {saving ? 'Saving…' : 'Save Project'}
          </button>
        </div>
      </div>
    </>
  );
}