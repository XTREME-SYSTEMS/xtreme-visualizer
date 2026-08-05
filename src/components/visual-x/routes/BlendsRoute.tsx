import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXField, VisualXProvenanceBadge, VisualXEmptyState, swatchSrc } from '../VisualXPrimitives';
import { Search, Save, ScanLine, ReceiptText, Star } from 'lucide-react';

export function BlendsRoute() {
  const { state, notify, refresh, selectedColorIds, toggleColor } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const colors = state?.colors || [];
  const flakeColors = colors.filter(c => c.system === 'flake');
  const filtered = search.trim() ? flakeColors.filter(c => c.color_name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())) : flakeColors;
  const selected = flakeColors.filter(c => selectedColorIds.includes(c.code)).slice(0, 4);

  const save = async () => {
    if (selected.length === 0) { notify('Select at least one color.'); return; }
    setSaving(true);
    try {
      await api.v2.create('visualizations', { imageUrl: selected[0]?.image_url || '', sourcePhotoUrl: '', systemName: 'Flake Epoxy', finish: 'Flake Blend', colorName: selected.map(c => c.color_name).join(' + '), colorCode: selected.map(c => c.code).join(','), opacity: 100, gloss: 80, disclosure: 'AI concept visualization, not a completed customer project.', selected: false });
      notify('Blend saved with audit receipt.');
      await refresh();
    } catch (e) { notify('Save failed: ' + (e instanceof Error ? e.message : 'error')); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">FLAKE BLEND STUDIO</span><h1>Blend studio</h1><p>Combine flake colors to create custom blends.</p></div></div>
      {selected.length > 0 && (
        <div className="vx-card">
          <div className="vx-section-title"><h2>Selected blend</h2><VisualXProvenanceBadge status="VERIFIED" source="Operator selection" /></div>
          <div className="selected-finish">
            <div className="blend-preview vx-photo" style={{ display: 'grid', gridTemplateColumns: `repeat(${selected.length}, 1fr)`, gap: 2, height: 128, width: 220, borderRadius: 13, overflow: 'hidden' }}>
              {selected.map(c => <img key={c.code} src={swatchSrc(c)} alt={c.color_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)}
            </div>
            <div><h2>{selected.map(c => c.color_name).join(' + ')}</h2><p>{selected.map(c => c.code).join(', ')}</p><p className="vx-muted">{selected.length} color{selected.length > 1 ? 's' : ''} selected (max 4)</p></div>
            <Star className="vx-icon" />
          </div>
        </div>
      )}
      <div className="vx-card">
        <div className="vx-section-title"><h2>Flake colors</h2><span className="vx-muted">{filtered.length} available</span></div>
        <VisualXField label="Search" inputProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: 'Search flake colors...' }} />
        <div className="swatch-grid" style={{ marginTop: 12 }}>
          {filtered.slice(0, 48).map(c => (
            <button key={c.code} className={`swatch ${selectedColorIds.includes(c.code) ? 'active' : ''}`} onClick={() => toggleColor(c.code)}>
              <img src={swatchSrc(c)} alt={c.color_name} loading="lazy" /><span>{c.color_name}</span><small>{c.code}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="vx-grid vx-grid-3 studio-actions">
        <button className="studio-action" onClick={save} disabled={saving || selected.length === 0}><Save className="vx-icon" />{saving ? 'Saving…' : 'Save favorite'}</button>
        <button className="studio-action" onClick={() => navigate('/app/visualizer')}><ScanLine className="vx-icon" />Add to visual</button>
        <button className="studio-action" onClick={() => navigate('/app/quote')}><ReceiptText className="vx-icon" />Attach to quote</button>
      </div>
    </>
  );
}