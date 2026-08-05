import { type FC } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useApp } from './components/AppProvider';
import { DeviceShell } from './components/visual-x/DeviceShell';
import { HomeRoute } from './components/visual-x/routes/HomeRoute';
import { LeadRoute } from './components/visual-x/routes/LeadRoute';
import { ProductsRoute } from './components/visual-x/routes/ProductsRoute';
import { QuoteRoute } from './components/visual-x/routes/QuoteRoute';
import { ScanRoute } from './components/visual-x/routes/ScanRoute';
import { ProposalRoute } from './components/visual-x/routes/ProposalRoute';
import { VisualizerRoute } from './components/visual-x/routes/VisualizerRoute';
import { CompareRoute } from './components/visual-x/routes/CompareRoute';
import { BlendsRoute } from './components/visual-x/routes/BlendsRoute';
import { MetallicRoute } from './components/visual-x/routes/MetallicRoute';
import { VisualXLoadingState, VisualXErrorState, VisualXEmptyState } from './components/visual-x';
import { screenByKey, type ScreenKey } from './data/screens';

const ROUTES: Partial<Record<ScreenKey, FC>> = {
  home: HomeRoute,
  lead: LeadRoute,
  products: ProductsRoute,
  quote: QuoteRoute,
  scan: ScanRoute,
  proposal: ProposalRoute,
  visualizer: VisualizerRoute,
  compare: CompareRoute,
  blends: BlendsRoute,
  metallic: MetallicRoute,
};

export function VisualXScreen() {
  const params = useParams();
  const { state, loading, error, refresh } = useApp();
  const key = (params.screen || 'home') as ScreenKey;
  const screen = screenByKey[key] || screenByKey.home;
  const RouteComp = ROUTES[key];
  if (loading) return <DeviceShell><VisualXLoadingState label={`Loading ${screen.title}…`} /></DeviceShell>;
  if (error || !state) return <DeviceShell><VisualXErrorState error={error || 'Runtime state was unavailable.'} retry={() => void refresh()} /></DeviceShell>;
  return <DeviceShell>{RouteComp ? <RouteComp /> : <VisualXEmptyState title={`${screen.title} — in progress`}>This route is being built in the next batch.</VisualXEmptyState>}</DeviceShell>;
}

export default function VisualXRoutes() {
  return <Routes><Route path="/" element={<Navigate to="/app/home" replace />} /><Route path="/app/:screen" element={<VisualXScreen />} /><Route path="*" element={<Navigate to="/app/home" replace />} /></Routes>;
}