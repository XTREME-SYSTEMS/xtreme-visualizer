import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AlertTriangle, Ban, CheckCircle2, CircleDashed, Info, LoaderCircle, X } from 'lucide-react';
import type { VerificationStatus } from '../../contracts/runtime';

export function swatchSrc(color: { image_url?: string | null; hex?: string | null }): string {
  if (color.image_url) return color.image_url;
  const hex = color.hex || '#888888';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><defs><radialGradient id='g' cx='35%' cy='30%'><stop offset='0' stop-color='${hex}' stop-opacity='0.95'/><stop offset='1' stop-color='${hex}' stop-opacity='0.6'/></radialGradient></defs><rect width='120' height='120' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function VisualXPage({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={`vx-page ${className}`.trim()} {...props}>{children}</main>;
}

export function VisualXCard({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`vx-card ${className}`.trim()} {...props}>{children}</section>;
}

export const VisualXButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-accent' | 'compact' }>(
  function VisualXButton({ className = '', variant = 'secondary', type = 'button', ...props }, ref) {
    const v = variant === 'primary' ? 'primary' : variant === 'ghost' ? 'ghost' : variant === 'compact' ? 'compact' : variant === 'outline-accent' ? 'outline-accent' : '';
    return <button ref={ref} type={type} className={`vx-btn ${v} ${className}`.trim()} {...props} />;
  }
);

export const VisualXIconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string }>(
  function VisualXIconButton({ className = '', label, children, type = 'button', ...props }, ref) {
    return <button ref={ref} type={type} className={`vx-icon-btn ${className}`.trim()} aria-label={label} title={label} {...props}>{children}</button>;
  }
);

interface FieldProps { label: string; hint?: string; error?: string; children?: ReactNode; inputProps?: InputHTMLAttributes<HTMLInputElement>; textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>; }
export function VisualXField({ label, hint, error, children, inputProps, textareaProps }: FieldProps) {
  const id = inputProps?.id || textareaProps?.id || useId();
  return (
    <label className="vx-field" htmlFor={id}>
      <span>{label}</span>
      {children || (textareaProps ? <textarea {...textareaProps} id={id} /> : <input {...inputProps} id={id} />)}
      {error ? <span className="vx-field__error">{error}</span> : hint ? <span className="vx-help">{hint}</span> : null}
    </label>
  );
}

interface SelectProps { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string; error?: string; }
export function VisualXSelect({ label, value, onChange, options, hint, error }: SelectProps) {
  const selectId = useId();
  return (
    <label className="vx-field" htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error ? <span className="vx-field__error">{error}</span> : hint ? <span className="vx-help">{hint}</span> : null}
    </label>
  );
}

interface TabsProps { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void; }
export function VisualXTabs({ tabs, active, onChange }: TabsProps) {
  return <div className="vx-tabbar">{tabs.map(t => <button key={t.key} type="button" className={t.key === active ? 'active' : ''} onClick={() => onChange(t.key)}>{t.label}</button>)}</div>;
}

interface SliderProps { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string; }
export function VisualXSlider({ label, value, min, max, step = 1, onChange, unit = '' }: SliderProps) {
  return <div className="vx-range"><span>{label}</span><input type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} /><output>{value}{unit}</output></div>;
}

export function VisualXStatusBadge({ status, children }: { status: 'ready' | 'partial' | 'blocked' | 'draft'; children?: ReactNode }) {
  const cls = status === 'ready' ? 'ready' : status === 'blocked' ? 'blocked' : status === 'partial' ? 'progress' : 'draft';
  return <span className={`vx-chip ${cls}`}>{children || status}</span>;
}

export function VisualXProvenanceBadge({ status, source }: { status: VerificationStatus | string; source?: string }) {
  const n = status.toLowerCase().replaceAll('_', '-');
  return <span className={`vx-chip vx-provenance vx-provenance--${n}`} title={source ? `Source: ${source}` : undefined}><Info className="vx-icon vx-icon-sm" />{status.replaceAll('_', ' ')}</span>;
}

export function VisualXEmptyState({ title = 'Nothing here yet', children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return <div className="vx-empty"><strong>{title}</strong>{children}{action && <div style={{ marginTop: 10 }}>{action}</div>}</div>;
}

export function VisualXBlockedState({ title = 'Action blocked', children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return <div className="vx-notice"><strong>{title}</strong><div>{children}</div>{action && <div style={{ marginTop: 10 }}>{action}</div>}</div>;
}

export function VisualXLoadingState({ label = 'Loading Visual X…' }: { label?: string }) {
  return <div className="vx-loading"><div className="vx-spinner" /><p style={{ marginTop: 12, color: 'var(--vx-muted)', fontSize: 14 }}>{label}</p></div>;
}

export function VisualXErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return <div className="vx-notice error"><strong>Visual X could not load</strong><p>{error}</p>{retry && <button className="vx-btn compact" style={{ marginTop: 8 }} onClick={retry}>Try again</button>}</div>;
}

export function VisualXReceiptToast({ message, receiptId }: { message: string; receiptId?: string }) {
  return <div className="vx-toast" role="status" aria-live="polite"><CheckCircle2 className="vx-icon vx-icon-sm" />{message}{receiptId && <small style={{ display: 'block', fontSize: 10, opacity: .7 }}>Receipt {receiptId}</small>}</div>;
}

function useOverlay(open: boolean, onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [open, onClose]);
  return closeRef;
}

export function VisualXDialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const closeRef = useOverlay(open, onClose);
  if (!open) return null;
  return <div className="vx-overlay" style={{ alignItems: 'center', padding: 16 }} onMouseDown={e => { if (e.currentTarget === e.target) onClose(); }}>
    <section className="vx-dialog" role="dialog" aria-modal="true" aria-labelledby="vx-dlg-title"><header><h2 id="vx-dlg-title">{title}</h2><button ref={closeRef} className="vx-icon-btn" aria-label="Close dialog" onClick={onClose}><X /></button></header><div className="vx-drawer__body">{children}</div></section>
  </div>;
}

export function VisualXDrawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const closeRef = useOverlay(open, onClose);
  if (!open) return null;
  return <div className="vx-overlay" onMouseDown={e => { if (e.currentTarget === e.target) onClose(); }}>
    <aside className="vx-drawer" role="dialog" aria-modal="true" aria-labelledby="vx-drw-title"><header><h2 id="vx-drw-title">{title}</h2><button ref={closeRef} className="vx-icon-btn" aria-label="Close drawer" onClick={onClose}><X /></button></header><div className="vx-drawer__body">{children}</div></aside>
  </div>;
}