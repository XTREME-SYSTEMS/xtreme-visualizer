import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXSelect, VisualXButton, VisualXSlider, VisualXEmptyState, VisualXProvenanceBadge, VisualXBlockedState } from '../VisualXPrimitives';
import { Plus, Save, FileText, Copy } from 'lucide-react';

export function QuoteRoute() {
  const { state, notify, refresh } = useApp();
  const navigate = useNavigate();
  const leads = state?.leads || [];
  const [leadId, setLeadId] = useState('');
  const [lineItems, setLineItems] = useState([
    { id: '1', name: 'Surface prep', detail: 'Diamond grind', quantity: 0, unit: 'sq ft', rate: 1.5 },
    { id: '2', name: 'Base coat', detail: 'Epoxy primer', quantity: 0, unit: 'sq ft', rate: 2.0 },
    { id: '3', name: 'Finish system', detail: 'Selected system', quantity: 0, unit: 'sq ft', rate: 3.5 },
    { id: '4', name: 'Top coat', detail: 'Polyaspartic clear', quantity: 0, unit: 'sq ft', rate: 1.5 },
  ]);
  const [margin, setMargin] = useState(25);
  const [saving, setSaving] = useState(false);

  const selectedLead = leads.find(l => l.id === leadId);
  const sqft = selectedLead?.squareFeet || 0;
  const calc = useMemo(() => api.calculateQuote({ lineItems, marginPercent: margin, rangeVariancePercent: 8 }), [lineItems, margin]);

  const updateItem = (id: string, field: string, value: any) => setLineItems(items => items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addItem = () => setLineItems(items => [...items, { id: String(Date.now()), name: '', detail: '', quantity: 0, unit: 'sq ft', rate: 0 }]);
  const removeItem = (id: string) => setLineItems(items => items.filter(i => i.id !== id));
  const applySqft = () => { if (sqft > 0) { setLineItems(items => items.map(i => ({ ...i, quantity: sqft }))); notify(`Applied ${sqft} sq ft to all items.`); } else notify('Select a lead with square footage first.'); };

  const save = async () => {
    if (!leadId) { notify('Select a lead first.'); return; }
    setSaving(true);
    try {
      const result = await api.v2.create('quotes', { projectId: leadId, customerName: selectedLead?.customerName || '', lineItems, marginPercent: margin, status: 'internal_draft' });
      notify('Quote saved.');
      await refresh();
    } catch (e) { notify('Save failed: ' + (e instanceof Error ? e.message : 'error')); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="vx-page-header"><div><span className="vx-kicker">SMART QUOTE</span><h1>Quote builder</h1><p>Build an internal quote with deterministic calculations.</p></div></div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Project</h2><VisualXProvenanceBadge status="VERIFIED" source="Lead record" /></div>
        {leads.length === 0 ? <VisualXEmptyState title="No leads available">Capture a lead first to build a quote.</VisualXEmptyState> : (
          <>
            <VisualXSelect label="Select lead" value={leadId} onChange={setLeadId} options={[{ value: '', label: '— Select —' }, ...leads.map(l => ({ value: l.id, label: `${l.customerName} — ${l.address}` }))]} />
            {selectedLead && <div className="vx-muted" style={{ marginTop: 8 }}>{selectedLead.squareFeet} sq ft · {selectedLead.floorCondition} condition</div>}
          </>
        )}
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Line items</h2><button className="vx-btn compact" onClick={applySqft}><Copy className="vx-icon vx-icon-sm" /> Apply sq ft</button></div>
        <div className="quote-table">
          <div className="quote-head"><div>Item</div><div>Qty</div><div>Rate</div><div>Total</div></div>
          {lineItems.map(item => (
            <div key={item.id} className="quote-line">
              <div><strong>{item.name || '—'}</strong><small>{item.detail}</small></div>
              <div><input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} style={{ width: 56, background: 'var(--vx-bg-2)', border: '1px solid var(--vx-border)', borderRadius: 6, padding: 4, color: 'var(--vx-text)' }} /></div>
              <div><input type="number" value={item.rate} step="0.5" onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} style={{ width: 56, background: 'var(--vx-bg-2)', border: '1px solid var(--vx-border)', borderRadius: 6, padding: 4, color: 'var(--vx-text)' }} /></div>
              <div>${(item.quantity * item.rate).toFixed(0)}</div>
            </div>
          ))}
        </div>
        <div className="vx-row" style={{ marginTop: 8 }}>
          <button className="vx-btn compact" onClick={addItem}><Plus className="vx-icon vx-icon-sm" /> Add item</button>
        </div>
      </div>
      <div className="vx-card">
        <VisualXSlider label="Margin" value={margin} min={0} max={50} step={1} onChange={setMargin} unit="%" />
        <div className="quote-summary">
          <div><span>Subtotal</span><span>${calc.subtotal.toFixed(0)}</span></div>
          <div><span>Margin ({margin}%)</span><span>${calc.margin.toFixed(0)}</span></div>
          <div className="total"><span>Total</span><span>${calc.total.toFixed(0)}</span></div>
        </div>
        <div className="estimate-range" style={{ marginTop: 12 }}>
          <small>Estimate range (±8%)</small>
          <strong>${calc.low.toFixed(0)} – ${calc.high.toFixed(0)}</strong>
        </div>
      </div>
      <div className="vx-grid vx-grid-2">
        <VisualXButton variant="primary" onClick={save} disabled={saving || !leadId}><Save className="vx-icon" />{saving ? 'Saving…' : 'Save draft'}</VisualXButton>
        <VisualXButton variant="outline-accent" onClick={() => navigate('/app/proposal')}><FileText className="vx-icon" />Generate proposal</VisualXButton>
      </div>
      <VisualXBlockedState title="Customer-facing pricing disabled">
        <p>Unverified prices must not appear as approved live pricing. Rates require contractor verification before customer delivery.</p>
      </VisualXBlockedState>
    </>
  );
}