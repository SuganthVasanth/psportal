import React from "react";
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
  const testCases = value?.testCases ?? [];
  const studentCode = value?.code ?? "";

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
                  <div>Input: {tc.input || "—"}</div>
                  <div>Expected: {tc.expectedOutput || "—"}</div>
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
