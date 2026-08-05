// Floor system color charts — maps visualizer system names to their exact
// XPS manufacturer color chart colors, brightened for black-background visibility.
import { FLOOR_SYSTEM_DATA } from '@/data/colorData';

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

const systemByName = Object.fromEntries(FLOOR_SYSTEM_DATA.map(s => [s.name, s]));

// Returns the brightened actual color-chart hex values for a floor system.
export function getSystemColors(name: string): string[] {
  const sys = systemByName[name];
  if (!sys || !sys.colors?.length) return ['#888888'];
  return sys.colors.map(c => brighten(c.hex));
}

// Returns color records (name + brightened hex + code) for full chart display.
export function getSystemColorRecords(name: string): { name: string; hex: string; code: string }[] {
  const sys = systemByName[name];
  if (!sys || !sys.colors?.length) return [];
  return sys.colors.map(c => ({ name: c.name, hex: brighten(c.hex), code: c.code }));
}

// Representative multi-stop gradient built from the actual color chart.
export function getSystemGradient(name: string): string {
  const colors = getSystemColors(name).slice(0, 4);
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}