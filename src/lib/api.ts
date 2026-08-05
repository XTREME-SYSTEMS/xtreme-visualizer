import type { AppState, Quote, QuoteCalculation } from '../types';
import type { RepositoryResult } from '../contracts/runtime';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options?.headers || {}) }
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

function mutationHeaders(actor = 'visual-x-preview-operator') {
  const requestId = crypto.randomUUID();
  return {
    'Idempotency-Key': crypto.randomUUID(),
    'X-Request-ID': requestId,
    'X-Actor': actor
  };
}

export const api = {
  state: () => request<AppState>('/api/state'),
  catalog: () => request<Pick<AppState, 'systems' | 'products' | 'colors' | 'meta'>>('/api/catalog'),
  readiness: () => request<{ status: string; controls: Record<string, boolean>; externalBlockers: string[] }>('/api/readiness'),
  featureFlags: () => request<Record<string, boolean>>('/api/v2/feature-flags'),
  updateFeatureFlags: (flags: Record<string, boolean>) => request<Record<string, boolean>>('/api/v2/feature-flags', { method: 'PATCH', headers: mutationHeaders(), body: JSON.stringify(flags) }),
  v2: {
    list: <T>(collection: string) => request<T[]>(`/api/v2/${collection}`),
    get: <T>(collection: string, id: string) => request<T>(`/api/v2/${collection}/${id}`),
    create: <T>(collection: string, payload: Partial<T>, actor?: string) => request<RepositoryResult<T>>(`/api/v2/${collection}`, { method: 'POST', headers: mutationHeaders(actor), body: JSON.stringify(payload) }),
    update: <T>(collection: string, id: string, payload: Partial<T>, actor?: string) => request<RepositoryResult<T>>(`/api/v2/${collection}/${id}`, { method: 'PATCH', headers: mutationHeaders(actor), body: JSON.stringify(payload) }),
    remove: <T>(collection: string, id: string, actor?: string) => request<RepositoryResult<T>>(`/api/v2/${collection}/${id}`, { method: 'DELETE', headers: mutationHeaders(actor), body: '{}' })
  },
  // Frozen legacy route fallback only. New component workflows must use api.v2.
  reset: () => request<{ ok: boolean; state: AppState }>('/api/reset', { method: 'POST', body: '{}' }),
  update: <T>(collection: string, id: string, payload: Partial<T>) => request<T>(`/api/${collection}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  create: <T>(collection: string, payload: Partial<T>) => request<T>(`/api/${collection}`, { method: 'POST', body: JSON.stringify(payload) }),
  calculateQuote: (quote: Pick<Quote, 'lineItems' | 'marginPercent' | 'rangeVariancePercent'>) => request<QuoteCalculation>('/api/calculate-quote', { method: 'POST', body: JSON.stringify(quote) })
};
