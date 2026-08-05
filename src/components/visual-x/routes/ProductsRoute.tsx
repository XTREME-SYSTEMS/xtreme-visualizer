import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { VisualXTabs, VisualXField, VisualXEmptyState, VisualXProvenanceBadge, swatchSrc } from '../VisualXPrimitives';
import { Search, PackageSearch, ScanLine } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'All' }, { key: 'metallic', label: 'Metallic' },
  { key: 'flake', label: 'Flake' }, { key: 'quartz', label: 'Quartz' },
  { key: 'solid', label: 'Solid' }, { key: 'glitter', label: 'Glitter' },
];

export function ProductsRoute() {
  const { state, selectedColorIds, toggleColor } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const colors = state?.colors || [];
  const products = state?.products || [];

  const filtered = useMemo(() => {
    let list = colors;
    if (tab !== 'all') list = list.filter(c => c.system === tab);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(c => c.color_name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)); }
    return list.slice(0, 60);
  }, [colors, tab, search]);

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">PRODUCTS & COLORS</span><h1>Catalog</h1><p>Browse verified floor systems, colors, and products.</p></div></div>
      <VisualXField label="Search colors" inputProps={{ value: search, onChange: e => setSearch(e.target.value), placeholder: 'Search by name or code...' }} />
      <VisualXTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="vx-card">
        <div className="vx-section-title"><h2>Color swatches</h2><VisualXProvenanceBadge status="VERIFIED" source="Xtreme Polishing Systems" /></div>
        {filtered.length === 0 ? <VisualXEmptyState title="No colors found">Try a different search or tab.</VisualXEmptyState> : (
          <div className="swatch-grid">
            {filtered.map(c => (
              <button key={c.code} className={`swatch ${selectedColorIds.includes(c.code) ? 'active' : ''}`} onClick={() => toggleColor(c.code)}>
                <img src={swatchSrc(c)} alt={c.color_name} loading="lazy" />
                <span>{c.color_name}</span>
                <small>{c.code}</small>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Products</h2><span className="vx-muted">{products.length} items</span></div>
        {products.length === 0 ? <VisualXEmptyState title="No products loaded">Product inventory requires verified vendor data. No fabricated products are shown.</VisualXEmptyState> : (
          <div className="product-list">
            {products.map(p => (
              <div key={p.id} className="product-row">
                <div><h3>{p.name}</h3><p>{p.description}</p></div>
                {p.image && <img src={p.image} alt="" />}
                <span className="vx-chip ready">{p.pricingStatus}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedColorIds.length > 0 && (
        <div className="vx-card">
          <div className="vx-section-title"><h2>Selected ({selectedColorIds.length})</h2></div>
          <div className="selection-tray">
            {selectedColorIds.map(code => { const c = colors.find(x => x.code === code); return c ? <img key={code} src={swatchSrc(c)} alt={c.color_name} /> : null; })}
            <button className="vx-btn outline-accent" onClick={() => navigate('/app/visualizer')}><ScanLine className="vx-icon vx-icon-sm" /> Visualize</button>
          </div>
        </div>
      )}
    </>
  );
}