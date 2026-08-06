import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { format, isSameDay, parseISO, startOfWeek, addDays } from "date-fns";
import { base44 } from "@/api/base44Client";
import {
  Loader2,
  CalendarClock,
  Plus,
  Sparkles,
  CalendarCheck,
  MapPin,
  Clock,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import MonthCalendar from "@/components/schedule/MonthCalendar";
import AppointmentEditor from "@/components/schedule/AppointmentEditor";

const STATUS_META = {
  requested: { label: "Requested", cls: "open" },
  confirmed: { label: "Confirmed", cls: "confirmed" },
  completed: { label: "Completed", cls: "done" },
  cancelled: { label: "Cancelled", cls: "off" },
  no_show: { label: "No Show", cls: "off" },
};

const TYPE_ICON = { consultation: CalendarClock, site_visit: MapPin, virtual: Clock };

export default function Appointments() {
  const [appts, setAppts] = useState(null);
  const [cursorDate, setCursorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [editing, setEditing] = useState(null);
  const [prepLoading, setPrepLoading] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    base44.entities.Appointment.list("-created_date", 200).then(setAppts);
  }, []);
  useEffect(() => { load(); }, [load]);

  const notify = (msg) => {
    const t = document.createElement("div");
    t.className = "vx-toast";
    t.textContent = msg;
    t.style.position = "fixed";
    t.style.bottom = "120px";
    t.style.left = "50%";
    t.style.transform = "translateX(-50%)";
    t.style.zIndex = "200";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  if (!appts) return <div className="hx-loading"><Loader2 className="spin" size={26} /></div>;

  const sorted = [...appts].sort((a, b) => {
    const da = a.confirmed_start || a.requested_date || "";
    const db = b.confirmed_start || b.requested_date || "";
    return da.localeCompare(db);
  });

  const visible = sorted.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (selectedDate) {
      const ref = a.confirmed_start ? parseISO(a.confirmed_start) : (a.requested_date ? new Date(a.requested_date + "T00:00:00") : null);
      return ref && isSameDay(ref, selectedDate);
    }
    return true;
  });

  const counts = {
    requested: appts.filter((a) => a.status === "requested").length,
    confirmed: appts.filter((a) => a.status === "confirmed").length,
    completed: appts.filter((a) => a.status === "completed").length,
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeek = appts.filter((a) => {
    const ref = a.confirmed_start ? parseISO(a.confirmed_start) : null;
    return ref && ref >= weekStart && ref < addDays(weekStart, 7);
  }).length;

  const generatePrep = async (a) => {
    setPrepLoading(a.id);
    try {
      const prompt = `Generate a concise, actionable prep briefing for a floor coating contractor with a ${a.type?.replace(/_/g, " ") || "consultation"} appointment${a.customer_name ? ` with ${a.customer_name}` : ""}${a.location ? ` at ${a.location}` : ""}${a.message ? `. Customer note: "${a.message}"` : ""}. Include 3 sections: "Bring" (tools/materials to bring), "Ask" (key questions to ask the customer), "Notes" (relevant considerations). Keep each section to 2-3 short bullet points. Use plain text with section labels.`;
      const notes = await base44.integrations.Core.InvokeLLM({ prompt });
      await base44.entities.Appointment.update(a.id, { prep_notes: notes, prep_notes_generated_at: new Date().toISOString() });
      load();
      notify("Prep notes generated");
    } catch (e) {
      notify("Prep notes failed");
    } finally {
      setPrepLoading(null);
    }
  };

  const quickStatus = async (a, status) => {
    await base44.entities.Appointment.update(a.id, { status });
    load();
  };

  return (
    <div className="hx-page" style={{ gap: 10 }}>
      <div className="hx-page-head">
        <div>
          <h1>Schedule</h1>
          <p>AI-enhanced appointment management with Google Calendar sync.</p>
        </div>
        <button className="hx-mini-btn" onClick={() => setEditing({ customer_name: "New Appointment", type: "consultation", requested_window: "morning" })}>
          <Plus size={16} /> New
        </button>
      </div>

      <div className="hx-stats hx-stats-4">
        <div className="hx-stat"><strong>{counts.requested}</strong><span>Requested</span></div>
        <div className="hx-stat"><strong>{counts.confirmed}</strong><span>Confirmed</span></div>
        <div className="hx-stat"><strong>{thisWeek}</strong><span>This Week</span></div>
        <div className="hx-stat"><strong>{counts.completed}</strong><span>Done</span></div>
      </div>

      <MonthCalendar
        appointments={appts}
        cursorDate={cursorDate}
        setCursorDate={setCursorDate}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate((prev) => (prev && isSameDay(prev, d) ? null : d))}
      />

      <div className="hx-filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
        <button className={filter === "requested" ? "active" : ""} onClick={() => setFilter("requested")}>Requested</button>
        <button className={filter === "confirmed" ? "active" : ""} onClick={() => setFilter("confirmed")}>Confirmed</button>
        <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Completed</button>
        {selectedDate && (
          <button className="active" onClick={() => setSelectedDate(null)} style={{ marginLeft: "auto" }}>
            <X size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
            {format(selectedDate, "MMM d")}
          </button>
        )}
      </div>

      <div className="hx-list">
        {!visible.length ? (
          <div className="hx-empty">
            <span>📅</span>
            No appointments{selectedDate ? ` on ${format(selectedDate, "MMM d")}` : ""}.
          </div>
        ) : (
          visible.map((a) => {
            const meta = STATUS_META[a.status] || STATUS_META.requested;
            const Icon = TYPE_ICON[a.type] || CalendarClock;
            const start = a.confirmed_start ? parseISO(a.confirmed_start) : null;
            return (
              <div key={a.id} className="hx-sys-card" style={{ cursor: "default" }}>
                <div className="hx-sys-head">
                  <div className="hx-sys-title">
                    <div className="hx-sys-icon"><Icon size={18} /></div>
                    <div>
                      <strong>{a.customer_name}</strong>
                      <span>{a.type?.replace(/_/g, " ") || "consultation"} · {meta.label}</span>
                    </div>
                  </div>
                  <span className={"hx-sys-toggle " + meta.cls} style={{ pointerEvents: "none" }}>{meta.label}</span>
                </div>

                <div className="hx-sys-chips">
                  {start && <span className="hx-sys-chip"><Clock size={11} style={{ verticalAlign: "middle" }} /> {format(start, "EEE, MMM d · h:mm a")}</span>}
                  {a.location && <span className="hx-sys-chip"><MapPin size={11} style={{ verticalAlign: "middle" }} /> {a.location}</span>}
                  {a.requested_window && !start && <span className="hx-sys-chip">{a.requested_window}</span>}
                  {a.calendar_link && <span className="hx-sys-chip" style={{ borderColor: "var(--vx-accent)", color: "var(--vx-accent)" }}><CalendarCheck size={11} /> Synced</span>}
                </div>

                {a.message && <p className="hx-sys-desc" style={{ fontStyle: "italic" }}>"{a.message}"</p>}

                {a.prep_notes && (
                  <div className="hx-sys-card" style={{ background: "var(--vx-panel)", border: "1px solid var(--vx-border-soft)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Sparkles size={13} style={{ color: "var(--vx-accent)" }} />
                      <strong style={{ fontSize: 11, color: "var(--vx-accent)", letterSpacing: ".06em", textTransform: "uppercase" }}>AI Prep Notes</strong>
                    </div>
                    <p className="hx-sys-desc" style={{ whiteSpace: "pre-wrap" }}>{a.prep_notes}</p>
                  </div>
                )}

                <div className="hx-bid-controls" style={{ marginTop: 4 }}>
                  <button className="hx-sys-edit" onClick={() => setEditing(a)}>Edit / Schedule</button>
                  {!a.prep_notes ? (
                    <button className="hx-sys-edit" onClick={() => generatePrep(a)} disabled={prepLoading === a.id}>
                      {prepLoading === a.id ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Prep Notes
                    </button>
                  ) : (
                    <button className="hx-sys-edit" onClick={() => generatePrep(a)} disabled={prepLoading === a.id}>
                      {prepLoading === a.id ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} Regenerate
                    </button>
                  )}
                </div>

                <div className="hx-sys-chips" style={{ marginTop: 4 }}>
                  {a.status !== "confirmed" && (
                    <button className="hx-sys-chip" style={{ cursor: "pointer", borderColor: "var(--vx-accent)", color: "var(--vx-accent)" }} onClick={() => quickStatus(a, "confirmed")}>
                      <Check size={11} style={{ verticalAlign: "middle" }} /> Mark confirmed
                    </button>
                  )}
                  {a.status !== "completed" && a.status !== "cancelled" && (
                    <button className="hx-sys-chip" style={{ cursor: "pointer" }} onClick={() => quickStatus(a, "completed")}>Mark completed</button>
                  )}
                  {a.status !== "cancelled" && (
                    <button className="hx-sys-chip" style={{ cursor: "pointer", color: "var(--vx-danger)" }} onClick={() => quickStatus(a, "cancelled")}>Cancel</button>
                  )}
                  {a.lead_id && <Link to={`/leads/${a.lead_id}`} className="hx-sys-chip" style={{ textDecoration: "none", cursor: "pointer" }}>Open lead →</Link>}
                  {a.calendar_link && (
                    <a href={a.calendar_link} target="_blank" rel="noreferrer" className="hx-sys-chip" style={{ textDecoration: "none", cursor: "pointer", borderColor: "var(--vx-accent)", color: "var(--vx-accent)" }}>
                      <ExternalLink size={11} style={{ verticalAlign: "middle" }} /> Calendar
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {editing && (
        <AppointmentEditor
          appointment={editing}
          existingAppts={appts}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          notify={notify}
        />
      )}
    </div>
  );
}