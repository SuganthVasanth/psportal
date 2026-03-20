import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono";

export default function ReferenceSolutionEditor({
  language = "python",
  code = "",
  onChange,
  readOnly = false,
}) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">Reference solution</span>
        {!readOnly && (
          <select
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            value={language}
            onChange={(e) => onChange?.({ language: e.target.value, code })}
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        )}
      </div>
      <textarea
        className={inputClass}
        rows={12}
        placeholder="// Reference solution (used to generate outputs)"
        value={code}
        onChange={(e) => onChange?.({ language, code: e.target.value })}
        readOnly={readOnly}
      />
    </div>
  );
}
