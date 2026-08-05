export interface FloorSystem {
  name: string;
  slug: string;
  category: string;
  description: string;
  finishes?: string[];
  sheen_levels?: string[];
  colors?: { name: string; hex: string; code: string }[];
  product_skus?: string[];
  base_rate_low: number;
  base_rate_high: number;
  verificationStatus?: string;
  customerFacingRateEnabled?: boolean;
  provenanceId?: string;
}
export interface Product {
  id: string;
  name: string;
  category: string;
  subtitle: string;
  description: string;
  image: string;
  unit: string;
  price: number;
  pricingStatus: string;
  systemSlug?: string;
  verificationStatus?: string;
  provenanceId?: string;
  customerFacingPriceEnabled?: boolean;
}
export interface ColorRecord {
  system: string;
  color_name: string;
  code: string;
  hex: string;
  collection: string;
  sheen: string;
  in_stock: boolean;
  rank: number;
  image_url?: string;
  local_image: string;
  verificationStatus?: string;
  provenanceId?: string;
}
export interface Project {
  id: string;
  name: string;
  address: string;
  squareFeet: number;
  areaCount: number;
  system: string;
  finish: string;
  status: string;
  image: string;
  updatedAt: string;
}
export interface LeadTask { id: string; label: string; priority: string; due: string; done: boolean; }
export interface Lead {
  id: string;
  customerName: string;
  propertyType: string;
  address: string;
  appointment: string;
  floorCondition: string;
  desiredFinish: string;
  finish: string;
  squareFeet: number;
  photos: string[];
  status: string;
  tasks: LeadTask[];
}
export interface QuoteLineItem {
  id: string;
  productId?: string;
  name: string;
  detail: string;
  quantity: number;
  unit: string;
  rate: number;
  optional?: boolean;
  selected?: boolean;
}
export interface Quote {
  id: string;
  projectId: string;
  customerName: string;
  marginPercent: number;
  rangeVariancePercent: number;
  status: string;
  lineItems: QuoteLineItem[];
  updatedAt: string;
}
export interface Proposal {
  id: string;
  quoteId: string;
  customerName: string;
  address: string;
  system: string;
  scope: string;
  squareFeet: number;
  timeline: string;
  warranty: string;
  exclusions: string[];
  signature: { status: string; name: string; signedAt: string | null };
  status: string;
  validDays: number;
  updatedAt: string;
}
export interface AppState {
  meta: Record<string, string>;
  systems: FloorSystem[];
  products: Product[];
  colors: ColorRecord[];
  projects: Project[];
  leads: Lead[];
  quotes: Quote[];
  proposals: Proposal[];
  events: unknown[];
  activityReceipts?: unknown[];
  featureFlags: Record<string, boolean>;
  autoLeadSources?: unknown[];
  autoLeadOpportunities?: unknown[];
}
export interface QuoteCalculation { subtotal: number; margin: number; total: number; low: number; high: number; }
