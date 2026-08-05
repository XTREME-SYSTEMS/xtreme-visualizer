// Floor system color charts — maps visualizer system names to their EXACT
// XPS manufacturer color chart from COLOR_DATA, brightened for black-background visibility.
import { COLOR_DATA, FLOOR_SYSTEM_DATA } from '@/data/colorData';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}
function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Lighten dark colors so they're visible on a black background.
export function brighten(hex: string, minLum = 0.24): string {
  if (!hex || !hex.startsWith('#')) return hex || '#888888';
  let [r, g, b] = hexToRgb(hex);
  let lum = luminance(r, g, b);
  if (lum >= minLum) return hex;
  let t = 0;
  while (lum < minLum && t < 0.85) {
    t += 0.04;
    r = r + (255 - r) * t;
    g = g + (255 - g) * t;
    b = b + (255 - b) * t;
    lum = luminance(r, g, b);
  }
  return rgbToHex(r, g, b);
}

// Map floor system names (as shown in the visualizer) to COLOR_DATA system keys.
const SYSTEM_KEY_MAP: Record<string, string> = {
  'Flake Epoxy': 'flake',
  'Metallic Epoxy': 'metallic',
  'Solid Color Epoxy': 'solid',
  'Quartz System': 'quartz',
  'Glitter Epoxy': 'glitter',
  'Polished Concrete': 'dye_stain',
  'Stained Concrete': 'dye_stain',
  'Joint Fill & Repair': 'joint_filler',
};

// Index COLOR_DATA by system key for O(1) lookup.
const colorsBySystem: Record<string, typeof COLOR_DATA> = {};
for (const c of COLOR_DATA) {
  if (!colorsBySystem[c.system]) colorsBySystem[c.system] = [];
  colorsBySystem[c.system].push(c);
}

// Representative swatch color per floor system — chosen for hue variety across the
// system picker (gray, blue, orange, silver, red). Names must exist in that system's
// COLOR_DATA chart; falls back to rank 1 if the name isn't found.
const REPRESENTATIVE_COLOR_NAME: Record<string, string> = {
  'Flake Epoxy': 'Orbit',          // gray
  'Metallic Epoxy': 'Ocean Blue',  // blue
  'Solid Color Epoxy': 'Orange',   // orange
  'Quartz System': 'Crystal',      // silver
  'Glitter Epoxy': 'Red Dragon',   // red
  'Polished Concrete': 'Gray',     // gray
  'Stained Concrete': 'Patriot Blue', // blue
  'Joint Fill & Repair': 'Standard Gray',
};

// Returns the single representative color record for a floor system (used on the
// system picker button so each system shows a distinct hue).
export function getSystemRepresentative(name: string): { name: string; hex: string; code: string; image_url?: string } | null {
  const records = getSystemColorRecords(name);
  if (!records.length) return null;
  const preferred = REPRESENTATIVE_COLOR_NAME[name];
  const match = preferred ? records.find(r => r.name === preferred) : null;
  return match || records[0];
}

// Returns the brightened actual color-chart hex values for a floor system (full chart).
export function getSystemColors(name: string): string[] {
  const key = SYSTEM_KEY_MAP[name];
  const colors = key ? colorsBySystem[key] : undefined;
  if (!colors?.length) {
    // Fallback to FLOOR_SYSTEM_DATA subset
    const sys = FLOOR_SYSTEM_DATA.find(s => s.name === name);
    if (!sys || !sys.colors?.length) return ['#888888'];
    return sys.colors.map(c => brighten(c.hex));
  }
  return colors.map(c => brighten(c.hex));
}

// Returns color records (name + brightened hex + code + image_url) for full chart display.
export function getSystemColorRecords(name: string): { name: string; hex: string; code: string; image_url?: string }[] {
  const key = SYSTEM_KEY_MAP[name];
  const colors = key ? colorsBySystem[key] : undefined;
  if (!colors?.length) {
    const sys = FLOOR_SYSTEM_DATA.find(s => s.name === name);
    if (!sys || !sys.colors?.length) return [];
    return sys.colors.map(c => ({ name: c.name, hex: brighten(c.hex), code: c.code }));
  }
  return colors.map(c => ({ name: c.color_name, hex: brighten(c.hex), code: c.code, image_url: c.image_url }));
}

// Representative multi-stop gradient built from the actual color chart.
export function getSystemGradient(name: string): string {
  const colors = getSystemColors(name).slice(0, 4);
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}