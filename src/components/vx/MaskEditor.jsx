import React, { useRef, useState } from "react";

export default function MaskEditor({ photoUrl, points, onChange }) {
  const boxRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const move = (event, index) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const touch = event.touches?.[0];
    const clientX = touch ? touch.clientX : event.clientX;
    const clientY = touch ? touch.clientY : event.clientY;
    const x = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (clientY - box.top) / box.height));
    const next = points.map((p, i) => (i === index ? [Number(x.toFixed(4)), Number(y.toFixed(4))] : p));
    onChange(next);
  };

  const polygon = points.map(([x, y]) => `${x * 1000},${y * 600}`).join(" ");

  return (
    <div
      ref={boxRef}
      className="relative aspect-[5/3] w-full touch-none overflow-hidden rounded-[var(--vx-radius)] border"
      style={{ borderColor: "var(--vx-border-soft)", background: "var(--vx-panel-2)" }}
      onMouseMove={(e) => dragging !== null && move(e, dragging)}
      onMouseUp={() => setDragging(null)}
      onMouseLeave={() => setDragging(null)}
      onTouchMove={(e) => dragging !== null && move(e, dragging)}
      onTouchEnd={() => setDragging(null)}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="Floor being masked" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-xs" style={{ color: "var(--vx-faint)" }}>
          Capture a photo to edit the floor mask
        </div>
      )}
      <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <polygon
          points={polygon}
          fill="rgba(156,255,0,0.22)"
          stroke="#9cff00"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x * 1000}
            cy={y * 600}
            r="16"
            fill="#9cff00"
            stroke="#030303"
            strokeWidth="4"
            onMouseDown={() => setDragging(i)}
            onTouchStart={() => setDragging(i)}
            style={{ cursor: "grab" }}
          />
        ))}
      </svg>
    </div>
  );
}