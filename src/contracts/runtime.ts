export type VerificationStatus = 'VERIFIED' | 'PARTIAL' | 'STALE' | 'DUPLICATE' | 'CONFLICTED' | 'COULD_NOT_VERIFY' | 'TEST_FIXTURE';

export interface Provenance {
  source: string;
  sourceDate?: string;
  verificationStatus: VerificationStatus;
  revision?: string;
  approver?: string;
  assumptions?: string[];
}

export interface AuditReceipt<T = unknown> {
  id: string;
  actor: string;
  action: string;
  category: 'photo' | 'mask' | 'visualization' | 'quote' | 'proposal' | 'appointment' | 'validation' | 'audit';
  collection: string;
  entityId: string;
  requestId?: string;
  idempotencyKey?: string | null;
  beforeHash: string;
  afterHash: string;
  rollback: {
    supported: boolean;
    operation: 'delete-created-record' | 'restore-record-snapshot';
    collection: string;
    entityId: string;
    before?: T;
  };
  createdAt: string;
}

export interface PhotoRecord {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  storagePath?: string;
  orientation?: number;
  status: 'selected' | 'validated' | 'stored' | 'failed';
}

export interface MaskPoint { x: number; y: number; }
export interface MaskRecord {
  id: string;
  projectId: string;
  photoId: string;
  points: MaskPoint[];
  method: 'manual';
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface MeasurementArea {
  id?: string;
  label?: string;
  length: number;
  width: number;
  squareFeet?: number;
}
export interface MeasurementRecord {
  id: string;
  projectId: string;
  areas: MeasurementArea[];
  totalSquareFeet: number;
  linearFeet?: number;
  approved: boolean;
  revision: number;
}

export interface VisualizationRecord {
  id: string;
  projectId: string;
  photoId?: string;
  maskId: string;
  systemSlug: string;
  productId?: string;
  colorCode: string;
  opacity: number;
  gloss: number;
  texture?: number;
  lighting?: number;
  approximationLabel: string;
  outputPath?: string;
}

export interface RepositoryResult<T> {
  status: number;
  duplicate?: boolean;
  record: T;
  receipt: AuditReceipt<T>;
}
