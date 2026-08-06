import { useEffect, useState, type CSSProperties } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Camera, Users, MessageSquare, Menu, Sun, Moon, ChevronLeft, Trash2, Settings, Search, LogOut } from 'lucide-react';
import { VisualXDrawer, VisualXDialog } from './VisualXPrimitives';
import { useApp } from '@/components/AppProvider';
import { useUI } from '@/lib/uiContext';
import NewProjectSheet from '@/components/vq/NewProjectSheet';
import PWAInstallButton from '@/components/PWAInstallButton';
import RemindersBell from '@/components/RemindersBell';
import { base44 } from '@/api/base44Client';

import { ClipboardList, Camera as CameraIcon, Users as UsersIcon, MessageSquare as InboxIcon, BarChart3, Share2, Globe, Calendar, Settings as SettingsIcon } from 'lucide-react';

const NAV = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/visualizer', label: 'New Bid', icon: Camera },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/inbox', label: 'Inbox', icon: MessageSquare },
];
const MORE = [
  { to: '/voice', label: 'Voice Assistant' },
  { to: '/operations', label: 'Operations Hub' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tracking', label: 'Analytics & Tracking' },
  { to: '/projects', label: 'Projects' },
  { to: '/systems', label: 'Floor Systems' },
  { to: '/pricing', label: 'Pricing Rules' },
  { to: '/close', label: 'Proposal Studio' },
  { to: '/crm', label: 'Digital Card Studio' },
  { to: '/products', label: 'Products' },
  { to: '/colors', label: 'Color Charts' },
  { to: '/email-templates', label: 'Email Templates' },
  { to: '/lead-generator', label: 'Lead Generator' },
  { to: '/bid-generator', label: 'Bid Generator' },
  { to: '/video-studio', label: 'Video Studio' },
  { to: '/competitive-pricing', label: 'Market Pricing' },
  { to: '/industry', label: 'Industry Reference' },
  { to: '/appointments', label: 'Schedule' },
  { to: '/billing', label: 'Billing & Invoices' },
  { to: '/receipts', label: 'Activity Receipts' },
  { to: '/guardrails', label: 'Guardrails' },
  { to: '/settings', label: 'Settings' },
];

// #23: Role-based navigation — admins see everything, crew sees field ops, sales sees CRM tools
const CREW_NAV = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/operations', label: 'Operations', icon: ClipboardList },
  { to: '/field', label: 'Field', icon: CameraIcon },
  { to: '/inbox', label: 'Inbox', icon: InboxIcon },
];
const CREW_MORE = [
  { to: '/field', label: 'Field Dashboard' },
  { to: '/appointments', label: 'Schedule' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/settings', label: 'Settings' },
];
const SALES_NAV = [
  { to: '/app', label: 'Home', icon: Home },
  { to: '/visualizer', label: 'New Bid', icon: Camera },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/inbox', label: 'Inbox', icon: MessageSquare },
];
const SALES_MORE = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/close', label: 'Proposal Studio' },
  { to: '/crm', label: 'Digital Card Studio' },
  { to: '/lead-generator', label: 'Lead Generator' },
  { to: '/bid-generator', label: 'Bid Generator' },
  { to: '/video-studio', label: 'Video Studio' },
  { to: '/appointments', label: 'Schedule' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/settings', label: 'Settings' },
];
const TAB_PATHS = ['/app', '/visualizer', '/leads', '/inbox', '/more'];
const MORE_TAB = '/more';

export function DeviceShell() {
  const [more, setMore] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem('vx-theme-v2');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
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
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(min-width: 768px)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
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
  const isHome = location.pathname === '/app';
  const pageClassName = isHome ? "vx-page vx-page-noscroll" : "vx-page vx-page-scroll";
  const homePageStyle: CSSProperties | undefined = isHome ? { overflow: 'hidden', height: '100%', position: 'absolute', inset: 0, touchAction: 'none' } : undefined;
  const activeTab = NAV.find(n => n.to === '/app' ? location.pathname === '/app' : location.pathname.startsWith(n.to))?.to || null;
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
  const goBack = () => {
    const state = window.history.state as { idx?: number } | null;
    const idx = state && typeof state.idx === 'number' ? state.idx : 0;
    if (idx > 0) navigate(-1);
    else navigate(activeTab || '/more');
  };
  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
    try { localStorage.setItem('vx-theme-v2', theme); } catch {}
  }, [theme]);
  const [user, setUser] = useState<any>(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  const userRole = user?.role || 'admin';
  const navItems = userRole === 'crew' ? CREW_NAV : userRole === 'sales' ? SALES_NAV : NAV;
  const moreItems = userRole === 'crew' ? CREW_MORE : userRole === 'sales' ? SALES_MORE : MORE;
  const initials = user?.full_name ? user.full_name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() : 'VX';
  const handleLogout = async () => { try { await base44.auth.logout(); window.location.href = '/login'; } catch { notify('Logout failed'); } };

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
    <div className={"vx-stage" + (isDesktop ? " vx-desktop" : "")}>
      <div className="vx-device">
        <div className="vx-side-buttons" />
        <div className={"vx-screen" + (isDesktop ? " vx-desktop" : "") + (isNativeMobile ? " vx-native" : "")}>
          {isDesktop ? (
            <>
              <aside className="vx-sidebar">
                <img src="/logo.png" alt="Xtreme Floor Visualizer" style={{ height: 34, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,214,10,.25))', marginTop: 8, marginLeft: -12 }} />
                <nav className="vx-sidebar-nav">
                  {navItems.map(i => <button key={i.to} className={activeTab === i.to ? 'active' : ''} onClick={() => handleTabClick(i.to)}><i.icon className="vx-icon" /><span>{i.label}</span></button>)}
                  <button className={activeTab === '/more' ? 'active' : ''} onClick={() => navigate('/more')}><Menu className="vx-icon" /><span>More</span></button>
                </nav>
              </aside>
              <div className="vx-content">
                <div className="vx-topbar">
                  {showBack && <button onClick={goBack} className="vx-back-btn" aria-label="Go back"><ChevronLeft className="vx-icon" /></button>}
                  <div className="vx-search-bar">
                    <Search className="vx-icon" />
                    <input className="vx-search-input" placeholder="Search projects, locations, systems…" value={query} onChange={e => setQuery(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RemindersBell />
                    <button onClick={toggleTheme} className="vx-icon-btn" aria-label="Toggle theme">{theme === 'dark' ? <Sun className="vx-icon" /> : <Moon className="vx-icon" />}</button>
                    <button onClick={() => setSettings(true)} className="vx-avatar" aria-label="Account">{initials}</button>
                  </div>
                </div>
                <div className="vx-main">
                  <div className={pageClassName} style={homePageStyle}><Outlet /></div>
                </div>
              </div>
            </>
          ) : (
            <>
              {!isNativeMobile && <div className="vx-statusbar"><span>{time}</span><div className="vx-island" /><div className="vx-status-icons"><span>●●●</span><span>📶</span><div className="vx-battery" /></div></div>}
              <div className="vx-brandbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {showBack && <button onClick={goBack} className="vx-back-btn" aria-label="Go back"><ChevronLeft className="vx-icon" /></button>}
                  <img src="/logo.png" alt="Xtreme Floor Visualizer" style={{ height: 120, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,214,10,.25))', marginTop: 8, marginLeft: -12 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <RemindersBell />
                  <button onClick={toggleSearch} className="vx-icon-btn" aria-label="Search"><Search className="vx-icon" /></button>
                  <button onClick={toggleTheme} className="vx-icon-btn" aria-label="Toggle theme">{theme === 'dark' ? <Sun className="vx-icon" /> : <Moon className="vx-icon" />}</button>
                  <button onClick={() => setSettings(true)} className="vx-avatar" aria-label="Account">{initials}</button>
                </div>
              </div>
              <div className="vx-main">
                {searchOpen && (
                  <div style={{ padding: '0 28px 8px' }}>
                    <input className="vx-input" placeholder="Search projects, locations, systems…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
                  </div>
                )}
                <div className={pageClassName} style={homePageStyle}><Outlet /></div>
              </div>
              <nav className="vx-nav">
                {navItems.map(i => <button key={i.to} className={activeTab === i.to ? 'active' : ''} onClick={() => handleTabClick(i.to)}><i.icon className="vx-icon" /><span>{i.label}</span></button>)}
                <button className={activeTab === '/more' ? 'active' : ''} onClick={() => navigate('/more')}><Menu className="vx-icon" /><span>More</span></button>
              </nav>
            </>
          )}
          <VisualXDrawer open={more} title="All screens" onClose={() => setMore(false)}>
            <button className="vx-btn outline-accent" onClick={() => { navigate('/more'); setMore(false); }}><Settings className="vx-icon" />System &amp; Guardrails</button>
            {moreItems.map(i => <button key={i.to} className="vx-btn" onClick={() => { navigate(i.to); setMore(false); }}>{i.label}</button>)}
            <button className="vx-btn outline-accent" onClick={() => { setMore(false); setSettings(true); }}><Settings className="vx-icon" />Settings &amp; Account</button>
          </VisualXDrawer>
          <VisualXDrawer open={settings} title="Settings & Account" onClose={() => setSettings(false)}>
            <div className="vx-card-soft" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="vx-avatar" style={{ flexShrink: 0 }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: 15 }}>{user?.full_name || 'Xtreme User'}</strong>
                <span style={{ fontSize: 12, color: 'var(--vx-muted)', wordBreak: 'break-all' }}>{user?.email || ''}</span>
              </div>
            </div>
            <div className="vx-grid vx-grid-2">
              <button className={`vx-btn ${theme === 'dark' ? 'primary' : ''}`} onClick={toggleTheme}><Moon className="vx-icon" />Dark</button>
              <button className={`vx-btn ${theme === 'light' ? 'primary' : ''}`} onClick={toggleTheme}><Sun className="vx-icon" />Light</button>
            </div>
            <button className="vx-btn" onClick={handleLogout}><LogOut className="vx-icon" />Sign Out</button>
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
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
}