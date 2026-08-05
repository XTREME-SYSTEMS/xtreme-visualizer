import type { ScreenKey } from '../../data/screens';

export const componentFeatureFlagByScreen: Record<ScreenKey, string> = {
  home: 'feature_component_home',
  lead: 'feature_component_lead',
  products: 'feature_component_products',
  quote: 'feature_component_quote',
  scan: 'feature_component_scan',
  proposal: 'feature_component_proposal',
  visualizer: 'feature_component_visualizer',
  compare: 'feature_component_compare',
  blends: 'feature_component_blends',
  metallic: 'feature_component_metallic'
};

export const componentFeatureFlags = Object.values(componentFeatureFlagByScreen);
