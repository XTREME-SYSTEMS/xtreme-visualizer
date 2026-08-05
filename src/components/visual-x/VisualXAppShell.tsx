import { ChevronLeft, Home, Layers3, Menu, PackageSearch, ReceiptText, ScanLine } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { VisualXIconButton, VisualXStatusBadge } from './VisualXPrimitives';

export function VisualXHeader({ title, eyebrow = 'VISUAL X', status = 'draft', action }: { title: string; eyebrow?: string; status?: 'ready' | 'partial' | 'blocked' | 'draft'; action?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const screen = location.pathname.split('/').pop() || 'home';
  const showBack = screen !== 'home';
  return <header className="vx-header"><div className="vx-header__brand">{showBack && <button onClick={() => navigate(-1)} className="vx-back-btn" aria-label="Go back" style={{ marginRight: 8 }}><ChevronLeft className="vx-icon" /></button>}<span className="vx-header__mark" aria-hidden="true">VX</span><div><small>{eyebrow}</small><h1>{title}</h1></div></div><div className="vx-header__actions"><VisualXStatusBadge status={status}>{status === 'draft' ? 'Component preview' : status}</VisualXStatusBadge>{action}</div></header>;
}

const items = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/visualizer', label: 'Visualize', icon: ScanLine },
  { to: '/app/products', label: 'Products', icon: PackageSearch },
  { to: '/app/quote', label: 'Quotes', icon: ReceiptText }
];
export function VisualXBottomNavigation({ onMore }: { onMore: () => void }) {
  return <nav className="vx-bottom-nav" aria-label="Visual X primary navigation">{items.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : undefined}><item.icon aria-hidden="true"/><span>{item.label}</span></NavLink>)}<button type="button" onClick={onMore}><Menu aria-hidden="true"/><span>More</span></button></nav>;
}

export function VisualXAppShell({ title, status = 'draft', children, onOpenMore }: { title: string; status?: 'ready' | 'partial' | 'blocked' | 'draft'; children: ReactNode; onOpenMore: () => void }) {
  return <div className="vx-app-shell"><div className="vx-device-shell"><VisualXHeader title={title} status={status} action={<VisualXIconButton label="Open menu" onClick={onOpenMore}><Layers3 /></VisualXIconButton>}/>{children}<VisualXBottomNavigation onMore={onOpenMore}/></div></div>;
}