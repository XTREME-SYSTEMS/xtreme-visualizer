import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/vq/PageHeader";
import EmptyState from "@/components/vq/EmptyState";
import ResponsiveSelect from "@/components/vq/ResponsiveSelect";
import { Loader2, CalendarClock } from "lucide-react";
import PullToRefresh from "@/components/vq/PullToRefresh";

export default function Appointments() {
  const [appts, setAppts] = useState(null);

  const load = () => base44.entities.Appointment.list("-created_date", 100).then(setAppts);
  useEffect(() => { load(); }, []);

  if (!appts) return <div className="py-24 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <PullToRefresh onRefresh={load}>
    <div>
      <PageHeader eyebrow="Contractor console" title="Appointments" description="Consultation and site-visit requests. Confirmations are tracked here; no messages are sent in preview mode." />
      {!appts.length ? (
        <EmptyState icon={CalendarClock} title="No appointment requests" hint="Requests arrive when a customer submits a VisualQuote." />
      ) : (
        <div className="space-y-3">
          {appts.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-900 truncate">{a.customer_name}</p>
                <p className="text-[12px] text-slate-500">
                  {a.type?.replace(/_/g, " ")} · {a.requested_date || "date open"} · {a.requested_window}
                </p>
                {a.message && <p className="mt-1 text-[12px] text-slate-500 line-clamp-2">{a.message}</p>}
                {a.lead_id && <Link to={`/leads/${a.lead_id}`} className="text-[12px] text-slate-900 underline">Open lead</Link>}
              </div>
              <ResponsiveSelect
                value={a.status}
                onValueChange={async (v) => {
                  const prev = appts;
                  setAppts((list) => list.map((x) => x.id === a.id ? { ...x, status: v } : x));
                  try {
                    await base44.entities.Appointment.update(a.id, { status: v });
                    load();
                  } catch (e) {
                    setAppts(prev);
                  }
                }}
                options={["requested", "confirmed", "completed", "cancelled", "no_show"].map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                className="w-[150px] text-[12px]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}