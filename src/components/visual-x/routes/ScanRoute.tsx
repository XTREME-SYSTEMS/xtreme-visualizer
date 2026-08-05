import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXField, VisualXButton, VisualXEmptyState, VisualXBlockedState, VisualXProvenanceBadge } from '../VisualXPrimitives';
import { Camera, Save, Ruler, Brush, Plus } from 'lucide-react';

const PRESETS = ['garage', 'showroom', 'warehouse', 'patio'];
const DEFAULT_MASK = [{ x: 0.1, y: 0.3 }, { x: 0.9, y: 0.3 }, { x: 0.95, y: 0.95 }, { x: 0.05, y: 0.95 }];

export function ScanRoute() {
  const { notify, refresh } = useApp();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mask, setMask] = useState(DEFAULT_MASK);
  const [spaceType, setSpaceType] = useState('garage');
  const [areas, setAreas] = useState([{ length: 0, width: 0 }]);
  const [saving, setSaving] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const totalSqft = areas.reduce((s, a) => s + (a.length * a.width), 0);
  const coverage = Math.round(Math.abs(mask.reduce((s, p, i) => { const n = mask[(i + 1) % mask.length]; return s + (p.x * n.y - n.x * p.y); }, 0)) / 2 * 100);

  const handlePhoto = async (file: File) => { setUploading(true); try { setPhoto(await api.uploadFile(file)); notify('Photo uploaded.'); } catch { notify('Upload failed.'); } finally { setUploading(false); } };

  const getPoint = (e: any) => { const r = svgRef.current!.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };

  const save = async () => {
    if (!photo) { notify('Upload a photo first.'); return; }
    setSaving(true);
    try {
      await api.v2.create('projects', { name: `${spaceType} scan`, address: 'Address pending', squareFeet: totalSqft, floorSystem: '', status: 'New Lead', projectImageUrl: photo });
      notify('Project saved with audit receipt.');
      await refresh();
      navigate('/app/visualizer');
    } catch (e) { notify('Save failed: ' + (e instanceof Error ? e.message : 'error')); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">ROOM SCAN</span><h1>Scan space</h1><p>Upload a photo, draw a manual floor mask, and record measurements.</p></div></div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Site photo</h2><VisualXProvenanceBadge status="VERIFIED" source="Operator upload" /></div>
        {photo ? (
          <div className="scan-photo vx-photo" style={{ position: 'relative' }}>
            <img src={photo} alt="Site" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="mask-editor" style={{ position: 'absolute', inset: 0 }}>
              <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}
                onPointerMove={e => { if (dragging !== null) { const p = getPoint(e); setMask(m => m.map((pt, i) => i === dragging ? { x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)) } : pt)); } }}
                onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
                <polygon points={mask.map(p => `${p.x * 100},${p.y * 100}`).join(' ')} />
                {mask.map((p, i) => <circle key={i} cx={p.x * 100} cy={p.y * 100} r="1.5" onPointerDown={e => { e.preventDefault(); setDragging(i); }} style={{ cursor: 'grab' }} />)}
              </svg>
            </div>
            <div className="vx-photo-label"><Brush className="vx-icon vx-icon-sm" /> Manual mask · {coverage}% coverage</div>
          </div>
        ) : (
          <label className="vx-btn outline-accent" style={{ cursor: 'pointer', width: '100%', minHeight: 120, display: 'grid', placeItems: 'center' }}>
            <Camera className="vx-icon" /> {uploading ? 'Uploading…' : 'Upload room photo'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          </label>
        )}
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Space type</h2></div>
        <div className="vx-grid vx-grid-4 scan-presets">
          {PRESETS.map(p => <button key={p} className={spaceType === p ? 'active' : ''} onClick={() => setSpaceType(p)}>{p}</button>)}
        </div>
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Measurements</h2><Ruler className="vx-icon" /></div>
        {areas.map((a, i) => (
          <div className="vx-grid vx-grid-2" key={i} style={{ marginBottom: 8 }}>
            <VisualXField label={`Area ${i + 1} length (ft)`} inputProps={{ type: 'number', value: a.length, onChange: e => setAreas(areas.map((x, idx) => idx === i ? { ...x, length: Number(e.target.value) } : x)) }} />
            <VisualXField label={`Area ${i + 1} width (ft)`} inputProps={{ type: 'number', value: a.width, onChange: e => setAreas(areas.map((x, idx) => idx === i ? { ...x, width: Number(e.target.value) } : x)) }} />
          </div>
        ))}
        <button className="vx-btn compact" onClick={() => setAreas([...areas, { length: 0, width: 0 }])}><Plus className="vx-icon vx-icon-sm" /> Add area</button>
        <div className="vx-muted" style={{ marginTop: 8 }}>Total: <strong style={{ color: 'var(--vx-accent)' }}>{totalSqft} sq ft</strong></div>
      </div>
      <div className="vx-card confidence-card">
        <div className="confidence-ring" style={{ background: `conic-gradient(var(--vx-accent) 0 100%, var(--vx-panel-3) 100%)` }}>
          <span>100%<small>Manual</small></span>
        </div>
        <div className="confidence-details">
          <h3>Manual verification</h3>
          <strong>{coverage}% mask coverage</strong>
          <p className="vx-muted">All measurements are operator-entered. No AI auto-detection was used.</p>
        </div>
      </div>
      <VisualXButton variant="primary" onClick={save} disabled={saving || !photo}><Save className="vx-icon" />{saving ? 'Saving…' : 'Save as project'}</VisualXButton>
      <VisualXBlockedState title="Automatic AI masking disabled">
        <p>AI auto-detection and automatic mask generation remain disabled. Use the manual polygon editor above.</p>
      </VisualXBlockedState>
    </>
  );
}