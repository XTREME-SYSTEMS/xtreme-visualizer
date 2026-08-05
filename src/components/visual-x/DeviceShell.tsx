import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ScanLine, PackageSearch, ReceiptText, Menu, Sun, Moon, ChevronLeft, Trash2, Settings } from 'lucide-react';
import { VisualXDrawer, VisualXDialog } from './VisualXPrimitives';
import { useApp } from '@/components/AppProvider';
import { base44 } from '@/api/base44Client';

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

export function DeviceShell() {
  const [more, setMore] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });
  const [userToggled, setUserToggled] = useState(false);
  const [settings, setSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { notice, notify } = useApp();
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const screen = location.pathname.split('/').pop() || 'home';
  const showBack = ['scan', 'compare', 'blends', 'metallic', 'proposal', 'lead'].includes(screen);
  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
  }, [theme]);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => { if (!userToggled) setTheme(e.matches ? 'light' : 'dark'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [userToggled]);
  const toggleTheme = () => {
    setUserToggled(true);
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.User.delete(user.id);
      await base44.auth.logout();
      window.location.href = '/login';
    } catch (e) { notify('Account deletion failed: ' + (e instanceof Error ? e.message : 'error')); setDeleting(false); setConfirmDelete(false); }
  };
  return (
    <div className="vx-stage">
      <div className="vx-device">
        <div className="vx-side-buttons" />
        <div className="vx-screen">
          <div className="vx-statusbar"><span>{time}</span><div className="vx-island" /><div className="vx-status-icons"><span>●●●</span><span>📶</span><div className="vx-battery" /></div></div>
          <div className="vx-brandbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {showBack && <button onClick={() => navigate(-1)} className="vx-back-btn" aria-label="Go back"><ChevronLeft className="vx-icon" /></button>}
              <div className="vx-brand-logo" style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 28, letterSpacing: '-.04em', color: 'var(--vx-text)' }}>VISUAL<span style={{ color: 'var(--vx-accent)' }}>X</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={toggleTheme} className="vx-icon-btn" aria-label="Toggle theme">{theme === 'dark' ? <Sun className="vx-icon" /> : <Moon className="vx-icon" />}</button>
              <div className="vx-avatar">VX</div>
            </div>
          </div>
          <div className="vx-main">
            <div className="vx-page vx-page-scroll"><Outlet /></div>
          </div>
          <nav className="vx-nav">
            {NAV.map(i => <NavLink key={i.to} to={i.to} className={({ isActive }) => isActive ? 'active' : ''}><i.icon className="vx-icon" /><span>{i.label}</span></NavLink>)}
            <button onClick={() => setMore(true)}><Menu className="vx-icon" /><span>More</span></button>
          </nav>
          <VisualXDrawer open={more} title="All screens" onClose={() => setMore(false)}>
            {MORE.map(i => <button key={i.to} className="vx-btn" onClick={() => { navigate(i.to); setMore(false); }}>{i.label}</button>)}
            <button className="vx-btn outline-accent" onClick={() => { setMore(false); setSettings(true); }}><Settings className="vx-icon" />Settings &amp; Account</button>
          </VisualXDrawer>
          <VisualXDrawer open={settings} title="Settings & Account" onClose={() => setSettings(false)}>
            <div className="vx-grid vx-grid-2">
              <button className={`vx-btn ${theme === 'dark' ? 'primary' : ''}`} onClick={toggleTheme}><Moon className="vx-icon" />Dark</button>
              <button className={`vx-btn ${theme === 'light' ? 'primary' : ''}`} onClick={toggleTheme}><Sun className="vx-icon" />Light</button>
            </div>
            <button className="vx-btn" style={{ borderColor: 'var(--vx-danger)', color: 'var(--vx-danger)' }} onClick={() => setConfirmDelete(true)}><Trash2 className="vx-icon" />Delete Account</button>
          </VisualXDrawer>
          <VisualXDialog open={confirmDelete} title="Delete Account" onClose={() => setConfirmDelete(false)}>
            <p>This will permanently delete your account and all associated data. This action cannot be undone.</p>
            <div className="vx-grid vx-grid-2">
              <button className="vx-btn" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
              <button className="vx-btn primary" style={{ background: 'var(--vx-danger)', borderColor: 'var(--vx-danger)' }} onClick={handleDeleteAccount} disabled={deleting}><Trash2 className="vx-icon" />{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </VisualXDialog>
          {notice && <div className="vx-toast" role="status" aria-live="polite">{notice}</div>}
        </div>
      </div>
    </div>
  );
}