import React from 'react';
import { KeyRound, Clock, ScrollText } from 'lucide-react';
import { tokens } from './tokens';

export default function DiagnosticsDrawer({ secretConnected, telemetry, logs, isMobile }) {
  return (
    <div style={{
      width: isMobile ? '100%' : 280, flexShrink: 0,
      borderLeft: isMobile ? 'none' : `1px solid ${tokens.border}`,
      borderTop: isMobile ? `1px solid ${tokens.border}` : 'none',
      background: tokens.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${tokens.border}` }}>
        <div style={{
          fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', fontWeight: 600,
          color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
        }}>
          Diagnostics
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <KeyRound size={14} color={secretConnected === false ? tokens.danger : tokens.accentGreen} />
          <span style={{ fontFamily: tokens.fontDisplay, fontSize: '0.75rem', color: tokens.textPrimary }}>Secret</span>
          <span style={{
            marginLeft: 'auto', fontFamily: tokens.fontDisplay, fontSize: '0.6875rem',
            color: secretConnected === false ? tokens.danger : secretConnected ? tokens.accentGreen : tokens.textSecondary,
          }}>
            {secretConnected === false ? 'Missing' : secretConnected ? 'Connected' : 'Unknown'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} color={tokens.accentPurple} />
          <span style={{ fontFamily: tokens.fontDisplay, fontSize: '0.75rem', color: tokens.textPrimary }}>Latency</span>
          <span style={{ marginLeft: 'auto', fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', color: tokens.textSecondary }}>
            {telemetry.latencyMs != null ? `${telemetry.latencyMs}ms` : '—'}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ScrollText size={14} color={tokens.textSecondary} />
          <span style={{
            fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', fontWeight: 600,
            color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Payload Logs
          </span>
        </div>
        {logs.length === 0 ? (
          <div style={{ color: tokens.textSecondary, fontSize: '0.75rem', fontFamily: tokens.fontBody }}>No requests yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                padding: 8, borderRadius: tokens.radius, background: tokens.surface,
                border: `1px solid ${tokens.border}`, fontFamily: tokens.fontDisplay, fontSize: '0.6875rem',
              }}>
                <div style={{ color: tokens.textSecondary, marginBottom: 4 }}>{log.time}</div>
                <div style={{ color: log.type === 'error' ? tokens.danger : log.type === 'response' ? tokens.accentGreen : tokens.accentPurple }}>
                  {log.type === 'request' ? `→ ${log.mode} · ${log.model}` : log.type === 'response' ? `← ${log.latencyMs}ms` : `✕ ${log.message}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}