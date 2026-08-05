export const componentFeatureFlagByScreen = {
  home: 'feature_component_home',
  lead: 'feature_component_lead',
  products: 'feature_component_products',
  quote: 'feature_component_quote',
  scan: 'feature_component_scan',
  proposal: 'feature_component_proposal',
  visualizer: 'feature_component_visualizer',
  compare: 'feature_component_compare',
  blends: 'feature_component_blends',
  metallic: 'feature_component_metallic'
};

const copy = {
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

export function isComponentEnabled(state, key) {
  return Boolean(state?.featureFlags?.[componentFeatureFlagByScreen[key]]);
}

export function renderShellLoading(title = 'Visual X') {
  return shell({ title, status: 'Loading', body: statePanel('loading', 'Loading verified runtime data', 'Visual X is waiting for the normal-runtime source.'), current: 'home' });
}

export function renderShellError(title = 'Visual X', message = 'Runtime state was unavailable.') {
  return shell({ title, status: 'Blocked', body: statePanel('error', 'Visual X could not load', escapeHtml(message), '<button class="vx-button" data-command="reload">Try again</button>'), current: 'home' });
}

export function renderComponentShell(state, screen) {
  const details = copy[screen.key];
  const recordCount = countFor(screen.key, state);
  const records = recordsFor(screen.key, state);
  const stateBlock = details.blocked
    ? statePanel('blocked', 'External gate preserved', details.blocked)
    : records.length === 0
      ? statePanel('empty', 'No normal-runtime business records', `Visual X will not invent records to make this route look populated. Detailed workflow implementation is assigned to ${details.next.split(' ')[0]}.`)
      : '';
  const body = `
    <section class="vx-hero"><div><span class="vx-kicker">PHASE 1 · A40 SHELL</span><h2>${escapeHtml(screen.title)}</h2><p>${escapeHtml(details.summary)}</p></div><span class="vx-badge vx-badge--draft">Skeleton</span></section>
    <div class="vx-metric-grid">
      ${metricCard('◇','Source truth',recordCount)}
      ${metricCard('◉','Runtime mode',state.meta?.dataMode || 'normal')}
      ${metricCard('⌁','Route flag','Enabled for preview')}
    </div>
    <section class="vx-card vx-section-card"><header><div><small>IMPLEMENTATION CONTRACT</small><h2>Shared shell ready</h2></div><span class="vx-card-icon">▱</span></header><p>${escapeHtml(details.next)}</p><ul class="vx-contract-list"><li>Approved reference remains unchanged.</li><li>Normal runtime uses verified local records or honest empty states.</li><li>New consequential writes require idempotency and audit receipts.</li><li>Route can roll back independently to the frozen PNG shell.</li></ul></section>
    ${records.length ? `<section class="vx-card vx-section-card"><header><div><small>AVAILABLE SOURCE RECORDS</small><h2>Verified local inventory</h2></div><span class="vx-card-icon">▦</span></header><div class="vx-record-list">${records.map(recordRow).join('')}</div></section>` : ''}
    ${stateBlock}
    <button class="vx-button vx-button--primary" disabled aria-disabled="true">Continue in route packet →</button>`;
  return shell({ title: screen.title, status: 'Component preview', body, current: screen.key });
}

export function renderComponentStatusDrawer(state, current) {
  const flag = componentFeatureFlagByScreen[current];
  return `<div class="form-stack"><p>This route is using the A40 component shell because its development feature flag is enabled.</p><dl class="vx-definition-list"><div><dt>Route flag</dt><dd>${escapeHtml(flag)}</dd></div><div><dt>Runtime mode</dt><dd>${escapeHtml(state.meta?.dataMode || 'normal')}</dd></div><div><dt>External actions</dt><dd>Disabled</dd></div><div><dt>Fallback</dt><dd>Frozen approved PNG shell</dd></div></dl><button data-command="close-drawer">Close</button></div>`;
}

function shell({ title, status, body, current }) {
  return `<div class="vx-app-shell"><div class="vx-device-shell"><header class="vx-header"><div class="vx-header__brand"><span class="vx-header__mark" aria-hidden="true">VX</span><div><small>VISUAL X</small><h1>${escapeHtml(title)}</h1></div></div><div class="vx-header__actions"><span class="vx-badge vx-badge--draft">${escapeHtml(status)}</span><button class="vx-icon-button" data-command="open-component-menu" aria-label="Open menu" title="Open menu">▱</button></div></header><main class="vx-page" data-component-route="${escapeAttr(current)}">${body}</main>${bottomNav(current)}</div></div>`;
}
function bottomNav(current) {
  const items = [
    ['home','⌂','Home'],['visualizer','◫','Visualize'],['products','▦','Products'],['quote','▤','Quotes']
  ];
  return `<nav class="vx-bottom-nav" aria-label="Visual X primary navigation">${items.map(([key,icon,label]) => `<button type="button" data-screen="${key}" class="${current === key ? 'active' : ''}"><span aria-hidden="true">${icon}</span><span>${label}</span></button>`).join('')}<button type="button" data-command="open-component-menu"><span aria-hidden="true">☰</span><span>More</span></button></nav>`;
}
function metricCard(icon, label, value) { return `<section class="vx-card"><span class="vx-card-icon" aria-hidden="true">${icon}</span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></section>`; }
function statePanel(tone, title, text, action = '') { return `<div class="vx-state vx-state--${tone}" role="${tone === 'error' ? 'alert' : 'status'}"><span class="vx-state-icon" aria-hidden="true">${tone === 'blocked' ? '⊘' : tone === 'error' ? '!' : tone === 'loading' ? '◌' : '○'}</span><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>${action}</div></div>`; }
function countFor(key, state) {
  if (['products','blends','metallic'].includes(key)) return `${state.colors?.length || 0} colors`;
  if (key === 'home') return `${state.systems?.length || 0} systems`;
  if (key === 'lead') return `${state.leads?.length || 0} leads`;
  if (key === 'quote') return `${state.quotes?.length || 0} quotes`;
  if (key === 'proposal') return `${state.proposals?.length || 0} proposals`;
  return `${state.projects?.length || 0} projects`;
}
function recordsFor(key, state) {
  if (key === 'products') return (state.systems || []).slice(0,3).map(item => ({ id:item.slug,title:item.name,status:item.verificationStatus || 'PARTIAL' }));
  if (key === 'blends') return (state.colors || []).filter(item => String(item.system).toLowerCase().includes('flake')).slice(0,3).map(item => ({ id:item.code,title:item.color_name,status:'VERIFIED' }));
  if (key === 'metallic') return (state.colors || []).filter(item => String(item.system).toLowerCase().includes('metallic')).slice(0,3).map(item => ({ id:item.code,title:item.color_name,status:'VERIFIED' }));
  return [];
}
function recordRow(record) { const tone = String(record.status).toLowerCase().replaceAll('_','-'); return `<div><span><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.id)}</small></span><span class="vx-provenance vx-provenance--${escapeAttr(tone)}">${escapeHtml(String(record.status).replaceAll('_',' '))}</span></div>`; }
function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[c]); }
function escapeAttr(value = '') { return escapeHtml(value); }
