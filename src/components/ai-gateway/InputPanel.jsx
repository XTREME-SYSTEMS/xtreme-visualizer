import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { tokens, VOICES } from './tokens';

export default function InputPanel({
  mode, prompt, setPrompt, systemMessage, setSystemMessage,
  schema, setSchema, voice, setVoice,
  audioFile, setAudioFile, audioBase64, setAudioBase64,
  onGenerate, loading,
}) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setAudioBase64({ data: base64, mediaType: file.type || 'audio/mpeg' });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
      {mode === 'transcribe' ? (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1px dashed ${audioFile ? tokens.accentGreen : tokens.border}`,
            borderRadius: tokens.radius, padding: 24, textAlign: 'center',
            cursor: 'pointer', background: tokens.surface, transition: 'all 0.15s',
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <input ref={fileRef} type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} />
          <Upload size={24} color={audioFile ? tokens.accentGreen : tokens.textSecondary} style={{ margin: '0 auto 8px' }} />
          <div style={{ color: tokens.textSecondary, fontSize: '0.8125rem', fontFamily: tokens.fontBody }}>
            {audioFile ? audioFile.name : 'Drop or click to upload audio'}
          </div>
          {audioFile && (
            <div style={{ color: tokens.accentGreen, fontSize: '0.6875rem', fontFamily: tokens.fontDisplay, marginTop: 4 }}>
              {(audioFile.size / 1024).toFixed(1)} KB · {audioFile.type || 'unknown'}
            </div>
          )}
        </div>
      ) : (
        <>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === 'speech' ? 'Enter text to synthesize...' : 'Enter your prompt...'}
            style={{
              flex: 1, minHeight: 120, padding: 12, borderRadius: tokens.radius,
              border: `1px solid ${tokens.border}`, background: tokens.surface,
              color: tokens.textPrimary, fontFamily: tokens.fontBody, fontSize: '0.875rem',
              resize: 'none', outline: 'none', lineHeight: 1.5,
            }}
          />
          {mode === 'text' && (
            <>
              <textarea
                value={systemMessage}
                onChange={(e) => setSystemMessage(e.target.value)}
                placeholder="System message (optional)..."
                style={{
                  padding: 10, borderRadius: tokens.radius, border: `1px solid ${tokens.border}`,
                  background: tokens.surface, color: tokens.textPrimary, fontFamily: tokens.fontBody,
                  fontSize: '0.8125rem', resize: 'none', outline: 'none', height: 56,
                }}
              />
              <textarea
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                placeholder='JSON schema (optional) e.g. {"type":"object","properties":{...}}'
                style={{
                  padding: 10, borderRadius: tokens.radius, border: `1px solid ${tokens.border}`,
                  background: tokens.surface, color: tokens.accentPurple, fontFamily: tokens.fontDisplay,
                  fontSize: '0.75rem', resize: 'none', outline: 'none', height: 72,
                }}
              />
            </>
          )}
          {mode === 'speech' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: tokens.textSecondary, fontSize: '0.75rem', fontFamily: tokens.fontDisplay }}>Voice:</span>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: tokens.radius, border: `1px solid ${tokens.border}`,
                  background: tokens.surface, color: tokens.textPrimary, fontFamily: tokens.fontBody,
                  fontSize: '0.75rem', cursor: 'pointer', outline: 'none',
                }}
              >
                {VOICES.map((v) => (
                  <option key={v} value={v} style={{ background: tokens.surface }}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      <button
        onClick={onGenerate}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 16px', borderRadius: tokens.radius, border: 'none',
          background: loading ? tokens.surface : tokens.accentGreen,
          color: loading ? tokens.textSecondary : '#0D0E12',
          fontFamily: tokens.fontDisplay, fontSize: '0.8125rem', fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer', transition: 'all 0.15s',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Processing...</>
        ) : (
          'Generate via Gateway'
        )}
      </button>
    </div>
  );
}