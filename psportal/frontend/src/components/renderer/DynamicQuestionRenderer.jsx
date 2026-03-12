import React, { useState, useEffect } from "react";
import MCQ from "../questionComponents/MCQ";
import Coding from "../questionComponents/Coding";
import MatchFollowing from "../questionComponents/MatchFollowing";
import FillBlank from "../questionComponents/FillBlank";
import TrueFalse from "../questionComponents/TrueFalse";
import ShortAnswer from "../questionComponents/ShortAnswer";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function DynamicQuestionRenderer({ layout = [], value = {}, onChange, readOnly }) {
  const layoutArray = Array.isArray(layout) ? layout : (layout?.layout ? layout.layout : []);
  const [localValues, setLocalValues] = useState(() => value || {});

  useEffect(() => {
    setLocalValues(value || {});
  }, [value, layout]);

  const updateField = (idx, fieldValue) => {
    const next = { ...localValues, [idx]: fieldValue };
    setLocalValues(next);
    onChange?.(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {layoutArray.map((item, idx) => {
        const comp = item.component;
        const val = localValues[idx];
        const commonStyle = item.width || item.height ? { width: item.width, height: item.height, minHeight: item.height } : {};

        if (comp === "textLabel") {
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              <span className="text-sm font-medium text-gray-700">{item.label || ""}</span>
            </div>
          );
        }
        if (comp === "textInput") {
          const defaultValue = item.defaultValue ?? "";
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <label className="mb-1 block text-sm font-medium text-gray-700">{item.label}</label>}
              <input
                type="text"
                className={inputClass}
                placeholder={item.placeholder}
                value={val?.value ?? defaultValue}
                onChange={(e) => updateField(idx, { value: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          );
        }
        if (comp === "textarea") {
          const defaultValue = item.defaultValue ?? "";
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <label className="mb-1 block text-sm font-medium text-gray-700">{item.label}</label>}
              <textarea
                className={inputClass}
                rows={4}
                placeholder={item.placeholder || "Question here"}
                value={val?.value ?? defaultValue}
                onChange={(e) => updateField(idx, { value: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          );
        }
        if (comp === "numberInput") {
          const defaultValue = item.defaultValue ?? "";
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <label className="mb-1 block text-sm font-medium text-gray-700">{item.label}</label>}
              <input
                type="number"
                className={inputClass}
                placeholder={item.placeholder}
                value={val?.value ?? defaultValue}
                onChange={(e) => updateField(idx, { value: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          );
        }
        if (comp === "optionList") {
          return (
            <div key={idx} style={commonStyle}>
              <MCQ config={item} value={val} onChange={(v) => updateField(idx, v)} />
            </div>
          );
        }
        if (comp === "testCaseBuilder") {
          return (
            <div key={idx} style={commonStyle}>
              <Coding config={item} value={val} onChange={(v) => updateField(idx, v)} />
            </div>
          );
        }
        if (comp === "matchingPairs") {
          return (
            <div key={idx} style={commonStyle}>
              <MatchFollowing config={item} value={val} onChange={(v) => updateField(idx, v)} />
            </div>
          );
        }
        if (comp === "trueFalseSelector") {
          return (
            <div key={idx} style={commonStyle}>
              <TrueFalse config={item} value={val} onChange={(v) => updateField(idx, v)} />
            </div>
          );
        }
        if (comp === "fillBlank") {
          return (
            <div key={idx} style={commonStyle}>
              <FillBlank config={item} value={val} onChange={(v) => updateField(idx, v)} />
            </div>
          );
        }
        if (comp === "shortAnswer") {
          return (
            <div key={idx} style={commonStyle}>
              <ShortAnswer config={item} value={val} onChange={(v) => updateField(idx, v)} />
            </div>
          );
        }
        if (comp === "radioGroup") {
          const opts = Array.from({ length: item.options || 4 }, (_, i) => val?.options?.[i] ?? `Option ${i + 1}`);
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <span className="mb-2 block text-sm font-medium text-gray-700">{item.label}</span>}
              <div className="flex flex-col gap-2">
                {opts.map((o, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`radio-${idx}`}
                      checked={(val?.value ?? "") === String(i)}
                      onChange={() => updateField(idx, { value: String(i) })}
                      readOnly={readOnly}
                    />
                    <input
                      type="text"
                      className={inputClass}
                      value={typeof o === "string" ? o : o?.text}
                      onChange={(e) => {
                        const next = [...opts];
                        next[i] = e.target.value;
                        updateField(idx, { options: next });
                      }}
                      readOnly={readOnly}
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        }
        if (comp === "checkboxGroup") {
          const opts = Array.from({ length: item.options || 4 }, (_, i) => val?.options?.[i] ?? `Option ${i + 1}`);
          const checked = val?.value ?? [];
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <span className="mb-2 block text-sm font-medium text-gray-700">{item.label}</span>}
              <div className="flex flex-col gap-2">
                {opts.map((o, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked.includes(String(i))}
                      onChange={(e) => {
                        const next = e.target.checked ? [...checked, String(i)] : checked.filter((x) => x !== String(i));
                        updateField(idx, { value: next });
                      }}
                      readOnly={readOnly}
                    />
                    <span>{typeof o === "string" ? o : o?.text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        }
        if (comp === "dropdown") {
          const opts = Array.from({ length: item.options || 4 }, (_, i) => val?.options?.[i] ?? `Option ${i + 1}`);
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <label className="mb-1 block text-sm font-medium text-gray-700">{item.label}</label>}
              <select
                className={inputClass}
                value={val?.value ?? ""}
                onChange={(e) => updateField(idx, { value: e.target.value })}
                disabled={readOnly}
              >
                <option value="">{item.placeholder || "Select..."}</option>
                {opts.map((opt, i) => (
                  <option key={i} value={String(i)}>{typeof opt === "string" ? opt : opt?.text}</option>
                ))}
              </select>
            </div>
          );
        }
        if (comp === "codeEditor") {
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <label className="mb-1 block text-sm font-medium text-gray-700">{item.label}</label>}
              <textarea
                className={`${inputClass} font-mono text-sm`}
                rows={10}
                placeholder="Code here"
                value={val?.value ?? ""}
                onChange={(e) => updateField(idx, { value: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          );
        }
        if (comp === "fileUpload") {
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <label className="mb-1 block text-sm font-medium text-gray-700">{item.label}</label>}
              <input
                type="file"
                className={inputClass}
                onChange={(e) => updateField(idx, { file: e.target.files?.[0], fileName: e.target.files?.[0]?.name })}
                disabled={readOnly}
              />
            </div>
          );
        }
        if (comp === "sectionDivider") {
          return <hr key={idx} className="border-gray-200" />;
        }
        if (comp === "cardContainer") {
          return (
            <div key={idx} className={cardClass} style={commonStyle}>
              {item.label && <span className="text-sm font-medium text-gray-700">{item.label}</span>}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
