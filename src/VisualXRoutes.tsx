import { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ControlDrawer } from './components/ControlDrawer';
import { ScreenCanvas } from './components/ScreenCanvas';
import { useApp } from './components/AppProvider';
import { ComponentRouteSkeleton, VisualXAppShell, VisualXDrawer, VisualXErrorState, VisualXLoadingState, VisualXPage, componentFeatureFlagByScreen } from './components/visual-x';
import { screenByKey, screens, type ScreenKey } from './data/screens';

function LegacyVisualXScreen({ keyName }: { keyName: ScreenKey }) {
  const navigate = useNavigate();
  const { state, notice, notify } = useApp();
  const screen = screenByKey[keyName] || screenByKey.home;
  const [drawer, setDrawer] = useState('');
  const routeMap = useMemo(() => Object.fromEntries(screens.map(s => [s.key, s.route])), []);
  const go = (target: string) => navigate(routeMap[target] || '/app/home');
  const share = async (title: string, text: string) => {
    try {
      if (navigator.share) await navigator.share({ title, text, url: window.location.href });
      else { await navigator.clipboard.writeText(`${title}\n${text}\n${window.location.href}`); notify('Share content copied to clipboard.'); }
    } catch { notify('Share cancelled.'); }
  };
  const downloadProposal = () => {
    const proposal = state?.proposals[0];
    const quote = state?.quotes[0];
    const content = `VISUAL X PROPOSAL\n${proposal?.id || ''}\nCustomer: ${proposal?.customerName || ''}\nAddress: ${proposal?.address || ''}\nSystem: ${proposal?.system || ''}\nSquare Feet: ${proposal?.squareFeet || 0}\nQuote: ${JSON.stringify(quote, null, 2)}\n\nPricing and warranty require final contractor verification.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${proposal?.id || 'visual-x-proposal'}.txt`; a.click(); URL.revokeObjectURL(a.href);
    notify('Proposal preview file created.');
  };
  const onAction = (action: string) => {
    const [kind, value] = action.split(':');
    if (kind === 'go') return go(value);
    if (kind === 'drawer') return setDrawer(value);
    if (kind === 'save') return notify(`${value.replace(/-/g,' ')} remains in the frozen legacy preview until its component route is approved.`);
    if (kind === 'generate') { notify('Proposal generation is assigned to the R06 component route.'); return go('proposal'); }
    if (kind === 'share') {
      if (value === 'followup') return void share('Visual X Follow-up', 'Your floor visualization and estimate are ready for review.');
      if (value === 'compare') return void share('Visual X Finish Comparison', 'Review the selected floor finish options.');
      return void share('Visual X Proposal', 'Review your Visual X floor proposal.');
    }
    if (kind === 'download') return downloadProposal();
    if (kind === 'sign') return setDrawer('proposal');
  };
  return <>
    <ScreenCanvas screen={screen} onAction={onAction}/>
    <nav className="screen-rail" aria-label="All Visual X screens">{screens.map((s,index)=><button key={s.key} className={s.key===screen.key?'active':''} onClick={()=>go(s.key)}><span>{String(index+1).padStart(2,'0')}</span>{s.title}</button>)}</nav>
    {drawer && <ControlDrawer mode={drawer} onClose={()=>setDrawer('')} onNavigate={go}/>} 
    {notice && <div className="toast-notice" role="status" aria-live="polite">{notice}</div>}
  </>;
}

export function VisualXScreen() {
  const params = useParams();
  const { state, loading, error, refresh } = useApp();
  const key = (params.screen || 'home') as ScreenKey;
  const screen = screenByKey[key] || screenByKey.home;
  const [statusDrawer, setStatusDrawer] = useState(false);
  if (loading) return <VisualXAppShell title={screen.title} onOpenMore={() => setStatusDrawer(true)}><VisualXPage><VisualXLoadingState label={`Loading ${screen.title}…`}/></VisualXPage><VisualXDrawer open={statusDrawer} title="Loading status" onClose={() => setStatusDrawer(false)}><p>Visual X is waiting for the normal-runtime data source.</p></VisualXDrawer></VisualXAppShell>;
  if (error || !state) return <VisualXAppShell title={screen.title} status="blocked" onOpenMore={() => setStatusDrawer(true)}><VisualXPage><VisualXErrorState error={error || 'Runtime state was unavailable.'} retry={() => void refresh()}/></VisualXPage><VisualXDrawer open={statusDrawer} title="Runtime status" onClose={() => setStatusDrawer(false)}><p>No success state is shown until the backend returns verified data.</p></VisualXDrawer></VisualXAppShell>;
  const flag = componentFeatureFlagByScreen[screen.key];
  return state.featureFlags?.[flag] ? <ComponentRouteSkeleton screen={screen} state={state}/> : <LegacyVisualXScreen keyName={screen.key}/>;
}

export default function VisualXRoutes(){
 return <Routes><Route path="/" element={<Navigate to="/app/home" replace/>}/><Route path="/app/:screen" element={<VisualXScreen/>}/><Route path="*" element={<Navigate to="/app/home" replace/>}/></Routes>;
}