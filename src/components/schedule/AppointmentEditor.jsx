import React, { useState } from "react";
import { format } from "date-fns";
import { Sparkles, CalendarCheck, X, Loader2, Clock, MapPin, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ResponsiveSelect from "@/components/vq/ResponsiveSelect";

const TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "site_visit", label: "Site Visit" },
  { value: "virtual", label: "Virtual" },
];

const WINDOWS = [
  { value: "morning", label: "Morning (8–11am)" },
  { value: "midday", label: "Midday (11am–1pm)" },
  { value: "afternoon", label: "Afternoon (1–4pm)" },
  { value: "evening", label: "Evening (4–6pm)" },
];

export default function AppointmentEditor({ appointment, existingAppts, onClose, onSaved, notify }) {
  const a = appointment || {};
  const initialDate = a.confirmed_start ? format(new Date(a.confirmed_start), "yyyy-MM-dd") : a.requested_date || format(new Date(), "yyyy-MM-dd");
  const initialTime = a.confirmed_start ? format(new Date(a.confirmed_start), "HH:mm") : "09:00";

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(a.duration_minutes || 60);
  const [location, setLocation] = useState(a.location || "");
  const [type, setType] = useState(a.type || "consultation");
  const [windowPref, setWindowPref] = useState(a.requested_window || "morning");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [syncCalendar, setSyncCalendar] = useState(true);

  const buildStart = (d, t) => new Date(`${d}T${t}:00`);
  const buildEnd = (start, mins) => new Date(start.getTime() + mins * 60000);

  const suggestTimes = async () => {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const busy = existingAppts
        .filter((x) => x.confirmed_start && x.id !== a.id)
        .map((x) => format(new Date(x.confirmed_start), "EEE MMM d HH:mm"));
      const prompt = `You are a scheduling assistant for a floor coating contractor. The customer requested a ${type.replace("_", " ")}${a.message ? ` and noted: "${a.message}"` : ""}. They prefer a ${windowPref} window. The contractor's existing confirmed appointments are: ${busy.length ? busy.join(", ") : "none yet"}. Today is ${format(new Date(), "EEEE MMM d yyyy")}. Suggest 3 optimal time slots in the next 14 days, within business hours 8am-6pm Mon-Sat, avoiding conflicts and clustering. Return an array of objects with "datetime" (ISO 8601 local, e.g. 2026-08-08T09:00) and "reason" (one short sentence).`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: { datetime: { type: "string" }, reason: { type: "string" } },
              },
            },
          },
        },
      });
      setSuggestions(res.suggestions || []);
    } catch (e) {
      notify && notify("AI suggestion failed");
    } finally {
      setSuggesting(false);
    }
  };

  const pickSuggestion = (s) => {
    const dt = new Date(s.datetime);
    setDate(format(dt, "yyyy-MM-dd"));
    setTime(format(dt, "HH:mm"));
  };

  const save = async (confirm) => {
    setSaving(true);
    const start = buildStart(date, time);
    const end = buildEnd(start, duration);
    const payload = {
      type,
      requested_window: windowPref,
      location,
      duration_minutes: duration,
      confirmed_start: start.toISOString(),
      confirmed_end: end.toISOString(),
      status: confirm ? "confirmed" : a.status || "requested",
    };
    try {
      let saved = a;
      if (a.id) {
        saved = await base44.entities.Appointment.update(a.id, payload);
      } else {
        saved = await base44.entities.Appointment.create({ ...payload, customer_name: a.customer_name || "New Appointment" });
      }

      if (confirm && syncCalendar) {
        try {
          const r = await fetch("/api/v1/functions/createCalendarAppointment/entry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              summary: `${type.replace("_", " ")} — ${a.customer_name || "Customer"}`,
              description: a.message || "",
              startDateTime: start.toISOString(),
              endDateTime: end.toISOString(),
              location,
              leadId: a.lead_id,
            }),
          });
          const data = await r.json();
          if (data.eventId) {
            saved = await base44.entities.Appointment.update(saved.id, {
              calendar_event_id: data.eventId,
              calendar_link: data.htmlLink,
            });
          } else if (data.error) {
            notify && notify("Calendar sync failed: " + (data.error || "check Google Calendar connection"));
          }
        } catch (e) {
          notify && notify("Calendar sync failed");
        }
      }
      onSaved && onSaved(saved);
    } catch (e) {
      notify && notify("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">{a.id ? "Edit appointment" : "New appointment"}</div>
            <h2>{a.customer_name || "New Appointment"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        {a.message && (
          <div className="hx-sys-card" style={{ marginBottom: 12 }}>
            <p className="hx-sys-desc" style={{ fontStyle: "italic" }}>"{a.message}"</p>
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label>Type</label>
            <div className="hx-depth-row">
              {TYPES.map((t) => (
                <button key={t.value} className={"hx-depth" + (type === t.value ? " active" : "")} onClick={() => setType(t.value)}>
                  <strong>{t.label.split(" ")[0]}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid two">
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="form-grid two">
            <div className="field">
              <label>Duration (min)</label>
              <ResponsiveSelect
                value={duration}
                onValueChange={(v) => setDuration(Number(v))}
                options={[30, 45, 60, 90, 120].map((d) => ({ value: d, label: `${d} min` }))}
              />
            </div>
            <div className="field">
              <label>Preferred window</label>
              <ResponsiveSelect
                value={windowPref}
                onValueChange={setWindowPref}
                options={WINDOWS}
              />
            </div>
          </div>

          <div className="field">
            <label>Location / address</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="123 Main St, Austin, TX" />
          </div>
        </div>

        <button className="gold-button" style={{ width: "100%", marginTop: 14, justifyContent: "center" }} onClick={suggestTimes} disabled={suggesting}>
          {suggesting ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          {suggesting ? "Finding optimal slots…" : "AI Suggest Times"}
        </button>

        {suggestions.length > 0 && (
          <div className="hx-sys-grid" style={{ marginTop: 10 }}>
            {suggestions.map((s, i) => {
              const dt = new Date(s.datetime);
              return (
                <button key={i} className="hx-sys-card" style={{ cursor: "pointer", textAlign: "left" }} onClick={() => pickSuggestion(s)}>
                  <div className="hx-sys-head">
                    <div className="hx-sys-title">
                      <div className="hx-sys-icon"><Clock size={16} /></div>
                      <div>
                        <strong>{format(dt, "EEE, MMM d · h:mm a")}</strong>
                        <span>{s.reason}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <label className="hx-bid-discount" style={{ marginTop: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={syncCalendar} onChange={(e) => setSyncCalendar(e.target.checked)} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text)" }}>
            <CalendarCheck size={15} style={{ verticalAlign: "middle", marginRight: 6, color: "var(--vx-accent)" }} />
            Sync to Google Calendar on confirm
          </span>
        </label>

        <div className="hx-bid-controls" style={{ marginTop: 16 }}>
          <button className="vx-btn" onClick={() => save(false)} disabled={saving}>Save draft</button>
          <button className="gold-button" style={{ justifyContent: "center" }} onClick={() => save(true)} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            {saving ? "Saving…" : "Confirm & Sync"}
          </button>
        </div>
      </div>
    </div>
  );
}