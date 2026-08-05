import React from "react";
import { Trash2 } from "lucide-react";
import { money } from "@/lib/vx";

export default function QuoteLineEditor({ item, index, onChange, onRemove }) {
  const set = (key, value) => onChange(index, { ...item, [key]: value });
  const total = (Number(item.quantity) || 0) * (Number(item.rate) || 0);

  return (
    <div
      className="space-y-2 rounded-2xl border p-3"
      style={{ borderColor: "var(--vx-border-soft)", background: "var(--vx-panel-2)" }}
    >
      <div className="flex items-center gap-2">
        <input
          className="vx-input flex-1"
          value={item.name || ""}
          placeholder="Line item"
          onChange={(e) => set("name", e.target.value)}
        />
        <button
          onClick={() => onRemove(index)}
          aria-label="Remove line item"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
          style={{ borderColor: "var(--vx-border-soft)", color: "var(--vx-danger)" }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <input
        className="vx-input"
        value={item.description || ""}
        placeholder="Description"
        onChange={(e) => set("description", e.target.value)}
      />
      <div className="grid grid-cols-3 items-center gap-2">
        <input
          className="vx-input"
          type="number"
          inputMode="decimal"
          value={item.quantity ?? ""}
          placeholder="Qty / SF"
          onChange={(e) => set("quantity", e.target.value === "" ? "" : Number(e.target.value))}
        />
        <input
          className="vx-input"
          type="number"
          inputMode="decimal"
          value={item.rate ?? ""}
          placeholder="Rate"
          onChange={(e) => set("rate", e.target.value === "" ? "" : Number(e.target.value))}
        />
        <strong className="text-right text-sm" style={{ color: "var(--vx-accent)" }}>
          {money.format(total)}
        </strong>
      </div>
    </div>
  );
}