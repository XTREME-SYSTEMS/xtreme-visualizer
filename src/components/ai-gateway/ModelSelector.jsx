import React from 'react';
import { tokens, MODELS } from './tokens';

export default function ModelSelector({ mode, model, setModel }) {
  const models = MODELS[mode] || [];
  return (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      style={{
        padding: '6px 10px', borderRadius: tokens.radius,
        border: `1px solid ${tokens.border}`, background: tokens.surface,
        color: tokens.textPrimary, fontFamily: tokens.fontDisplay,
        fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
        outline: 'none', minWidth: 180,
      }}
    >
      {models.map((m) => (
        <option key={m.id} value={m.id} style={{ background: tokens.surface }}>{m.label}</option>
      ))}
    </select>
  );
}