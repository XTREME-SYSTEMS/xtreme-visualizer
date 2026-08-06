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
          <span style={{ fontSize: 12, color: "#ffd200" }}>Not configured yet — add your Twilio Account SID, Auth Token, phone number, and business SIC code in App Settings → Secrets to activate live calls.</span>
        </div>
        <div className="form-grid two">
          <div className="field"><label>Account SID</label><input disabled placeholder="Set in App Secrets" /></div>
          <div className="field"><label>Auth Token</label><input disabled placeholder="Set in App Secrets" type="password" /></div>
          <div className="field"><label>Twilio Phone Number</label><input disabled placeholder="+1XXXXXXXXXX" /></div>
          <div className="field"><label>Business SIC Code</label><input disabled placeholder="e.g. 1750" /></div>
        </div>
        <button className="hx-mini-btn dark" disabled style={{ opacity: 0.5 }}><Settings size={14} /> Test Connection</button>
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