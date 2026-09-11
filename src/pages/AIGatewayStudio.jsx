import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { tokens, MODELS } from '@/components/ai-gateway/tokens';
import ModalityRail from '@/components/ai-gateway/ModalityRail';
import ModelSelector from '@/components/ai-gateway/ModelSelector';
import InputPanel from '@/components/ai-gateway/InputPanel';
import OutputPanel from '@/components/ai-gateway/OutputPanel';
import DiagnosticsDrawer from '@/components/ai-gateway/DiagnosticsDrawer';
import TelemetryBar from '@/components/ai-gateway/TelemetryBar';

export default function AIGatewayStudio() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [mode, setMode] = useState('text');
  const [model, setModel] = useState(MODELS.text[0].id);
  const [prompt, setPrompt] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [schema, setSchema] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [audioFile, setAudioFile] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState({ latencyMs: null, payloadSize: null });
  const [logs, setLogs] = useState([]);
  const [secretConnected, setSecretConnected] = useState(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    setModel(MODELS[mode][0].id);
  }, [mode]);

  const addLog = (entry) => {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), ...entry }, ...prev].slice(0, 20));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const startTime = Date.now();

    const payload = { mode };
    if (mode === 'text') {
      if (!prompt.trim()) { setError('Prompt is required'); setLoading(false); return; }
      payload.prompt = prompt;
      payload.model = model;
      if (systemMessage) payload.systemMessage = systemMessage;
      if (schema) {
        try { payload.response_json_schema = JSON.parse(schema); }
        catch { setError('Invalid JSON schema'); setLoading(false); return; }
      }
    } else if (mode === 'image') {
      if (!prompt.trim()) { setError('Prompt is required'); setLoading(false); return; }
      payload.prompt = prompt;
      payload.model = model;
    } else if (mode === 'speech') {
      if (!prompt.trim()) { setError('Text is required'); setLoading(false); return; }
      payload.text = prompt;
      payload.model = model;
      payload.voice = voice;
    } else if (mode === 'transcribe') {
      if (!audioBase64) { setError('Upload an audio file first'); setLoading(false); return; }
      payload.audio = audioBase64.data;
      payload.mediaType = audioBase64.mediaType;
      payload.model = model;
    }

    const payloadSize = JSON.stringify(payload).length;
    addLog({ type: 'request', mode, model, payloadSize });

    try {
      const response = await base44.functions.invoke('vercel-ai-gateway', payload);
      const data = response.data;
      const latencyMs = data.latencyMs || (Date.now() - startTime);
      setResult(data);
      setTelemetry({ latencyMs, payloadSize });
      setSecretConnected(true);
      addLog({ type: 'response', latencyMs, ok: data.ok });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Request failed';
      setError(msg);
      addLog({ type: 'error', message: msg });
      if (msg.includes('secret not set')) setSecretConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const statusPill = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
      borderRadius: tokens.radius, border: `1px solid ${tokens.border}`,
      background: tokens.surface, fontFamily: tokens.fontDisplay, fontSize: '0.6875rem',
      color: secretConnected === false ? tokens.danger : secretConnected ? tokens.accentGreen : tokens.textSecondary,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: secretConnected === false ? tokens.danger : secretConnected ? tokens.accentGreen : tokens.textSecondary,
      }} />
      {secretConnected === false ? 'No Key' : secretConnected ? 'Connected' : 'Pending'}
    </span>
  );

  if (isMobile) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: tokens.bg, boxSizing: 'border-box', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${tokens.border}`, flexShrink: 0 }}>
          <span style={{ fontFamily: tokens.fontDisplay, fontSize: '1.25rem', fontWeight: 600, color: tokens.textPrimary }}>AI Gateway</span>
          {statusPill}
          <div style={{ marginLeft: 'auto' }}>
            <ModelSelector mode={mode} model={model} setModel={setModel} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, overflowY: 'auto', minHeight: 0 }}>
          <ModalityRail mode={mode} setMode={setMode} secretConnected={secretConnected} isMobile={true} />
          <div style={{ fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', fontWeight: 600, color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Input</div>
          <InputPanel
            mode={mode} prompt={prompt} setPrompt={setPrompt}
            systemMessage={systemMessage} setSystemMessage={setSystemMessage}
            schema={schema} setSchema={setSchema}
            voice={voice} setVoice={setVoice}
            audioFile={audioFile} setAudioFile={setAudioFile}
            audioBase64={audioBase64} setAudioBase64={setAudioBase64}
            onGenerate={handleGenerate} loading={loading}
          />
          <div style={{ fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', fontWeight: 600, color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Output</div>
          <div style={{ minHeight: 240, flex: 1, borderRadius: tokens.radius, border: `1px solid ${tokens.border}`, background: tokens.surface, overflow: 'hidden' }}>
            <OutputPanel result={result} error={error} loading={loading} mode={mode} />
          </div>
          <DiagnosticsDrawer secretConnected={secretConnected} telemetry={telemetry} logs={logs} isMobile={true} />
        </div>
        <TelemetryBar telemetry={telemetry} mode={mode} model={model} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: tokens.bg, boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${tokens.border}`, flexShrink: 0 }}>
        <span style={{ fontFamily: tokens.fontDisplay, fontSize: '1.25rem', fontWeight: 600, color: tokens.textPrimary }}>AI Gateway</span>
        {statusPill}
        <div style={{ marginLeft: 'auto' }}>
          <ModelSelector mode={mode} model={model} setModel={setModel} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ModalityRail mode={mode} setMode={setMode} secretConnected={secretConnected} isMobile={false} />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${tokens.border}`, minHeight: 0 }}>
            <div style={{ padding: '10px 16px', fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', fontWeight: 600, color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${tokens.border}`, flexShrink: 0 }}>Input</div>
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <InputPanel
                mode={mode} prompt={prompt} setPrompt={setPrompt}
                systemMessage={systemMessage} setSystemMessage={setSystemMessage}
                schema={schema} setSchema={setSchema}
                voice={voice} setVoice={setVoice}
                audioFile={audioFile} setAudioFile={setAudioFile}
                audioBase64={audioBase64} setAudioBase64={setAudioBase64}
                onGenerate={handleGenerate} loading={loading}
              />
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '10px 16px', fontFamily: tokens.fontDisplay, fontSize: '0.6875rem', fontWeight: 600, color: tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${tokens.border}`, flexShrink: 0 }}>Output</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <OutputPanel result={result} error={error} loading={loading} mode={mode} />
            </div>
          </div>
        </div>
        <DiagnosticsDrawer secretConnected={secretConnected} telemetry={telemetry} logs={logs} isMobile={false} />
      </div>
      <TelemetryBar telemetry={telemetry} mode={mode} model={model} />
    </div>
  );
}