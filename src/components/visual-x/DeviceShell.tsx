import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, ScanLine, PackageSearch, ReceiptText, Menu, Sun, Moon } from 'lucide-react';
import { VisualXDrawer } from './VisualXPrimitives';
import { useApp } from '@/components/AppProvider';

const NAV = [
  { to: '/app/home', label: 'Home', icon: Home },
  { to: '/app/visualizer', label: 'Visualize', icon: ScanLine },
  { to: '/app/products', label: 'Products', icon: PackageSearch },
  { to: '/app/quote', label: 'Quotes', icon: ReceiptText },
];
const MORE = [
  { to: '/app/scan', label: 'Room Scan' },
  { to: '/app/compare', label: 'Compare Finishes' },
  { to: '/app/blends', label: 'Flake Blend Studio' },
  { to: '/app/metallic', label: 'Metallic Studio' },
  { to: '/app/proposal', label: 'Proposal Share' },
  { to: '/app/lead', label: 'Lead Capture' },
];

export function DeviceShell({ children }: { children: ReactNode }) {
  const [more, setMore] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const navigate = useNavigate();
  const { notice } = useApp();
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next === 'light' ? 'light' : '';
  };
  return (
    <div className="vx-stage">
      <div className="vx-device">
        <div className="vx-side-buttons" />
        <div className="vx-screen">
          <div className="vx-statusbar"><span>{time}</span><div className="vx-island" /><div className="vx-status-icons"><span>●●●</span><span>📶</span><div className="vx-battery" /></div></div>
          <div className="vx-brandbar">
            <div className="vx-brand-logo" style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 28, letterSpacing: '-.04em', color: 'var(--vx-text)' }}>VISUAL<span style={{ color: 'var(--vx-accent)' }}>X</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={toggleTheme} className="vx-icon-btn" aria-label="Toggle theme">{theme === 'dark' ? <Sun className="vx-icon" /> : <Moon className="vx-icon" />}</button>
              <div className="vx-avatar">VX</div>
            </div>
          </div>
          <div className="vx-main">
            <div className="vx-page vx-page-scroll">{children}</div>
          </div>
          <nav className="vx-nav">
            {NAV.map(i => <NavLink key={i.to} to={i.to} className={({ isActive }) => isActive ? 'active' : ''}><i.icon className="vx-icon" /><span>{i.label}</span></NavLink>)}
            <button onClick={() => setMore(true)}><Menu className="vx-icon" /><span>More</span></button>
          </nav>
          <VisualXDrawer open={more} title="All screens" onClose={() => setMore(false)}>
            {MORE.map(i => <button key={i.to} className="vx-btn" onClick={() => { navigate(i.to); setMore(false); }}>{i.label}</button>)}
          </VisualXDrawer>
          {notice && <div className="vx-toast" role="status" aria-live="polite">{notice}</div>}
        </div>
      </div>
    </div>
  );
}