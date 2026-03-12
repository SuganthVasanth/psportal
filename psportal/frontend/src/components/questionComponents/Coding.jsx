import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function Coding({ config = {}, value = {}, onChange }) {
  const { label = "Programming question", testCases: numCasesRaw = 3 } = config;
  const maxCases = Math.min(6, Math.max(1, numCasesRaw || 1));

  const [samples, setSamples] = useState(value.samples || [{ input: "", output: "" }]);
  const [cases, setCases] = useState(
    value.testCases ||
      Array.from({ length: maxCases }, (_, i) => ({
        input: `testcase-${i + 1}`,
        expectedOutput: "",
      }))
  );

  useEffect(() => {
    const nextMax = Math.min(6, Math.max(1, numCasesRaw || 1));
    const fromValueCases = Array.isArray(value.testCases) ? value.testCases : [];
    const limitedCases =
      fromValueCases.length > 0
        ? fromValueCases.slice(0, nextMax)
        : Array.from({ length: nextMax }, (_, i) => ({
            input: `testcase-${i + 1}`,
            expectedOutput: "",
          }));
    setCases(limitedCases);
    const fromSamples = Array.isArray(value.samples) && value.samples.length > 0 ? value.samples : [{ input: "", output: "" }];
    setSamples(fromSamples);
  }, [numCasesRaw, JSON.stringify(value || {})]);

  const syncValue = (nextSamples, nextCases) => {
    setSamples(nextSamples);
    setCases(nextCases);
    onChange?.({
      ...value,
      samples: nextSamples,
      testCases: nextCases,
    });
  };

  const addSample = () => {
    const nextSamples = [...samples, { input: "", output: "" }];
    syncValue(nextSamples, cases);
  };
  const removeSample = (idx) => {
    const nextSamples = samples.filter((_, i) => i !== idx);
    syncValue(nextSamples.length ? nextSamples : [{ input: "", output: "" }], cases);
  };
  const updateSample = (idx, field, val) => {
    const nextSamples = samples.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    syncValue(nextSamples, cases);
  };

  const addCase = () => {
    if (cases.length >= maxCases) return;
    const nextCases = [...cases, { input: "", expectedOutput: "" }];
    syncValue(samples, nextCases);
  };
  const removeCase = (idx) => {
    const nextCases = cases.filter((_, i) => i !== idx);
    syncValue(samples, nextCases.length ? nextCases : [{ input: "testcase-1", expectedOutput: "" }]);
  };
  const updateCase = (idx, field, val) => {
    const nextCases = cases.map((c, i) => (i === idx ? { ...c, [field]: val } : c));
    syncValue(samples, nextCases);
  };

  const canAddCase = cases.length < maxCases;

  return (
    <div className={`${cardClass} flex flex-col gap-4`}>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}

      {/* Sample inputs / outputs */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-600">Sample inputs / outputs (shown to students)</span>
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto">
          {samples.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Sample input</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Sample input"
                  value={s.input}
                  onChange={(e) => updateSample(idx, "input", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Sample output</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Sample output"
                  value={s.output}
                  onChange={(e) => updateSample(idx, "output", e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeSample(idx)}
                disabled={samples.length <= 1}
                className="rounded-lg py-1 text-xs text-gray-500 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 size={12} /> Remove sample
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSample}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#6366f1] hover:bg-[#e0e7ff]/30"
        >
          <Plus size={14} />
          Add sample
        </button>
      </div>

      {/* Hidden test cases */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-gray-600">
          Test cases (hidden, max {maxCases})
        </span>
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
          {cases.map((tc, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Input</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Test case input"
                  value={tc.input}
                  onChange={(e) => updateCase(idx, "input", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Expected output</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="Expected output"
                  value={tc.expectedOutput}
                  onChange={(e) => updateCase(idx, "expectedOutput", e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeCase(idx)}
                disabled={cases.length <= 1}
                className="rounded-lg py-1 text-sm text-gray-500 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 size={14} /> Remove test case
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCase}
            disabled={!canAddCase}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-2 text-sm font-medium text-gray-600 hover:border-[#6366f1] hover:bg-[#e0e7ff]/30 disabled:opacity-50"
          >
            <Plus size={16} />
            {canAddCase ? "Add test case" : `Max ${maxCases} test cases`}
          </button>
        </div>
      </div>
    </div>
  );
}
