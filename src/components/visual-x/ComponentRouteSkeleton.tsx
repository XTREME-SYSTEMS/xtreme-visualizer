import { useMemo, useState } from 'react';
import { ArrowRight, Database, Image, Layers3, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { AppState } from '../../types';
import type { ScreenConfig, ScreenKey } from '../../data/screens';
import { VisualXAppShell } from './VisualXAppShell';
import {
  VisualXBlockedState,
  VisualXButton,
  VisualXCard,
  VisualXDrawer,
  VisualXEmptyState,
  VisualXPage,
  VisualXProvenanceBadge,
  VisualXStatusBadge
} from './VisualXPrimitives';

const copy: Record<ScreenKey, { summary: string; next: string; blocked?: string }> = {
  home: { summary: 'Command center skeleton for verified projects, recent activity, and fast actions.', next: 'R01 will reconstruct the approved command-center geometry.' },
  lead: { summary: 'Lead capture skeleton using additive /api/v2 contracts and audit receipts.', next: 'R02 will implement validated lead creation and lead-to-project conversion.' },
  products: { summary: 'Catalog skeleton using the local system, product, and color source-truth records.', next: 'R03 will implement search, filtering, selections, and provenance.' },
  quote: { summary: 'Quote skeleton with customer pricing disabled until a verified source and approver exist.', next: 'R04 will implement line items, deterministic calculations, revisions, and receipts.', blocked: 'Customer-facing pricing is disabled in normal mode.' },
  scan: { summary: 'Photo and measurement skeleton for persisted uploads and manual verification.', next: 'R05 will implement upload validation, multiple areas, and manual masks.', blocked: 'Automatic AI masking is outside Phase 1.' },
  proposal: { summary: 'Proposal skeleton for draft generation and preview download.', next: 'R06 will implement proposal versions and non-binding preview documents.', blocked: 'Legal e-signature and customer delivery remain gated.' },
  visualizer: { summary: 'Visualizer skeleton for manual masks, verified finishes, and approximation labels.', next: 'R07 will implement deterministic compositing and saved visualizations.' },
  compare: { summary: 'Comparison skeleton for saved visualization options.', next: 'R08 will implement side-by-side and split-view comparison.' },
  blends: { summary: 'Flake blend skeleton backed by verified local color assets.', next: 'R09 will implement blend selection and persistence.' },
  metallic: { summary: 'Metallic studio skeleton backed by verified local metallic color records.', next: 'R10 will implement metallic selection and preview controls.' }
};

function countFor(key: ScreenKey, state: AppState) {
  if (key === 'products' || key === 'blends' || key === 'metallic') return `${state.colors.length} colors`;
  if (key === 'home') return `${state.systems.length} systems`;
  if (key === 'lead') return `${state.leads.length} leads`;
  if (key === 'quote') return `${state.quotes.length} quotes`;
  if (key === 'proposal') return `${state.proposals.length} proposals`;
  if (key === 'scan' || key === 'visualizer' || key === 'compare') return `${state.projects.length} projects`;
  return 'Runtime ready';
}

export function ComponentRouteSkeleton({ screen, state }: { screen: ScreenConfig; state: AppState }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const details = copy[screen.key];
  const records = useMemo(() => {
    if (screen.key === 'products') return state.systems.slice(0, 3).map(item => ({ id: item.slug, title: item.name, status: item.verificationStatus || 'PARTIAL' }));
    if (screen.key === 'blends') return state.colors.filter(item => item.system.toLowerCase().includes('flake')).slice(0, 3).map(item => ({ id: item.code, title: item.color_name, status: 'VERIFIED' }));
    if (screen.key === 'metallic') return state.colors.filter(item => item.system.toLowerCase().includes('metallic')).slice(0, 3).map(item => ({ id: item.code, title: item.color_name, status: 'VERIFIED' }));
    return [];
  }, [screen.key, state]);

  return <VisualXAppShell title={screen.title} onOpenMore={() => setDrawerOpen(true)}>
    <VisualXPage data-component-route={screen.key}>
      <section className="vx-hero"><div><span className="vx-kicker">PHASE 1 · A40 SHELL</span><h2>{screen.title}</h2><p>{details.summary}</p></div><VisualXStatusBadge status="draft">Skeleton</VisualXStatusBadge></section>
      <div className="vx-metric-grid">
        <VisualXCard><Database/><small>Source truth</small><strong>{countFor(screen.key, state)}</strong></VisualXCard>
        <VisualXCard><ShieldCheck/><small>Runtime mode</small><strong>{state.meta.dataMode || 'normal'}</strong></VisualXCard>
        <VisualXCard><LockKeyhole/><small>Route flag</small><strong>Enabled for preview</strong></VisualXCard>
      </div>
      <VisualXCard className="vx-section-card"><header><div><small>IMPLEMENTATION CONTRACT</small><h2>Shared shell ready</h2></div><Layers3/></header><p>{details.next}</p><ul className="vx-contract-list"><li>Approved reference remains unchanged.</li><li>Normal runtime uses verified local records or honest empty states.</li><li>New consequential writes require idempotency and audit receipts.</li><li>Route can roll back independently to the frozen PNG shell.</li></ul></VisualXCard>
      {records.length > 0 && <VisualXCard className="vx-section-card"><header><div><small>AVAILABLE SOURCE RECORDS</small><h2>Verified local inventory</h2></div><Image/></header><div className="vx-record-list">{records.map(record => <div key={record.id}><span><strong>{record.title}</strong><small>{record.id}</small></span><VisualXProvenanceBadge status={record.status}/></div>)}</div></VisualXCard>}
      {details.blocked ? <VisualXBlockedState title="External gate preserved"><p>{details.blocked}</p></VisualXBlockedState> : records.length === 0 ? <VisualXEmptyState title="No normal-runtime business records"><p>Visual X will not invent records to make this route look populated. Detailed workflow implementation is assigned to {details.next.split(' ')[0]}.</p></VisualXEmptyState> : null}
      <VisualXButton variant="primary" disabled aria-disabled="true">Continue in route packet <ArrowRight /></VisualXButton>
    </VisualXPage>
    <VisualXDrawer open={drawerOpen} title="Visual X component preview" onClose={() => setDrawerOpen(false)}><p>This route is using the A40 component shell because its development feature flag is enabled.</p><dl className="vx-definition-list"><div><dt>Runtime mode</dt><dd>{state.meta.dataMode || 'normal'}</dd></div><div><dt>External actions</dt><dd>Disabled</dd></div><div><dt>Fallback</dt><dd>Frozen approved PNG shell</dd></div></dl></VisualXDrawer>
  </VisualXAppShell>;
}
