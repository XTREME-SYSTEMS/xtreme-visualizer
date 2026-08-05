import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXTabs, VisualXSlider, VisualXButton, VisualXProvenanceBadge } from '../VisualXPrimitives';
import { Camera, Save, ReceiptText, Eye, Layers3 } from 'lucide-react';

const MODES = [{ key: 'before', label: 'Before' }, { key: 'after', label: 'After' }, { key: 'split', label: 'Split' }];

export function VisualizerRoute() {
  const { state, notify, refresh, selectedColorIds } = useApp();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('after');
  const [systemSlug, setSystemSlug] = useState('');
  const [colorCode, setColorCode] = useState('');
  const [opacity, setOpacity] = useState(55);
  const [gloss, setGloss] = useState(80);
  const [saving, setSaving] = useState(false);

  const systems = state?.systems || [];
  const colors = state?.colors || [];
  const selectedColor = colors.find(c => c.code === colorCode) || colors.find(c => selectedColorIds.includes(c.code));
  const availableColors = colors.filter(c => selectedColorIds.includes(c.code) || c.system === 'flake' || c.system === 'metallic').slice(0, 18);

  const handlePhoto = async (file: File) => { setUploading(true); try { setPhoto(await api.uploadFile(file)); notify('Photo uploaded.'); } catch { notify('Upload failed.'); } finally { setUploading(false); } };

  const save = async () => {
    if (!photo) { notify('Upload a photo first.'); return; }
    if (!colorCode && !selectedColor) { notify('Select a color first.'); return; }
    setSaving(true);
    try {
      await api.v2.create('visualizations', { imageUrl: photo, sourcePhotoUrl: photo, systemName: systems.find(s => s.slug === systemSlug)?.name || '', finish: '', colorName: selectedColor?.color_name || '', colorCode: colorCode || selectedColor?.code || '', opacity, gloss, disclosure: 'AI concept visualization, not a completed customer project.', selected: false });
      notify('Visualization saved with audit receipt.');
      await refresh();
    } catch (e) { notify('Save failed: ' + (e instanceof Error ? e.message : 'error')); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">LIVE VISUALIZER</span><h1>Visualizer</h1><p>Apply floor finishes to a room photo with manual controls.</p></div></div>
      <div className="vx-card">
        <VisualXTabs tabs={MODES} active={mode} onChange={setMode} />
        {photo ? (
          <div className="visual-photo vx-photo" style={{ position: 'relative', marginTop: 12 }}>
            <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {mode !== 'before' && selectedColor && (
              <div className="finish-overlay" style={{ ['--selected-color' as any]: selectedColor.hex, ['--finish-opacity' as any]: opacity / 100, clipPath: mode === 'split' ? 'polygon(50% 0,100% 0,100% 100%,50% 100%)' : undefined } as any} />
            )}
            <div className="vx-photo-label"><Eye className="vx-icon vx-icon-sm" /> {mode === 'before' ? 'Original photo' : mode === 'split' ? 'Split view' : 'After'}</div>
          </div>
        ) : (
          <label className="vx-btn outline-accent" style={{ cursor: 'pointer', width: '100%', minHeight: 120, display: 'grid', placeItems: 'center', marginTop: 12 }}>
            <Camera className="vx-icon" /> {uploading ? 'Uploading…' : 'Upload room photo'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          </label>
        )}
      </div>
      {photo && (
        <>
          <div className="vx-card">
            <div className="vx-section-title"><h2>Floor system</h2></div>
            <div className="vx-grid vx-grid-5 system-grid">
              {systems.slice(0, 10).map(s => (
                <button key={s.slug} className={`system-choice ${systemSlug === s.slug ? 'active' : ''}`} onClick={() => setSystemSlug(s.slug)}>
                  <Layers3 className="vx-icon vx-icon-sm" /><span>{s.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="vx-card">
            <div className="vx-section-title"><h2>Color</h2>{selectedColor && <VisualXProvenanceBadge status="VERIFIED" source={selectedColor.color_name} />}</div>
            <div className="swatch-grid">
              {availableColors.map(c => (
                <button key={c.code} className={`swatch ${(colorCode || selectedColor?.code) === c.code ? 'active' : ''}`} onClick={() => setColorCode(c.code)}>
                  <img src={c.image_url} alt={c.color_name} loading="lazy" /><span>{c.color_name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="vx-card visual-controls">
            <VisualXSlider label="Opacity" value={opacity} min={0} max={100} onChange={setOpacity} unit="%" />
            <VisualXSlider label="Gloss" value={gloss} min={0} max={100} onChange={setGloss} unit="%" />
          </div>
          <div className="vx-notice"><strong>Approximation label</strong> AI concept visualization, not a completed customer project.</div>
          <div className="vx-grid vx-grid-2 visual-actions">
            <VisualXButton variant="primary" onClick={save} disabled={saving || !photo || (!colorCode && !selectedColor)}><Save className="vx-icon" />{saving ? 'Saving…' : 'Save visualization'}</VisualXButton>
            <VisualXButton variant="outline-accent" onClick={() => navigate('/app/quote')}><ReceiptText className="vx-icon" />Build quote</VisualXButton>
          </div>
        </>
      )}
    </>
  );
}