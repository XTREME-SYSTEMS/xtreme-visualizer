import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { VisualXEmptyState, VisualXProvenanceBadge } from '../VisualXPrimitives';
import { ScanLine, GitCompare, ReceiptText, Layers3, TrendingUp } from 'lucide-react';

export function HomeRoute() {
  const { state } = useApp();
  const navigate = useNavigate();
  const projects = state?.projects || [];
  const systems = state?.systems || [];
  const leads = state?.leads || [];
  const quotes = state?.quotes || [];

  return (
    <>
      <div className="home-hero">
        <img src="https://media.base44.com/images/public/6a72dc735df4ab468b4b1441/da4c57643_generated_image.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div className="home-hero-content">
          <span className="vx-kicker">VISUAL X · COMMAND CENTER</span>
          <h1>Design, quote,<span>and win floors.</span></h1>
          <p>Scan spaces, visualize finishes, generate quotes, and share proposals — all from one verified workspace.</p>
        </div>
      </div>
      <div className="home-actions">
        <button className="home-action" onClick={() => navigate('/app/scan')}><ScanLine className="vx-icon" /><span>New visualization</span></button>
        <button className="home-action" onClick={() => navigate('/app/compare')}><GitCompare className="vx-icon" /><span>Compare finishes</span></button>
        <button className="home-action" onClick={() => navigate('/app/quote')}><ReceiptText className="vx-icon" /><span>Quote range</span></button>
        <button className="home-action" onClick={() => navigate('/app/proposal')}><Layers3 className="vx-icon" /><span>Share proposal</span></button>
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Recent projects</h2><button onClick={() => navigate('/app/lead')}>New lead</button></div>
        {projects.length === 0 ? <VisualXEmptyState title="No projects yet">Start by capturing a lead or scanning a space.</VisualXEmptyState> : (
          <div className="project-list">
            {projects.slice(0, 6).map(p => (
              <div key={p.id} className="project-row" onClick={() => navigate('/app/quote')} style={{ cursor: 'pointer' }}>
                {p.image ? <img className="project-thumb" src={p.image} alt="" /> : <div className="project-thumb" style={{ background: 'var(--vx-panel-3)', display: 'grid', placeItems: 'center', color: 'var(--vx-faint)' }}><Layers3 className="vx-icon" /></div>}
                <div><h3>{p.name}</h3><p>{p.address}</p><span className="vx-chip ready">{p.status}</span></div>
                <div className="project-side"><time>{new Date(p.updatedAt).toLocaleDateString()}</time></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Workspace stats</h2><VisualXProvenanceBadge status="VERIFIED" source="Base44 entity records" /></div>
        <div className="vx-stat-row">
          <div className="vx-stat"><strong>{systems.length}</strong><small>Floor systems</small><em>Verified catalog</em></div>
          <div className="vx-stat"><strong>{leads.length}</strong><small>Active leads</small><em>Operator-entered</em></div>
          <div className="vx-stat"><strong>{quotes.length}</strong><small>Quotes drafted</small><em>Internal only</em></div>
        </div>
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Quick estimate</h2><TrendingUp className="vx-icon" /></div>
        <div className="estimate-range">
          <small>Get a rough price range before a full quote</small>
          <strong>$4 – $12 / sq ft</strong>
          <small className="vx-faint">Rates require contractor verification before customer-facing use.</small>
        </div>
        <button className="vx-btn outline-accent" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/app/quote')}>Build a quote</button>
      </div>
    </>
  );
}