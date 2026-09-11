import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Download } from 'lucide-react';
import { tokens } from './tokens';

export default function OutputPanel({ result, error, loading, mode }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCopyValue = () => {
    if (!result) return '';
    if (mode === 'image') return result.image || '';
    if (mode === 'speech') return result.audio || '';
    return result.text || '';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ color: tokens.textSecondary, fontFamily: tokens.fontDisplay, fontSize: '0.8125rem' }}>
          Awaiting gateway response...
        </div>
      );
    }
    if (error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tokens.danger, fontFamily: tokens.fontDisplay, fontSize: '0.8125rem' }}>
            <AlertCircle size={16} /> Gateway Error
          </div>
          <div style={{ color: tokens.danger, fontFamily: tokens.fontBody, fontSize: '0.8125rem', whiteSpace: 'pre-wrap' }}>
            {error}
          </div>
        </div>
      );
    }
    if (!result) {
      return (
        <div style={{ color: tokens.textSecondary, fontFamily: tokens.fontDisplay, fontSize: '0.8125rem' }}>
          No output yet. Run a request.
        </div>
      );
    }

    if (mode === 'image') {
      if (!result.image) {
        return (
          <div style={{ color: tokens.textSecondary, fontFamily: tokens.fontDisplay, fontSize: '0.8125rem' }}>
            No image returned.{result.text ? ` Text: ${result.text}` : ''}
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
          <img
            src={result.image}
            alt="Generated"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: tokens.radius, border: `1px solid ${tokens.border}` }}
          />
          {result.text && (
            <div style={{ color: tokens.textSecondary, fontFamily: tokens.fontBody, fontSize: '0.75rem' }}>{result.text}</div>
          )}
        </div>
      );
    }

    if (mode === 'speech') {
      if (!result.audio) {
        return <div style={{ color: tokens.textSecondary, fontFamily: tokens.fontDisplay, fontSize: '0.8125rem' }}>No audio returned.</div>;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', justifyContent: 'center' }}>
          <audio controls src={result.audio} style={{ width: '100%' }} />
          {result.warnings?.length > 0 && (
            <div style={{ color: tokens.textSecondary, fontSize: '0.75rem', fontFamily: tokens.fontBody }}>
              Warnings: {result.warnings.join(', ')}
            </div>
          )}
        </div>
      );
    }

    // text and transcribe
    const text = result.text || '';
    return (
      <div style={{
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: tokens.textPrimary,
        fontFamily: tokens.fontBody, fontSize: '0.875rem', lineHeight: 1.6,
        overflow: 'auto', flex: 1,
      }}>
        {text}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {renderContent()}
      </div>
      {result && (result.image || result.audio || result.text) && (
        <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 8 }}>
          {mode === 'image' && result.image && (
            <a
              href={result.image}
              download="generated-image.png"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                borderRadius: tokens.radius, background: tokens.surface,
                border: `1px solid ${tokens.border}`, color: tokens.textSecondary,
                fontSize: '0.75rem', fontFamily: tokens.fontDisplay, textDecoration: 'none', cursor: 'pointer',
              }}
            >
              <Download size={14} /> Save
            </a>
          )}
          <button
            onClick={() => copyToClipboard(getCopyValue())}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              borderRadius: tokens.radius, background: tokens.surface,
              border: `1px solid ${tokens.border}`,
              color: copied ? tokens.accentGreen : tokens.textSecondary,
              fontSize: '0.75rem', fontFamily: tokens.fontDisplay, cursor: 'pointer',
            }}
          >
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
      )}
    </div>
  );
}