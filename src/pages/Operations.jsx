import React, { useState } from "react";
import { ClipboardList, FileDiff, DollarSign, HardHat } from "lucide-react";
import WorkOrderManager from "@/components/ops/WorkOrderManager";
import ChangeOrderManager from "@/components/ops/ChangeOrderManager";
import JobCostManager from "@/components/ops/JobCostManager";
import SubcontractorManager from "@/components/ops/SubcontractorManager";

const TABS = [
  { id: "work", label: "Work Orders", icon: ClipboardList },
  { id: "change", label: "Change Orders", icon: FileDiff },
  { id: "cost", label: "Job Costing", icon: DollarSign },
  { id: "subs", label: "Subcontractors", icon: HardHat },
];

export default function Operations() {
  const [tab, setTab] = useState("work");
  const notify = (msg) => { const t = document.createElement("div"); t.className = "vx-toast"; t.textContent = msg; t.style.cssText = "position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:200"; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); };

  return (
    <div className="page hx-page" style={{ gap: 12 }}>
      <div className="hx-page-head">
        <div>
          <h1>Operations Hub</h1>
          <p>Work orders, change orders, job costing, and subcontractor management for the whole company.</p>
        </div>
      </div>

      <div className="hx-depth-row" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {TABS.map((t) => (
          <button key={t.id} className={"hx-depth" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
            <strong><t.icon size={14} style={{ verticalAlign: "middle" }} /> {t.label}</strong>
          </button>
        ))}
      </div>

      {tab === "work" && <WorkOrderManager notify={notify} />}
      {tab === "change" && <ChangeOrderManager notify={notify} />}
      {tab === "cost" && <JobCostManager notify={notify} />}
      {tab === "subs" && <SubcontractorManager notify={notify} />}
    </div>
  );
}