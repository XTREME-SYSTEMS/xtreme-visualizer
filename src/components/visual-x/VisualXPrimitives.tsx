import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes
} from 'react';
import { AlertTriangle, Ban, CheckCircle2, CircleDashed, Info, LoaderCircle, X } from 'lucide-react';
import type { VerificationStatus } from '../../contracts/runtime';

export function VisualXPage({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={`vx-page ${className}`.trim()} {...props}>{children}</main>;
}

export function VisualXCard({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`vx-card ${className}`.trim()} {...props}>{children}</section>;
}

export const VisualXButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }>(
  function VisualXButton({ className = '', variant = 'secondary', type = 'button', ...props }, ref) {
    return <button ref={ref} type={type} className={`vx-button vx-button--${variant} ${className}`.trim()} {...props} />;
  }
);

export const VisualXIconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string }>(
  function VisualXIconButton({ className = '', label, children, type = 'button', ...props }, ref) {
    return <button ref={ref} type={type} className={`vx-icon-button ${className}`.trim()} aria-label={label} title={label} {...props}>{children}</button>;
  }
);

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children?: ReactNode;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}
export function VisualXField({ label, hint, error, children, inputProps, textareaProps }: FieldProps) {
  const generatedId = useId();
  const id = inputProps?.id || textareaProps?.id || generatedId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <label className="vx-field" htmlFor={id}>
      <span className="vx-field__label">{label}</span>
      {children || (textareaProps ? <textarea {...textareaProps} id={id} aria-describedby={describedBy} aria-invalid={Boolean(error)} /> : <input {...inputProps} id={id} aria-describedby={describedBy} aria-invalid={Boolean(error)} />)}
      {error ? <span id={`${id}-error`} className="vx-field__error">{error}</span> : hint ? <span id={`${id}-hint`} className="vx-field__hint">{hint}</span> : null}
    </label>
  );
}

export function VisualXStatusBadge({ status, children }: { status: 'ready' | 'partial' | 'blocked' | 'draft'; children?: ReactNode }) {
  const icon = status === 'ready' ? <CheckCircle2 /> : status === 'blocked' ? <Ban /> : status === 'partial' ? <AlertTriangle /> : <CircleDashed />;
  return <span className={`vx-badge vx-badge--${status}`}>{icon}{children || status}</span>;
}

export function VisualXProvenanceBadge({ status, source }: { status: VerificationStatus | string; source?: string }) {
  const normalized = status.toLowerCase().replaceAll('_', '-');
  return <span className={`vx-provenance vx-provenance--${normalized}`} title={source ? `Source: ${source}` : undefined}><Info />{status.replaceAll('_', ' ')}</span>;
}

function StatePanel({ tone, icon, title, children, action }: { tone: string; icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className={`vx-state vx-state--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{icon}<div><h2>{title}</h2><div>{children}</div>{action && <div className="vx-state__action">{action}</div>}</div></div>;
}
export function VisualXEmptyState({ title = 'Nothing here yet', children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return <StatePanel tone="empty" icon={<CircleDashed />} title={title} action={action}>{children}</StatePanel>;
}
export function VisualXBlockedState({ title = 'Action blocked', children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return <StatePanel tone="blocked" icon={<Ban />} title={title} action={action}>{children}</StatePanel>;
}
export function VisualXLoadingState({ label = 'Loading Visual X…' }: { label?: string }) {
  return <StatePanel tone="loading" icon={<LoaderCircle className="vx-spin" />} title={label}><p>Waiting for verified runtime data.</p></StatePanel>;
}
export function VisualXErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return <StatePanel tone="error" icon={<AlertTriangle />} title="Visual X could not load" action={retry ? <VisualXButton onClick={retry}>Try again</VisualXButton> : undefined}><p>{error}</p></StatePanel>;
}

export function VisualXReceiptToast({ message, receiptId }: { message: string; receiptId?: string }) {
  return <div className="vx-receipt-toast" role="status" aria-live="polite"><CheckCircle2 /><span>{message}{receiptId && <small>Receipt {receiptId}</small>}</span></div>;
}

interface OverlayProps { open: boolean; title: string; children: ReactNode; onClose: () => void; }
function useOverlay(open: boolean, onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [open, onClose]);
  return closeRef;
}

export function VisualXDialog({ open, title, children, onClose }: OverlayProps) {
  const closeRef = useOverlay(open, onClose);
  if (!open) return null;
  return <div className="vx-overlay" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}><section className="vx-dialog" role="dialog" aria-modal="true" aria-labelledby="vx-dialog-title"><header><h2 id="vx-dialog-title">{title}</h2><VisualXIconButton ref={closeRef} label="Close dialog" onClick={onClose}><X /></VisualXIconButton></header><div className="vx-dialog__body">{children}</div></section></div>;
}

export function VisualXDrawer({ open, title, children, onClose }: OverlayProps) {
  const closeRef = useOverlay(open, onClose);
  if (!open) return null;
  return <div className="vx-overlay vx-overlay--drawer" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}><aside className="vx-drawer" role="dialog" aria-modal="true" aria-labelledby="vx-drawer-title"><header><h2 id="vx-drawer-title">{title}</h2><VisualXIconButton ref={closeRef} label="Close drawer" onClick={onClose}><X /></VisualXIconButton></header><div className="vx-drawer__body">{children}</div></aside></div>;
}
