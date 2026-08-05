import { useEffect, useMemo, useState } from 'react';
import { Check, Download, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from './AppProvider';
import type { Lead, Proposal, Quote, QuoteCalculation } from '../types';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export function ControlDrawer({ mode, onClose, onNavigate }: { mode: string; onClose: () => void; onNavigate: (screen: string) => void }) {
  const { state, refresh, notify, selectedColorIds, toggleColor, selectedSystemSlug, setSelectedSystemSlug } = useApp();
  const [query, setQuery] = useState('');
  const [quote, setQuote] = useState<Quote | null>(state?.quotes[0] || null);
  const [calc, setCalc] = useState<QuoteCalculation | null>(null);
  const [lead, setLead] = useState<Lead | null>(state?.leads[0] || null);
  const [proposal, setProposal] = useState<Proposal | null>(state?.proposals[0] || null);
  useEffect(() => { setQuote(state?.quotes[0] || null); setLead(state?.leads[0] || null); setProposal(state?.proposals[0] || null); }, [state]);
  useEffect(() => { if (quote) void api.calculateQuote(quote).then(setCalc); }, [quote]);
  const filteredColors = useMemo(() => (state?.colors || []).filter(c => `${c.color_name} ${c.code} ${c.system} ${c.collection}`.toLowerCase().includes(query.toLowerCase())).slice(0, 80), [state, query]);
  if (!state) return null;

  const saveQuote = async () => {
    if (!quote) return;
    await api.update<Quote>('quotes', quote.id, quote); await refresh(); notify('Quote saved to the backend.');
  };
  const saveLead = async () => {
    if (!lead) return;
    await api.update<Lead>('leads', lead.id, lead); await refresh(); notify('Lead saved to the backend.');
  };
  const saveProposal = async () => {
    if (!proposal) return;
    await api.update<Proposal>('proposals', proposal.id, proposal); await refresh(); notify('Proposal saved to the backend.');
  };
  return (
    <div className="drawer-backdrop" onMouseDown={e => { if (e.currentTarget === e.target) onClose(); }}>
      <section className="control-drawer" aria-label={`${mode} controls`}>
        <header><div><small>OPERATIONAL CONTROL</small><h2>{titleFor(mode)}</h2></div><button onClick={onClose}><X /></button></header>
        {mode === 'catalog' || mode === 'colors' ? (
          <>
            <div className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search 228 color records" /></div>
            <div className="system-pills">{state.systems.map(s => <button className={s.slug === selectedSystemSlug ? 'active' : ''} key={s.slug} onClick={() => setSelectedSystemSlug(s.slug)}>{s.name}<small>{money.format(s.base_rate_low)}–{money.format(s.base_rate_high)}/sq ft</small></button>)}</div>
            <div className="color-grid">{filteredColors.map(c => <button key={c.code} className={selectedColorIds.includes(c.code) ? 'selected' : ''} onClick={() => toggleColor(c.code)}><img src={c.local_image} alt={c.color_name}/><strong>{c.color_name}</strong><span>{c.code} · {c.collection}</span>{selectedColorIds.includes(c.code) && <i><Check size={13}/></i>}</button>)}</div>
            <div className="sticky-actions"><span>{selectedColorIds.length} selected</span><button className="primary" onClick={() => { notify('Selected colors attached to the visualization.'); onNavigate('visualizer'); onClose(); }}>Attach to Visualization</button></div>
          </>
        ) : mode === 'quote' && quote ? (
          <div className="form-stack">
            <div className="two-col"><label>Customer<input value={quote.customerName} onChange={e => setQuote({...quote, customerName:e.target.value})}/></label><label>Margin %<input type="number" value={quote.marginPercent} onChange={e => setQuote({...quote, marginPercent:Number(e.target.value)})}/></label></div>
            <div className="line-editor">{quote.lineItems.map((item,index) => <div className="line" key={item.id}><div><input value={item.name} onChange={e => setQuote({...quote,lineItems:quote.lineItems.map((x,i)=>i===index?{...x,name:e.target.value}:x)})}/><small>{item.detail}</small></div><input type="number" value={item.quantity} onChange={e => setQuote({...quote,lineItems:quote.lineItems.map((x,i)=>i===index?{...x,quantity:Number(e.target.value)}:x)})}/><input type="number" step="0.01" value={item.rate} onChange={e => setQuote({...quote,lineItems:quote.lineItems.map((x,i)=>i===index?{...x,rate:Number(e.target.value)}:x)})}/><strong>{money.format(item.quantity*item.rate)}</strong></div>)}</div>
            {calc && <div className="totals"><span>Subtotal <b>{money.format(calc.subtotal)}</b></span><span>Margin <b>{money.format(calc.margin)}</b></span><span className="grand">Estimated range <b>{money.format(calc.low)}–{money.format(calc.high)}</b></span></div>}
            <p className="notice">Pricing mirrors the approved screen and remains editable. Verify products, labor, taxes, warranties, preparation, repairs, mobilization, and site conditions before live customer use.</p>
            <button className="primary" onClick={saveQuote}>Save Quote</button>
          </div>
        ) : mode === 'lead' && lead ? (
          <div className="form-stack"><label>Customer<input value={lead.customerName} onChange={e=>setLead({...lead,customerName:e.target.value})}/></label><label>Address<input value={lead.address} onChange={e=>setLead({...lead,address:e.target.value})}/></label><div className="two-col"><label>Square feet<input type="number" value={lead.squareFeet} onChange={e=>setLead({...lead,squareFeet:Number(e.target.value)})}/></label><label>Desired finish<input value={lead.finish} onChange={e=>setLead({...lead,finish:e.target.value})}/></label></div><h3>Follow-up tasks</h3>{lead.tasks.map((task,index)=><label className="task" key={task.id}><input type="checkbox" checked={task.done} onChange={e=>setLead({...lead,tasks:lead.tasks.map((x,i)=>i===index?{...x,done:e.target.checked}:x)})}/><span>{task.label}<small>{task.priority} · {task.due}</small></span></label>)}<button className="primary" onClick={saveLead}>Save Lead</button></div>
        ) : mode === 'proposal' && proposal ? (
          <div className="form-stack"><label>Customer<input value={proposal.customerName} onChange={e=>setProposal({...proposal,customerName:e.target.value})}/></label><label>System<input value={proposal.system} onChange={e=>setProposal({...proposal,system:e.target.value})}/></label><label>Timeline<input value={proposal.timeline} onChange={e=>setProposal({...proposal,timeline:e.target.value})}/></label><label>Warranty<textarea value={proposal.warranty} onChange={e=>setProposal({...proposal,warranty:e.target.value})}/></label><label>Signer name<input value={proposal.signature.name} onChange={e=>setProposal({...proposal,signature:{...proposal.signature,name:e.target.value}})}/></label><button className="primary" onClick={async()=>{const signed={...proposal,signature:{status:'signed',name:proposal.signature.name||'Customer',signedAt:new Date().toISOString()},status:'approved'};setProposal(signed);await api.update('proposals',proposal.id,signed);await refresh();notify('Proposal signed and stored.');}}>Accept & Sign</button><button onClick={saveProposal}>Save Proposal Draft</button></div>
        ) : mode === 'scan' ? <ScanControls notify={notify} onNavigate={onNavigate} onClose={onClose}/> : mode === 'visualizer' || mode === 'compare' ? <VisualizerControls systems={state.systems} selected={selectedSystemSlug} setSelected={setSelectedSystemSlug} notify={notify}/> : (
          <div className="form-stack"><p>Visual X is running with a local Node backend, JSON persistence, 10 locked parity screens, 11 floor systems, 12 product and pricing records, and 228 offline color-chart swatches.</p><button onClick={async()=>{const result=await api.reset();await refresh();notify(`Demo reset: ${result.state.projects.length} projects restored.`);}}>Reset Demo Data</button><button className="download" onClick={()=>downloadJson(state,'visual-x-data.json')}><Download size={17}/> Export Complete Data</button></div>
        )}
      </section>
    </div>
  );
}
function ScanControls({notify,onNavigate,onClose}:{notify:(s:string)=>void;onNavigate:(s:string)=>void;onClose:()=>void}) {
 const [length,setLength]=useState(25); const [width,setWidth]=useState(50); const [file,setFile]=useState('');
 return <div className="form-stack"><label>Capture floor photo<input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]?.name||'')}/></label>{file&&<p className="success">Loaded: {file}</p>}<div className="two-col"><label>Length (ft)<input type="number" value={length} onChange={e=>setLength(Number(e.target.value))}/></label><label>Width (ft)<input type="number" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label></div><div className="measurement"><strong>{(length*width).toLocaleString()} SQ FT</strong><span>Manual verification measurement</span></div><button className="primary" onClick={()=>{notify('Room capture saved. Continue to the live visualizer.');onNavigate('visualizer');onClose();}}>Use Measurement</button></div>;
}
function VisualizerControls({systems,selected,setSelected,notify}:{systems:{slug:string;name:string;base_rate_low:number;base_rate_high:number}[];selected:string;setSelected:(s:string)=>void;notify:(s:string)=>void}) {
 const [gloss,setGloss]=useState(80),[texture,setTexture]=useState(50),[coverage,setCoverage]=useState(100);
 return <div className="form-stack"><div className="system-list">{systems.map(s=><button key={s.slug} className={selected===s.slug?'active':''} onClick={()=>setSelected(s.slug)}><strong>{s.name}</strong><span>${s.base_rate_low}–${s.base_rate_high}/sq ft</span></button>)}</div>{[['Gloss',gloss,setGloss],['Texture',texture,setTexture],['Coverage',coverage,setCoverage]].map(([n,v,set]:any)=><label key={n}>{n}: {v}%<input type="range" min="0" max="100" value={v} onChange={e=>set(Number(e.target.value))}/></label>)}<button className="primary" onClick={()=>notify('Visualization settings saved locally.')}>Save Visualization Settings</button></div>;
}
function titleFor(mode:string){return ({catalog:'Products & Color Charts',colors:'Color Selection',quote:'Smart Quote Editor',lead:'Lead & Task Editor',proposal:'Proposal & Signature',scan:'Room Scan & Measurement',visualizer:'Visualizer Controls',compare:'Finish Comparison',settings:'System Settings'} as Record<string,string>)[mode]||'Visual X Controls';}
function downloadJson(data:unknown,name:string){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
