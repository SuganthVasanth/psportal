import React from "react";
import { Plus, Trash2 } from "lucide-react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono";

export default function TestCaseEditor({
  testCases = [],
  onChange,
  onGenerateOutput,
  readOnly = false,
}) {
  const addCase = () => {
    onChange?.([...testCases, { input: "", expectedOutput: "", hidden: false }]);
  };
  const removeCase = (idx) => {
    onChange?.(testCases.filter((_, i) => i !== idx));
  };
  const updateCase = (idx, field, value) => {
    const next = testCases.map((c, i) =>
      i === idx ? { ...c, [field]: value } : c
    );
    onChange?.(next);
  };

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">Test cases</span>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onGenerateOutput}
              className="rounded-lg border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
            >
              Generate output
            </button>
            <button
              type="button"
              onClick={addCase}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {testCases.map((tc, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">Input</label>
              {!readOnly && (
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={!!tc.hidden}
                    onChange={(e) => updateCase(idx, "hidden", e.target.checked)}
                  />
                  Hidden
                </label>
              )}
            </div>
            <textarea
              className={inputClass}
              rows={2}
              placeholder="Input"
              value={tc.input ?? ""}
              onChange={(e) => updateCase(idx, "input", e.target.value)}
              readOnly={readOnly}
            />
            <div>
              <label className="text-xs font-medium text-slate-600">Expected output</label>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Output"
                value={tc.expectedOutput ?? ""}
                onChange={(e) => updateCase(idx, "expectedOutput", e.target.value)}
                readOnly={readOnly}
              />
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeCase(idx)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
