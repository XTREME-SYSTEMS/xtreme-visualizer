import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Camera, Users, MessageSquare, Menu, Sun, Moon, ChevronLeft, Trash2, Settings, Search } from 'lucide-react';
import { VisualXDrawer, VisualXDialog } from './VisualXPrimitives';
import { useApp } from '@/components/AppProvider';
import { useUI } from '@/lib/uiContext';
import NewProjectSheet from '@/components/vq/NewProjectSheet';
import { base44 } from '@/api/base44Client';

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/visualizer', label: 'New Bid', icon: Camera },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/inbox', label: 'Inbox', icon: MessageSquare },
];
const MORE = [
  { to: '/projects', label: 'Projects' },
  { to: '/systems', label: 'Floor Systems' },
  { to: '/pricing', label: 'Pricing Rules' },
  { to: '/close', label: 'Proposal Studio' },
  { to: '/crm', label: 'CRM' },
  { to: '/products', label: 'Products' },
  { to: '/colors', label: 'Color Charts' },
  { to: '/email-templates', label: 'Email Templates' },
  { to: '/lead-generator', label: 'Lead Generator' },
  { to: '/bid-generator', label: 'Bid Generator' },
  { to: '/competitive-pricing', label: 'Market Pricing' },
  { to: '/industry', label: 'Industry Reference' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/receipts', label: 'Activity Receipts' },
  { to: '/guardrails', label: 'Guardrails' },
  { to: '/settings', label: 'Settings' },
];
const TAB_PATHS = ['/', '/visualizer', '/leads', '/inbox', '/more'];

export function DeviceShell() {
  const [more, setMore] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('vx-theme-v2');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    return 'dark';
  });
  const [isNativeMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator as any;
    return (
      nav.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      /WebView|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
    );
  });
  const [userToggled, setUserToggled] = useState(false);
  const [settings, setSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tabHistory, setTabHistory] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('vx-tab-history') || '{}'); } catch { return {}; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { notice, notify } = useApp();
  const { newProjectOpen, closeNewProject, searchOpen, query, setQuery, toggleSearch } = useUI();
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const showBack = !TAB_PATHS.includes(location.pathname);
  const activeTab = NAV.find(n => n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to))?.to || null;
  useEffect(() => {
    if (!activeTab) return;
    setTabHistory(prev => {
      if (prev[activeTab] === location.pathname) return prev;
      const next = { ...prev, [activeTab]: location.pathname };
      try { localStorage.setItem('vx-tab-history', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [activeTab, location.pathname]);
  const handleTabClick = (root: string) => {
    if (activeTab === root) navigate(root);
    else navigate(tabHistory[root] || root);
  };
  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
    try { localStorage.setItem('vx-theme-v2', theme); } catch {}
  }, [theme]);

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
        <div className={"vx-screen" + (isNativeMobile ? " vx-native" : "")}>
          {!isNativeMobile && <div className="vx-statusbar"><span>{time}</span><div className="vx-island" /><div className="vx-status-icons"><span>●●●</span><span>📶</span><div className="vx-battery" /></div></div>}
          <div className="vx-brandbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {showBack && <button onClick={() => navigate(-1)} className="vx-back-btn" aria-label="Go back"><ChevronLeft className="vx-icon" /></button>}
              <div className="vx-brand-logo" style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 56, letterSpacing: '-.04em', color: 'var(--vx-text)' }}>VISUAL<span style={{ color: 'var(--vx-accent)' }}>X</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={toggleSearch} className="vx-icon-btn" aria-label="Search"><Search className="vx-icon" /></button>
              <button onClick={toggleTheme} className="vx-icon-btn" aria-label="Toggle theme">{theme === 'dark' ? <Sun className="vx-icon" /> : <Moon className="vx-icon" />}</button>
              <div className="vx-avatar">VX</div>
            </div>
          </div>
          <div className="vx-main">
            {searchOpen && (
              <div style={{ padding: '0 28px 8px' }}>
                <input className="vx-input" placeholder="Search projects, locations, systems…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
              </div>
            )}
            <div className="vx-page vx-page-scroll"><Outlet /></div>
          </div>
          <nav className="vx-nav">
            {NAV.map(i => <button key={i.to} className={activeTab === i.to ? 'active' : ''} onClick={() => handleTabClick(i.to)}><i.icon className="vx-icon" /><span>{i.label}</span></button>)}
            <button onClick={() => setMore(true)}><Menu className="vx-icon" /><span>More</span></button>
          </nav>
          <VisualXDrawer open={more} title="All screens" onClose={() => setMore(false)}>
            <button className="vx-btn outline-accent" onClick={() => { navigate('/more'); setMore(false); }}><Settings className="vx-icon" />System &amp; Guardrails</button>
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
          {newProjectOpen && <NewProjectSheet onClose={closeNewProject} />}
        </div>
      </div>
    </div>
  );
}