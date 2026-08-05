import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXField, VisualXProvenanceBadge } from '../VisualXPrimitives';
import { systemRates, money } from '@/lib/refData';
import { Upload, FileText } from 'lucide-react';

export function VisualizerRoute() {
  const { notify, refresh, optimisticAdd, optimisticRemove } = useApp();
  const navigate = useNavigate();
  const [image, setImage] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [system, setSystem] = useState('Epoxy Flake System');
  const [sqft, setSqft] = useState(850);
  const [saving, setSaving] = useState(false);

  const rates = systemRates[system];
  const low = Math.round(sqft * rates.low);
  const high = Math.round(sqft * rates.high);

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
      await api.v2.create('leads', { customerName: 'Visualizer Project', address: 'Site verification pending', squareFeet: sqft, systemName: system, floorType: system, estimateLow: low, estimateHigh: high, photoUrl: fileUrl || image, status: 'new', source: 'visualizer' });
      try { await api.v2.create('activityReceipts', { action: 'visualization_saved', detail: `${system} concept saved with preliminary range $${low}–$${high}`, category: 'visualization' }); } catch {}
      notify('Visualization project saved.');
      setFileUrl('');
      setImage('');
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
            {Object.entries(systemRates).map(([name, r]) => (
              <button key={name} className={`viz-swatch ${system === name ? 'active' : ''}`} onClick={() => setSystem(name)}>
                <span className="viz-swatch-color" style={{ background: r.gradient }} />
                <strong>{name}</strong>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 17 }}>
            <VisualXField label="Project square feet" inputProps={{ type: 'number', min: 1, value: sqft, onChange: e => setSqft(Math.max(1, Number(e.target.value || 1))) }} />
          </div>
          <div className="price-panel">
            <span className="range-label">Preliminary installed range</span>
            <span className="range">{money.format(low)} – {money.format(high)}</span>
            <span className="price-detail">{money.format(rates.low)} – {money.format(rates.high)} per sq ft before verified prep, repairs, mobilization, tax, or site conditions.</span>
            <button className="vx-btn primary" onClick={save} disabled={saving}>
              <FileText className="vx-icon" /> {saving ? 'Saving…' : 'Save Project'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}