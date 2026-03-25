import React, { useEffect, useMemo } from "react";
import TestCaseEditor from "./subcomponents/TestCaseEditor";
import ReferenceSolutionEditor from "./subcomponents/ReferenceSolutionEditor";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function ProgrammingQuestion({
  config = {},
  value = {},
  onChange,
  readOnly = false,
  studentMode = false,
}) {
  const props = config.properties || {};
  const problemStatement = value?.problemStatement ?? "";
  const referenceSolution = value?.referenceSolution ?? { language: "python", code: "" };
  const rawTestCases = Array.isArray(value?.testCases) ? value.testCases : [];
  const studentCode = value?.code ?? "";

  const seededTestCases = useMemo(() => {
    const sampleN = Math.max(0, Number(props.sampleTestCases ?? 2) || 0);
    const hiddenN = Math.max(0, Number(props.hiddenTestCases ?? 2) || 0);
    const total = sampleN + hiddenN;
    if (!total) return [];
    return Array.from({ length: total }, (_, i) => ({
      input: "",
      expectedOutput: "",
      hidden: i >= sampleN,
    }));
  }, [props.sampleTestCases, props.hiddenTestCases]);

  const testCases = rawTestCases.length ? rawTestCases : seededTestCases;

  // Seed initial testcases once for faculty, so they can edit immediately.
  useEffect(() => {
    if (studentMode || readOnly) return;
    if (rawTestCases.length > 0) return;
    if (!seededTestCases.length) return;
    onChange?.({ ...value, testCases: seededTestCases });
    // Intentionally exclude `value` from deps to avoid infinite loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentMode, readOnly, rawTestCases.length, seededTestCases.length]);

  const handleGenerateOutput = () => {
    // Placeholder: in a real app this would call backend to run reference solution with each test input
    onChange?.({ ...value, testCases });
  };

  if (studentMode) {
    return (
      <div className="space-y-4">
        <div className={cardClass}>
          <span className="text-sm font-medium text-slate-700">Problem</span>
          <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{problemStatement || "No statement."}</p>
        </div>
        <div className={cardClass}>
          <label className="mb-1 block text-sm font-medium text-slate-700">Your code</label>
          <textarea
            className={inputClass}
            rows={14}
            placeholder="// Your solution"
            value={studentCode}
            onChange={(e) => onChange?.({ ...value, code: e.target.value })}
            readOnly={readOnly}
          />
        </div>
        {testCases.filter((tc) => !tc.hidden).length > 0 && (
          <div className={cardClass}>
            <span className="text-sm font-medium text-slate-700">Sample test cases</span>
            <div className="mt-2 space-y-2">
              {testCases.filter((tc) => !tc.hidden).map((tc, i) => (
                <div key={i} className="rounded border border-slate-200 p-2 text-xs">
                  <div>Input format: {tc.input || "—"}</div>
                  <div>Output format: {tc.expectedOutput || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <label className="mb-1 block text-sm font-medium text-slate-700">Problem statement</label>
        <textarea
          className={inputClass}
          rows={4}
          placeholder="Describe the problem"
          value={problemStatement}
          onChange={(e) => onChange?.({ ...value, problemStatement: e.target.value })}
          readOnly={readOnly}
        />
      </div>
      <ReferenceSolutionEditor
        language={referenceSolution.language}
        code={referenceSolution.code}
        onChange={(sol) => onChange?.({ ...value, referenceSolution: sol })}
        readOnly={readOnly}
      />
      <TestCaseEditor
        testCases={testCases}
        onChange={(next) => onChange?.({ ...value, testCases: next })}
        onGenerateOutput={handleGenerateOutput}
        readOnly={readOnly}
      />
    </div>
  );
}
