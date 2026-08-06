import React, { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function MonthCalendar({ appointments = [], cursorDate, setCursorDate, selectedDate, onSelectDate }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursorDate]);

  const apptByDay = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      const ref = a.confirmed_start ? parseISO(a.confirmed_start) : (a.requested_date ? new Date(a.requested_date + "T00:00:00") : null);
      if (!ref) return;
      const key = format(ref, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    return map;
  }, [appointments]);

  return (
    <div className="hx-cal">
      <div className="hx-cal-head">
        <button className="hx-cal-nav" onClick={() => setCursorDate(addMonths(cursorDate, -1))} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <strong className="hx-cal-title">{format(cursorDate, "MMMM yyyy")}</strong>
        <button className="hx-cal-nav" onClick={() => setCursorDate(addMonths(cursorDate, 1))} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="hx-cal-dow">
        {DOW.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="hx-cal-grid">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = apptByDay.get(key) || [];
          const inMonth = isSameMonth(day, cursorDate);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          return (
            <button
              key={key}
              className={"hx-cal-day" + (inMonth ? "" : " muted") + (selected ? " selected" : "") + (today ? " today" : "") + (dayAppts.length ? " has" : "")}
              onClick={() => onSelectDate && onSelectDate(day)}
            >
              <span className="hx-cal-num">{format(day, "d")}</span>
              {dayAppts.length > 0 && (
                <span className="hx-cal-dots">
                  {dayAppts.slice(0, 3).map((a, i) => (
                    <span key={i} className={"hx-cal-dot " + (a.status === "confirmed" ? "confirmed" : a.status === "completed" ? "done" : "open")} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}