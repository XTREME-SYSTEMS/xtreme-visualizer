import { base44 } from '@/api/base44Client';
import type { AppState, FloorSystem, Product, ColorRecord, Project, Lead, Quote, Proposal, QuoteCalculation, QuoteLineItem } from '../types';
import type { RepositoryResult, AuditReceipt } from '../contracts/runtime';

// ── Collection → Base44 entity name ──
const COLLECTION_MAP: Record<string, string> = {
  leads: 'Lead', projects: 'Project', quotes: 'Quote', proposals: 'Proposal',
  visualizations: 'Visualization', products: 'Product', colors: 'ColorChart',
  systems: 'FloorSystem', signatures: 'Signature', scopes: 'Scope',
  featureFlags: 'FeatureFlag', activityReceipts: 'ActivityReceipt',
};

// ── Field overrides: TS camelCase → entity snake_case (where names differ) ──
const FIELD_OVERRIDES: Record<string, Record<string, string>> = {
  leads: { property_type: 'space_type', appointment: 'desired_install_date', floor_condition: 'condition', desired_finish: 'system_name', photos: 'photo_url' },
  projects: { system: 'floor_system', image: 'project_image_url' },
};

function camelToSnake(s: string): string { return s.replace(/[A-Z]/g, c => '_' + c.toLowerCase()); }
function snakeToCamel(s: string): string { return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }

function toEntityPayload(collection: string, payload: Record<string, any>): Record<string, any> {
  const overrides = FIELD_OVERRIDES[collection] || {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    let snake = camelToSnake(k);
    if (overrides[snake]) snake = overrides[snake];
    if (collection === 'leads' && snake === 'photo_url' && Array.isArray(v)) out[snake] = v[0] || '';
    else out[snake] = v;
  }
  return out;
}

function fromEntityRecord(collection: string, record: Record<string, any>): Record<string, any> {
  const overrides = FIELD_OVERRIDES[collection] || {};
  const inv: Record<string, string> = {};
  for (const [c, s] of Object.entries(overrides)) inv[s] = c;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(record)) {
    if (['id', 'created_date', 'updated_date', 'created_by_id'].includes(k)) { out[k] = v; continue; }
    let camel = snakeToCamel(k);
    if (inv[k]) camel = inv[k];
    out[camel] = v;
  }
  if (collection === 'leads' && out.photoUrl && !out.photos) out.photos = [out.photoUrl];
  return out;
}

function simpleHash(obj: unknown): string {
  const str = JSON.stringify(obj || {});
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h).toString(16).padStart(8, '0');
}

function makeReceipt(actor: string, action: string, collection: string, entityId: string, before: unknown, after: unknown): AuditReceipt {
  const catMap: Record<string, AuditReceipt['category']> = {
    quotes: 'quote', proposals: 'proposal', leads: 'appointment',
    visualizations: 'visualization', photos: 'photo', masks: 'mask',
  };
  return {
    id: crypto.randomUUID(), actor, action,
    category: catMap[collection] || 'audit', collection, entityId,
    requestId: crypto.randomUUID(), idempotencyKey: crypto.randomUUID(),
    beforeHash: simpleHash(before), afterHash: simpleHash(after),
    rollback: { supported: true, operation: action === 'create' ? 'delete-created-record' : 'restore-record-snapshot', collection, entityId, before: action === 'create' ? undefined : before },
    createdAt: new Date().toISOString(),
  };
}

const RECEIPT_CATEGORY: Record<string, string> = {
  quotes: 'quote', proposals: 'proposal', leads: 'appointment',
  visualizations: 'visualization', photos: 'photo', masks: 'mask',
};
async function createReceipt(collection: string, entityId: string, action: string, actor: string): Promise<void> {
  try {
    await base44.entities.ActivityReceipt.create({
      action: `${collection}_${action}`, actor,
      category: (RECEIPT_CATEGORY[collection] || 'audit') as any,
      detail: `${action} on ${collection} ${entityId}`,
      lead_id: collection === 'leads' ? entityId : undefined,
    });
  } catch { /* best-effort */ }
}

// ── State mappers (entity → TS type) ──
function mapFloorSystem(r: any): FloorSystem {
  return { name: r.name, slug: r.slug || '', category: r.category, description: r.description || '', finishes: r.finishes || [], sheen_levels: r.sheen_levels || [], colors: (r.colors || []).map((c: any) => ({ name: c.name, hex: c.hex, code: c.code })), product_skus: r.product_skus || [], base_rate_low: r.base_rate_low || 0, base_rate_high: r.base_rate_high || 0, verificationStatus: 'COULD_NOT_VERIFY', customerFacingRateEnabled: false, provenanceId: r.id };
}
function mapProduct(r: any): Product {
  return { id: r.id, name: r.name, category: r.category, subtitle: r.size || '', description: r.specs || '', image: r.product_url || '', unit: r.price_unit || '', price: r.price || 0, pricingStatus: (r.price > 0 && r.active !== false) ? 'VERIFIED' : 'COULD_NOT_VERIFY', systemSlug: '', verificationStatus: r.active !== false ? 'VERIFIED' : 'STALE', provenanceId: r.id, customerFacingPriceEnabled: r.price > 0 };
}
function mapColor(r: any): ColorRecord {
  return { system: r.system, color_name: r.color_name, code: r.code, hex: r.hex, collection: r.collection || '', sheen: r.sheen || 'High Gloss', in_stock: r.in_stock !== false, rank: r.rank || 0, image_url: r.image_url || '', local_image: r.image_url || '', verificationStatus: 'VERIFIED', provenanceId: r.id };
}
function mapProject(r: any): Project {
  return { id: r.id, name: r.name, address: r.address || r.location || '', squareFeet: r.square_feet || 0, areaCount: 1, system: r.floor_system || '', finish: r.finish_name || '', status: r.status || 'New Lead', image: r.project_image_url || '', updatedAt: r.updated_date };
}
function mapLead(r: any): Lead {
  return { id: r.id, customerName: r.customer_name, propertyType: r.space_type || 'other', address: r.project_address || '', appointment: r.desired_install_date || '', floorCondition: r.condition || 'fair', desiredFinish: r.system_name || '', finish: r.finish || '', squareFeet: r.square_feet || 0, photos: r.photo_url ? [r.photo_url] : [], status: r.status || 'new', tasks: [] };
}
function mapQuote(r: any): Quote {
  return { id: r.id, projectId: r.project_id || '', customerName: r.customer_name || '', marginPercent: r.margin_percent ?? 25, rangeVariancePercent: 8, status: r.status || 'internal_draft', lineItems: (r.line_items || []).map((li: any, i: number) => ({ id: li.id || String(i), productId: li.product_id, name: li.name || '', detail: li.description || '', quantity: li.quantity || 0, unit: li.unit || 'sq ft', rate: li.rate || 0, optional: li.optional, selected: li.selected !== false })), updatedAt: r.updated_date };
}
function mapProposal(r: any): Proposal {
  return { id: r.id, quoteId: '', customerName: r.company_name || '', address: '', system: r.scope_summary || '', scope: r.scope_summary || '', squareFeet: 0, timeline: '', warranty: '', exclusions: [], signature: { status: r.status === 'accepted' ? 'signed' : 'draft', name: '', signedAt: null }, status: r.status || 'draft', validDays: 30, updatedAt: r.updated_date };
}

export const api = {
  state: async (): Promise<AppState> => {
    const [systems, products, colors, projects, leads, quotes, proposals, flags] = await Promise.all([
      base44.entities.FloorSystem.list().catch(() => []), base44.entities.Product.list().catch(() => []),
      base44.entities.ColorChart.list().catch(() => []), base44.entities.Project.list().catch(() => []),
      base44.entities.Lead.list().catch(() => []), base44.entities.Quote.list().catch(() => []),
      base44.entities.Proposal.list().catch(() => []), base44.entities.FeatureFlag.list().catch(() => []),
    ]);
    return { meta: { dataMode: 'normal', version: 'v1.0.0' }, systems: (systems || []).map(mapFloorSystem), products: (products || []).map(mapProduct), colors: (colors || []).map(mapColor), projects: (projects || []).map(mapProject), leads: (leads || []).map(mapLead), quotes: (quotes || []).map(mapQuote), proposals: (proposals || []).map(mapProposal), events: [], featureFlags: Object.fromEntries((flags || []).map((f: any) => [f.key, f.enabled])) };
  },
  catalog: async () => {
    const [systems, products, colors] = await Promise.all([base44.entities.FloorSystem.list().catch(() => []), base44.entities.Product.list().catch(() => []), base44.entities.ColorChart.list().catch(() => [])]);
    return { systems: (systems || []).map(mapFloorSystem), products: (products || []).map(mapProduct), colors: (colors || []).map(mapColor), meta: { dataMode: 'normal', version: 'v1.0.0' } };
  },
  readiness: async () => ({ status: 'ready', controls: { create: true, update: true, delete: true, email: false, payments: false, signatures: false, autoMask: false }, externalBlockers: ['Customer email and SMS', 'Payments', 'Legally binding e-signature', 'Automatic AI masking'] }),
  featureFlags: async (): Promise<Record<string, boolean>> => { const f = await base44.entities.FeatureFlag.list().catch(() => []); return Object.fromEntries((f || []).map((x: any) => [x.key, x.enabled])); },
  updateFeatureFlags: async (flags: Record<string, boolean>): Promise<Record<string, boolean>> => { for (const [k, v] of Object.entries(flags)) { const ex = await base44.entities.FeatureFlag.filter({ key: k }).catch(() => []); if (ex?.length) await base44.entities.FeatureFlag.update(ex[0].id, { enabled: v }); else await base44.entities.FeatureFlag.create({ key: k, enabled: v, approval_required: false }); } return flags; },
  v2: {
    list: async <T>(collection: string): Promise<T[]> => { const e = COLLECTION_MAP[collection]; if (!e) throw new Error(`Unknown collection: ${collection}`); const r = await base44.entities[e].list().catch(() => []); return (r || []).map((x: any) => fromEntityRecord(collection, x) as T); },
    get: async <T>(collection: string, id: string): Promise<T> => { const e = COLLECTION_MAP[collection]; if (!e) throw new Error(`Unknown collection: ${collection}`); return fromEntityRecord(collection, await base44.entities[e].get(id)) as T; },
    create: async <T>(collection: string, payload: Partial<T>, actor = 'visual-x-operator'): Promise<RepositoryResult<T>> => {
      const e = COLLECTION_MAP[collection]; if (!e) throw new Error(`Unknown collection: ${collection}`);
      if (collection === 'leads') { const p = payload as any; if (p.customerName && p.address) { const ex = await base44.entities.Lead.filter({ customer_name: p.customerName, project_address: p.address }).catch(() => []); if (ex?.length) return { status: 409, duplicate: true, record: fromEntityRecord(collection, ex[0]) as T, receipt: makeReceipt(actor, 'create', collection, ex[0].id, null, ex[0]) }; } }
      const created = await base44.entities[e].create(toEntityPayload(collection, payload as Record<string, any>));
      await createReceipt(collection, created.id, 'create', actor);
      return { status: 201, record: fromEntityRecord(collection, created) as T, receipt: makeReceipt(actor, 'create', collection, created.id, null, created) };
    },
    update: async <T>(collection: string, id: string, payload: Partial<T>, actor = 'visual-x-operator'): Promise<RepositoryResult<T>> => {
      const e = COLLECTION_MAP[collection]; if (!e) throw new Error(`Unknown collection: ${collection}`);
      const before = await base44.entities[e].get(id).catch(() => null);
      const updated = await base44.entities[e].update(id, toEntityPayload(collection, payload as Record<string, any>));
      await createReceipt(collection, id, 'update', actor);
      return { status: 200, record: fromEntityRecord(collection, updated) as T, receipt: makeReceipt(actor, 'update', collection, id, before, updated) };
    },
    remove: async <T>(collection: string, id: string, actor = 'visual-x-operator'): Promise<RepositoryResult<T>> => {
      const e = COLLECTION_MAP[collection]; if (!e) throw new Error(`Unknown collection: ${collection}`);
      const before = await base44.entities[e].get(id).catch(() => null);
      await base44.entities[e].delete(id);
      await createReceipt(collection, id, 'delete', actor);
      return { status: 200, record: fromEntityRecord(collection, before || {}) as T, receipt: makeReceipt(actor, 'delete', collection, id, before, null) };
    },
  },
  uploadFile: async (file: File): Promise<string> => { const { file_url } = await base44.integrations.Core.UploadFile({ file }); return file_url; },
  reset: async () => { return { ok: true, state: await api.state() }; },
  update: async <T>(collection: string, id: string, payload: Partial<T>): Promise<T> => (await api.v2.update(collection, id, payload)).record,
  create: async <T>(collection: string, payload: Partial<T>): Promise<T> => (await api.v2.create(collection, payload)).record,
  calculateQuote: (quote: { lineItems: QuoteLineItem[]; marginPercent: number; rangeVariancePercent: number }): QuoteCalculation => {
    const subtotal = (quote.lineItems || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
    const margin = subtotal * ((Number(quote.marginPercent) || 0) / 100);
    const total = subtotal + margin;
    const variance = (Number(quote.rangeVariancePercent) || 8) / 100;
    return { subtotal, margin, total, low: total * (1 - variance), high: total * (1 + variance) };
  },
};