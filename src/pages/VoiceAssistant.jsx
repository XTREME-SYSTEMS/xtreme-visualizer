import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Play, Phone, Settings, AlertTriangle } from "lucide-react";
import ScriptManager from "@/components/voice/ScriptManager";

const VOICES = [
  { id: "river", label: "River", desc: "Calm, neutral" },
  { id: "honey", label: "Honey", desc: "Warm, soft" },
  { id: "sunny", label: "Sunny", desc: "Bright, upbeat" },
  { id: "storm", label: "Storm", desc: "Formal, authoritative" },
  { id: "spark", label: "Spark", desc: "Energetic, quick" },
];

export default function VoiceAssistant() {
  const [voice, setVoice] = useState("river");
  const [previewing, setPreviewing] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [testText, setTestText] = useState("Thanks for calling Visual-X. How can I help with your floor project today?");

  const preview = async () => {
    if (!testText.trim()) return;
    setPreviewing(true);
    try {
      const res = await base44.integrations.Core.GenerateSpeech({ text: testText.slice(0, 500), voice, language_code: "en" });
      setAudioUrl(res.url);
    } catch {
      setAudioUrl("");
    } finally {
      setPreviewing(false);
    }
  };

  const notify = (msg) => { const t = document.createElement("div"); t.className = "vx-toast"; t.textContent = msg; t.style.cssText = "position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:200"; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

  return (
    <div className="page hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Voice Assistant</h1>
          <p>AI phone agent that qualifies callers, books appointments, and creates CRM files automatically.</p>
        </div>
      </div>

      {/* Twilio config status */}
      <div className="hx-sys-card" style={{ display: "grid", gap: 12 }}>
        <div className="hx-bid-input-label"><Phone size={15} /> Twilio Phone Integration</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,210,0,.06)", border: "1px solid #9a7b00" }}>
          <AlertTriangle size={16} style={{ color: "#ffd200", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#ffd200" }}>Configure your Twilio credentials in the <strong style={{ color: "var(--vx-accent)" }}>Admin console</strong> (bookmark <code>/admin</code>). Then point your Twilio number's voice webhook to the URL below.</span>
        </div>
        <div className="hx-notice" style={{ borderColor: "var(--vx-border-soft)", background: "var(--vx-panel)" }}>
          <strong style={{ color: "var(--vx-accent)", fontSize: 11 }}>Voice Webhook URL</strong>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--vx-muted)", wordBreak: "break-all" }}>
            <code style={{ color: "var(--vx-accent)" }}>https://visualx.base44.app/api/functions/twilio-voice</code>
          </p>
        </div>
        <button className="hx-mini-btn dark" onClick={async () => {
          try { const r = await base44.functions.invoke("twilio-voice", { ping: true }); const d = r.data || r; if (d.ok) notify("Voice endpoint is live ✓"); else notify("Voice endpoint error"); }
          catch (e) { notify("Voice endpoint unreachable"); }
        }}><Settings size={14} /> Test Voice Endpoint</button>
      </div>

      {/* Voice selector */}
      <div className="hx-sys-card" style={{ display: "grid", gap: 12 }}>
        <div className="hx-bid-input-label"><Play size={15} /> Voice Selection</div>
        <div className="hx-depth-row" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {VOICES.map((v) => (
            <button key={v.id} className={"hx-depth" + (voice === v.id ? " active" : "")} onClick={() => setVoice(v.id)} style={{ padding: "10px 4px" }}>
              <strong>{v.label}</strong><small>{v.desc}</small>
            </button>
          ))}
        </div>
        <div className="field"><label>Preview text</label><textarea className="hx-bid-textarea" style={{ minHeight: 60 }} value={testText} onChange={(e) => setTestText(e.target.value)} /></div>
        <button className="gold-button" style={{ justifyContent: "center" }} onClick={preview} disabled={previewing}>
          {previewing ? <Loader2 size={15} className="spin" /> : <Play size={15} />} Preview Voice
        </button>
        {audioUrl && (
          <audio controls src={audioUrl} style={{ width: "100%" }} />
        )}
      </div>

      {/* Script manager */}
      <ScriptManager notify={notify} />
    </div>
  );
}