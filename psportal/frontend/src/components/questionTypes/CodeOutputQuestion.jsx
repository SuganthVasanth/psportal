import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-sm";

export default function CodeOutputQuestion({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const n = Math.max(1, parseInt(props.numberOfOptions, 10) || 4);
  const options = value?.options ?? Array.from({ length: n }, (_, i) => `Output ${i + 1}`);
  const selected = value?.value ?? "";
  const code = value?.code ?? "// Code snippet";

  return (
    <div className={cardClass}>
      {props.label && <span className="mb-2 block text-sm font-medium text-slate-700">{props.label}</span>}
      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
        <pre className="text-xs overflow-x-auto whitespace-pre">{code}</pre>
      </div>
      <span className="mb-1 block text-xs font-medium text-slate-600">Select correct output</span>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <label key={i} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`code-out-${config.id}`}
              checked={selected === String(i)}
              onChange={() => onChange?.({ ...value, value: String(i) })}
              disabled={readOnly}
              className="rounded border-slate-300 text-violet-600"
            />
            <span className="text-sm"> {typeof opt === "string" ? opt : opt?.text ?? `Output ${i + 1}`}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
