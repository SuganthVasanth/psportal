import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function ClozePassage({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const passage = value?.passage ?? props.placeholder ?? "Enter passage. Use ___ for each blank.";
  const answers = value?.answers ?? [];

  if (readOnly) {
    const parts = (passage || "").split(/(___+)/g);
    return (
      <div className={cardClass}>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">
          {parts.map((part, i) =>
            /___+/.test(part) ? (
              <span key={i} className="inline-block mx-1 border-b-2 border-slate-300 w-24 align-bottom">
                {answers[Math.floor(parts.slice(0, i).filter(p => /___+/.test(p)).length)] ?? "..."}
              </span>
            ) : (
              part
            )
          )}
        </p>
      </div>
    );
  }

  const blankCount = (passage.match(/___+/g) || []).length;
  const ans = Array.from({ length: Math.max(blankCount, 1) }, (_, i) => answers[i] ?? "");

  return (
    <div className={cardClass}>
      <label className="mb-1 block text-sm font-medium text-slate-700">Passage (use ___ for blanks)</label>
      <textarea
        className={inputClass}
        rows={4}
        value={passage}
        onChange={(e) => onChange?.({ ...value, passage: e.target.value })}
      />
      <div className="mt-3">
        <span className="mb-1 block text-xs font-medium text-slate-600">Answers per blank</span>
        <div className="flex flex-wrap gap-2">
          {ans.map((a, i) => (
            <input
              key={i}
              type="text"
              className={`${inputClass} w-32`}
              placeholder={`Blank ${i + 1}`}
              value={a}
              onChange={(e) => {
                const next = [...ans];
                next[i] = e.target.value;
                onChange?.({ ...value, answers: next });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
