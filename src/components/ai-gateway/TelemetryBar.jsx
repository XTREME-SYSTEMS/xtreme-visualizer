import React from 'react';
import { Activity, Zap } from 'lucide-react';
import { tokens } from './tokens';

export default function TelemetryBar({ telemetry, mode, model }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px',
      borderTop: `1px solid ${tokens.border}`, background: tokens.bg,
      fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', color: tokens.textSecondary,
      overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <Activity size={12} color={tokens.accentPurple} /> {tokens.gatewayEndpoint}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <Zap size={12} color={tokens.accentGreen} />
        {telemetry.latencyMs != null ? `${telemetry.latencyMs}ms` : '—'}
      </div>
      <div style={{ whiteSpace: 'nowrap' }}>
        Payload: {telemetry.payloadSize != null ? `${(telemetry.payloadSize / 1024).toFixed(1)}KB` : '—'}
      </div>
      <div style={{ whiteSpace: 'nowrap', marginLeft: 'auto', color: tokens.accentPurple }}>
        {mode} · {model}
      </div>
    </div>
  );
}