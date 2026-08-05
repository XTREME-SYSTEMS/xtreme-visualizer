import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { AppState } from '../types';

interface AppContextValue {
  state: AppState | null;
  loading: boolean;
  error: string;
  notice: string;
  selectedColorIds: string[];
  selectedSystemSlug: string;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
  toggleColor: (id: string) => void;
  setSelectedSystemSlug: (slug: string) => void;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(['FB-807','CM-124','524']);
  const [selectedSystemSlug, setSelectedSystemSlug] = useState('flake-epoxy');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setState(await api.state()); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load app state'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const notify = useCallback((message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600); }, []);
  const toggleColor = useCallback((id: string) => setSelectedColorIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id].slice(-4)), []);
  const value = useMemo(() => ({ state, loading, error, notice, selectedColorIds, selectedSystemSlug, refresh, notify, toggleColor, setSelectedSystemSlug }), [state, loading, error, notice, selectedColorIds, selectedSystemSlug, refresh, notify, toggleColor]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
