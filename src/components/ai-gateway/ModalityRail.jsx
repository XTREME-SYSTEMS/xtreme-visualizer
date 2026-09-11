import React from 'react';
import { Type, Image as ImageIcon, Volume2, FileAudio } from 'lucide-react';
import { tokens } from './tokens';

const MODALITIES = [
  { id: 'text', label: 'Text LLM', Icon: Type },
  { id: 'image', label: 'Image Gen', Icon: ImageIcon },
  { id: 'speech', label: 'Speech TTS', Icon: Volume2 },
  { id: 'transcribe', label: 'Transcription', Icon: FileAudio },
];

export default function ModalityRail({ mode, setMode, secretConnected, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {MODALITIES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: tokens.radius,
              border: `1px solid ${mode === id ? tokens.accentGreen : tokens.border}`,
              background: mode === id ? 'rgba(0,229,153,0.08)' : tokens.surface,
              color: mode === id ? tokens.accentGreen : tokens.textSecondary,
              fontFamily: tokens.fontBody, fontSize: '0.75rem', fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8, borderRight: `1px solid ${tokens.border}`,
      padding: '16px 0', background: tokens.bg,
    }}>
      {MODALITIES.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          title={label}
          style={{
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: tokens.radius,
            border: `1px solid ${mode === id ? tokens.accentGreen : 'transparent'}`,
            background: mode === id ? 'rgba(0,229,153,0.1)' : 'transparent',
            color: mode === id ? tokens.accentGreen : tokens.textSecondary,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Icon size={20} />
        </button>
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}
        title={secretConnected === false ? 'Secret Missing' : secretConnected ? 'Secret Connected' : 'Secret Unknown'}
      >
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: secretConnected === false ? tokens.danger : secretConnected ? tokens.accentGreen : tokens.textSecondary,
          boxShadow: secretConnected === true ? `0 0 8px ${tokens.accentGreen}` : 'none',
        }} />
      </div>
    </div>
  );
}