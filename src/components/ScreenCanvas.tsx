import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import type { ScreenConfig } from '../data/screens';

export function ScreenCanvas({ screen, onAction }: { screen: ScreenConfig; onAction: (action: string) => void }) {
  const [showTargets, setShowTargets] = useState(false);
  return (
    <div className="parity-stage">
      <div className="parity-canvas" aria-label={`${screen.title} locked visual target`}>
        <img src={screen.image} alt={`${screen.title} Visual X mobile interface`} draggable={false} />
        {screen.hotspots.map((spot, index) => (
          <button
            key={`${spot.label}-${index}`}
            className={`hotspot ${showTargets ? 'show' : ''}`}
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
            onClick={() => onAction(spot.action)}
            aria-label={spot.label}
            title={spot.label}
          ><span>{spot.label}</span></button>
        ))}
        <button className="target-toggle" onClick={() => setShowTargets(v => !v)} title="Show interactive areas" aria-label="Show interactive areas">
          <Settings2 size={16} />
        </button>
      </div>
    </div>
  );
}
