import { useState, useMemo } from 'react';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXSelect, VisualXEmptyState, VisualXProvenanceBadge, VisualXBlockedState } from '../VisualXPrimitives';
import { FLOOR_TYPE_OPTIONS, generateSpecs } from '@/data/floorSpecs';
import { Download, Share2, FileText } from 'lucide-react';
import { WARRANTY_TEXT, FINE_PRINT } from '@/lib/proposalBuilder';
import { AI_DISCLOSURE, PRICE_DISCLOSURE } from '@/lib/brand';

export function ProposalRoute() {
  const { state, notify, refresh } = useApp();
  const quotes = state?.quotes || [];
  const [quoteId, setQuoteId] = useState('');
  const [floorType, setFloorType] = useState(FLOOR_TYPE_OPTIONS[0]);
  const [generating, setGenerating] = useState(false);

  const selectedQuote = quotes.find(q => q.id === quoteId);
  const calc = useMemo(() => selectedQuote ? api.calculateQuote({ lineItems: selectedQuote.lineItems, marginPercent: selectedQuote.marginPercent, rangeVariancePercent: 8 }) : null, [selectedQuote]);
  const specs = useMemo(() => generateSpecs(floorType, { needs_perimeter: true }), [floorType]);

  const generate = async () => {
    if (!quoteId) { notify('Select a quote first.'); return; }
    setGenerating(true);
    try {
      const scope = specs.map(s => `${s.label}: ${s.detail}`).join('\n');
      await api.v2.create('proposals', { leadId: selectedQuote?.projectId || '', companyName: selectedQuote?.customerName || '', scopeSummary: `${floorType} — ${specs.length} scope items`, contentMarkdown: scope, status: 'draft' });
      notify('Proposal draft generated with audit receipt.');
      await refresh();
    } catch (e) { notify('Generation failed: ' + (e instanceof Error ? e.message : 'error')); }
    finally { setGenerating(false); }
  };

  const downloadPreview = () => {
    const content = `VISUAL X PROPOSAL\n\nCustomer: ${selectedQuote?.customerName || ''}\nFloor System: ${floorType}\n\nSCOPE OF WORK\n${specs.map((s, i) => `${i + 1}. ${s.label}: ${s.detail}`).join('\n')}\n\nESTIMATE\nSubtotal: $${calc?.subtotal.toFixed(0) || 0}\nTotal: $${calc?.total.toFixed(0) || 0}\nRange: $${calc?.low.toFixed(0) || 0} – $${calc?.high.toFixed(0) || 0}\n\n${PRICE_DISCLOSURE}\n\n${WARRANTY_TEXT}\n\n${FINE_PRINT}\n\n${AI_DISCLOSURE}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'visual-x-proposal.txt'; a.click(); URL.revokeObjectURL(a.href);
    notify('Proposal preview downloaded.');
  };

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); notify('Share link copied to clipboard.'); };

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">PROPOSAL SHARE</span><h1>Proposal</h1><p>Generate a non-binding proposal preview from a saved quote.</p></div></div>
      {quotes.length === 0 ? <VisualXEmptyState title="No quotes available">Save a quote first to generate a proposal.</VisualXEmptyState> : (
        <>
          <div className="vx-card">
            <VisualXSelect label="Select quote" value={quoteId} onChange={setQuoteId} options={[{ value: '', label: '— Select —' }, ...quotes.map(q => ({ value: q.id, label: `${q.customerName} — $${q.lineItems.reduce((s, i) => s + i.quantity * i.rate, 0).toFixed(0)}` }))]} />
            <div style={{ marginTop: 8 }}><VisualXSelect label="Floor system type" value={floorType} onChange={setFloorType} options={FLOOR_TYPE_OPTIONS.map(f => ({ value: f, label: f }))} /></div>
          </div>
          <div className="proposal-cover">
            <div className="proposal-cover-content">
              <div><span className="vx-kicker" style={{ color: 'var(--vx-accent)' }}>VISUAL X · PROPOSAL</span><h1>{selectedQuote?.customerName || 'Customer name'}</h1><p>{floorType}</p></div>
              <div><p>Project estimate</p><span className="proposal-price">${calc?.total.toFixed(0) || '—'}</span><p className="vx-faint">Requires contractor verification</p></div>
            </div>
          </div>
          <div className="vx-card">
            <div className="vx-section-title"><h2>Scope of work</h2><VisualXProvenanceBadge status="VERIFIED" source="Floor spec template" /></div>
            {specs.map((s, i) => (
              <div className="proposal-section" key={i}><header><span className="vx-chip ready">{i + 1}</span><h3>{s.label}</h3></header><p>{s.detail}</p></div>
            ))}
          </div>
          <div className="vx-card">
            <div className="vx-section-title"><h2>Estimate summary</h2></div>
            <div className="quote-summary">
              <div><span>Subtotal</span><span>${calc?.subtotal.toFixed(0) || 0}</span></div>
              <div><span>Margin</span><span>${calc?.margin.toFixed(0) || 0}</span></div>
              <div className="total"><span>Total</span><span>${calc?.total.toFixed(0) || 0}</span></div>
            </div>
            <div className="estimate-range" style={{ marginTop: 12 }}><small>Range (±8%)</small><strong>${calc?.low.toFixed(0) || 0} – ${calc?.high.toFixed(0) || 0}</strong></div>
          </div>
          <div className="vx-card">
            <div className="vx-section-title"><h2>Workmanship warranty</h2><VisualXProvenanceBadge status="VERIFIED" source="vx2 proposal builder" /></div>
            <p className="vx-muted" style={{ fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{WARRANTY_TEXT}</p>
          </div>
          <div className="vx-card">
            <div className="vx-section-title"><h2>Terms &amp; conditions</h2></div>
            <p className="vx-muted" style={{ fontSize: 12, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{FINE_PRINT}</p>
          </div>
          <div className="vx-grid vx-grid-3 proposal-actions">
            <button className="proposal-action primary" onClick={generate} disabled={generating || !quoteId}><FileText className="vx-icon" />{generating ? 'Generating…' : 'Generate draft'}</button>
            <button className="proposal-action" onClick={downloadPreview}><Download className="vx-icon" />Download preview</button>
            <button className="proposal-action" onClick={copyLink}><Share2 className="vx-icon" />Copy share link</button>
          </div>
          <VisualXBlockedState title="Legally binding e-signature disabled">
            <p>Request signature and customer delivery remain disabled. Download the preview and deliver manually.</p>
          </VisualXBlockedState>
        </>
      )}
    </>
  );
}