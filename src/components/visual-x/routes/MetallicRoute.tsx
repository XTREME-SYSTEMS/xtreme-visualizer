import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXField, VisualXSlider, VisualXButton, VisualXProvenanceBadge } from '../VisualXPrimitives';
import { Search, Save, Share2, Eye } from 'lucide-react';

export function MetallicRoute() {
  const { state, notify, refresh } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [opacity, setOpacity] = useState(70);
  const [gloss, setGloss] = useState(90);
  const [saving, setSaving] = useState(false);
  const colors = state?.colors || [];
  const metallicColors = colors.filter(c => c.system === 'metallic');
  const filtered = search.trim() ? metallicColors.filter(c => c.color_name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())) : metallicColors;
  const selected = metallicColors.find(c => c.code === selectedCode);

  const save = async () => {
    if (!selected) { notify('Select a metallic color.'); return; }
    setSaving(true);
    try {
      await api.v2.create('visualizations', { imageUrl: selected.image_url, sourcePhotoUrl: '', systemName: 'Metallic Epoxy', finish: 'Metallic', colorName: selected.color_name, colorCode: selected.code, opacity, gloss, disclosure: 'AI concept visualization, not a completed customer project.', selected: false });
      notify('Scene saved with audit receipt.');
      await refresh();
    } catch (e) { notify('Save failed: ' + (e instanceof Error ? e.message : 'error')); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">METALLIC STUDIO</span><h1>Metallic</h1><p>Browse metallic pigments and preview floor scenes.</p></div></div>
      {selected && (
        <div className="vx-card">
          <div className="vx-section-title"><h2>Preview</h2><VisualXProvenanceBadge status="VERIFIED" source={selected.color_name} /></div>
          <div className="metallic-preview vx-photo" style={{ position: 'relative' }}>
            <img src={selected.image_url} alt={selected.color_name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: opacity / 100, filter: `brightness(${0.5 + gloss / 200}) contrast(${1 + gloss / 500})` }} />
            <div className="vx-photo-label"><Eye className="vx-icon vx-icon-sm" /> {selected.color_name} · {selected.code}</div>
          </div>
        </div>
      )}
      <div className="vx-card">
        <div className="vx-section-title"><h2>Metallic colors</h2><span className="vx-muted">{filtered.length} available</span></div>
        <VisualXField label="Search" inputProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: 'Search metallic colors...' }} />
        <div className="swatch-grid metallic-swatches" style={{ marginTop: 12 }}>
          {filtered.slice(0, 48).map(c => (
            <button key={c.code} className={`swatch ${selectedCode === c.code ? 'active' : ''}`} onClick={() => setSelectedCode(c.code)}>
              <img src={c.image_url} alt={c.color_name} loading="lazy" /><span>{c.color_name}</span><small>{c.code}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="vx-card visual-controls">
        <VisualXSlider label="Opacity" value={opacity} min={0} max={100} onChange={setOpacity} unit="%" />
        <VisualXSlider label="Gloss" value={gloss} min={0} max={100} onChange={setGloss} unit="%" />
      </div>
      <div className="vx-grid vx-grid-2">
        <VisualXButton variant="primary" onClick={save} disabled={saving || !selected}><Save className="vx-icon" />{saving ? 'Saving…' : 'Save scene'}</VisualXButton>
        <VisualXButton variant="outline-accent" onClick={() => navigate('/app/visualizer')}><Share2 className="vx-icon" />Use in visualizer</VisualXButton>
      </div>
      <div className="vx-notice"><strong>Approximation label</strong> AI concept visualization, not a completed customer project.</div>
    </>
  );
}