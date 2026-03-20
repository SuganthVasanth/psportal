import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function NumericAnswer({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const label = props.label ?? "Numeric Answer";
  const mode = props.mode ?? "exact";
  const val = value?.value ?? "";

  return (
    <div className={cardClass}>
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        type="number"
        step={mode === "decimal" ? "0.01" : "1"}
        className={inputClass}
        placeholder={props.placeholder ?? "Enter number"}
        value={val}
        onChange={(e) => onChange?.({ ...value, value: e.target.value })}
        readOnly={readOnly}
      />
    </div>
  );
}
