import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function DebuggingQuestion({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const code = value?.code ?? "";
  const explanation = value?.explanation ?? "";

  return (
    <div className={cardClass}>
      {props.label && <span className="mb-2 block text-sm font-medium text-slate-700">{props.label}</span>}
      <label className="mb-1 block text-xs font-medium text-slate-600">Code (find the bug)</label>
      <textarea
        className={inputClass}
        rows={8}
        placeholder={props.placeholder ?? "Code with bug"}
        value={code}
        onChange={(e) => onChange?.({ ...value, code: e.target.value })}
        readOnly={readOnly}
      />
      <label className="mt-2 mb-1 block text-xs font-medium text-slate-600">Your answer / explanation</label>
      <textarea
        className={inputClass}
        rows={3}
        placeholder="Describe the bug and fix"
        value={explanation}
        onChange={(e) => onChange?.({ ...value, explanation: e.target.value })}
        readOnly={readOnly}
      />
    </div>
  );
}
