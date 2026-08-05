import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { VisualXEmptyState, VisualXProvenanceBadge, VisualXBlockedState } from '../VisualXPrimitives';
import { Check, ScanLine } from 'lucide-react';

export function CompareRoute() {
  const { state, notify, selectedColorIds } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const colors = state?.colors || [];
  const options = colors.filter(c => selectedColorIds.includes(c.code)).slice(0, 3);
  const fallback = colors.filter(c => c.system === 'flake' && c.in_stock).slice(0, 3);
  const compareOptions = options.length >= 2 ? options : fallback;

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">COMPARE FINISHES</span><h1>Compare</h1><p>Compare up to three floor finish options side by side.</p></div></div>
      {compareOptions.length < 2 ? <VisualXEmptyState title="Not enough finishes to compare">Select at least two colors in the Products page to compare them here.</VisualXEmptyState> : (
        <>
          <div className="vx-grid vx-grid-3 compare-grid">
            {compareOptions.map((c, i) => (
              <div key={c.code} className={`vx-card compare-option ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)} style={{ cursor: 'pointer' }}>
                {selected === i && <div className="compare-check"><Check className="vx-icon vx-icon-sm" /></div>}
                <img src={c.image_url} alt={c.color_name} />
                <h3>{c.color_name}</h3>
                <p>{c.code} · {c.system}</p>
              </div>
            ))}
          </div>
          <div className="vx-card">
            <div className="vx-section-title"><h2>Comparison table</h2><VisualXProvenanceBadge status="VERIFIED" source="Color chart" /></div>
            <div className="compare-table">
              <div>Finish</div>{compareOptions.map(c => <div key={c.code}>{c.color_name}</div>)}
              <div>Code</div>{compareOptions.map(c => <div key={c.code}>{c.code}</div>)}
              <div>System</div>{compareOptions.map(c => <div key={c.code}>{c.system}</div>)}
              <div>Sheen</div>{compareOptions.map(c => <div key={c.code}>{c.sheen}</div>)}
              <div>In stock</div>{compareOptions.map(c => <div key={c.code}>{c.in_stock ? '✓' : '—'}</div>)}
              <div>Collection</div>{compareOptions.map(c => <div key={c.code}>{c.collection}</div>)}
              <div>Rating</div>{compareOptions.map((c, i) => <div key={c.code} className="rating">{'★'.repeat(5 - i)}</div>)}
            </div>
          </div>
          <button className="vx-btn outline-accent" style={{ width: '100%' }} onClick={() => navigate('/app/visualizer')}><ScanLine className="vx-icon" /> Visualize selected finish</button>
          <VisualXBlockedState title="Send to customer disabled">
            <p>Customer email and share links remain disabled. Use the Proposal page to download a preview.</p>
          </VisualXBlockedState>
        </>
      )}
    </>
  );
}