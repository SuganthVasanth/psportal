import React, { useEffect, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";

/* Pastel option backgrounds (website palette: purple/indigo) */
const OPTION_BG = [
  "#ede9fe", /* lavender */
  "#e0e7ff", /* indigo light */
  "#f5f3ff", /* violet light */
  "#faf5ff", /* purple light */
  "#eef2ff", /* slate-indigo */
];

const cardClass = "rounded-xl border border-[#e2e8f0] bg-[#f4f7fe] p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-[#e2e8f0] bg-white/80 px-3 py-2.5 text-sm min-w-0";

export default function MCQ({ config = {}, value = {}, onChange, readOnly = false, studentMode = false }) {
  const { id: fieldId, label = "Options", required, options: numOptions = 4, prefix, optionLabels } = config;
  const isStudent = studentMode;
  const isDisabled = readOnly || isStudent;
  const radioName = `mcq-correct-${prefix || "q"}-${fieldId || "default"}`;
  const defaultOptions = Array.from({ length: Math.max(1, numOptions) }, (_, i) => ({
    text: (Array.isArray(optionLabels) && optionLabels[i]) || `Option ${i + 1}`,
    correct: i === 0,
  }));
  const [optionList, setOptionList] = useState(value?.options || defaultOptions);

  useEffect(() => {
    const labels = Array.isArray(optionLabels) ? optionLabels : [];
    const next =
      value?.options ||
      Array.from({ length: Math.max(1, numOptions) }, (_, i) => ({
        text: labels[i] || `Option ${i + 1}`,
        correct: i === 0,
      }));
    setOptionList(next);
    // Only when switching questions / values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId, prefix, numOptions, JSON.stringify(value?.options || null), JSON.stringify(optionLabels || null)]);

  const syncValue = (next) => {
    if (isDisabled && !isStudent) return; // Don't allow changes if readOnly and not student answering
    setOptionList(next);
    onChange?.({ ...(value || {}), options: next });
  };

  const addOption = () => syncValue([...optionList, { text: `Option ${optionList.length + 1}`, correct: false }]);
  const removeOption = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    const next = optionList.filter((_, i) => i !== idx);
    if (next.length && !next.some((o) => o.correct)) next[0].correct = true;
    syncValue(next);
  };
  const setCorrect = (idx) => {
    const isAlreadyCorrect = optionList[idx]?.correct === true;
    const next = optionList.map((o, i) => ({ ...o, correct: isAlreadyCorrect ? false : i === idx }));
    syncValue(next);
  };
  const updateText = (idx, text) => syncValue(optionList.map((o, i) => (i === idx ? { ...o, text } : o)));

  return (
    <div className={`${isStudent ? "flex flex-col gap-2.5" : `${cardClass} flex flex-col gap-4`}`}>
      {!isStudent && label && <span className="text-sm font-medium text-[#1a202c]">{label}</span>}
      <div className="flex flex-col gap-3">
        {optionList.map((opt, idx) => {
          const isCorrect = !!opt.correct;
          const pastel = OPTION_BG[idx % OPTION_BG.length];
          return (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (isDisabled && !isStudent) return;
                if (e.target.closest("button") || e.target.closest("input[type='text']")) return;
                setCorrect(idx);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (isDisabled && !isStudent) return;
                  if (e.target.closest("button") || e.target.closest("input[type='text']")) return;
                  setCorrect(idx);
                }
              }}
              className={`flex items-center gap-3 transition-all min-h-[48px] cursor-pointer group ${
                isStudent ? "rounded-[9px] border bg-white px-3.5 py-2.5" : "rounded-xl border-2 p-3"
              }`}
              style={
                isStudent
                  ? {
                      borderColor: "#e5e7eb",
                      background: "#fff",
                    }
                  : {
                      backgroundColor: isCorrect ? "#e0e7ff" : pastel,
                      borderColor: isCorrect ? "#2563eb" : "rgba(226, 232, 240, 0.9)",
                    }
              }
            >
              <div
                className={`flex items-center justify-center shrink-0 w-[18px] h-[18px] rounded-full border transition-all ${
                  isCorrect ? "border-slate-400" : "border-slate-300 bg-white"
                }`}
              >
                <div className={`w-2 h-2 rounded-full transition-all ${isCorrect ? "bg-slate-700" : "bg-transparent"}`} />
              </div>

              {isStudent && (
                 <div className="h-5 min-w-5 rounded-sm border border-slate-200 bg-slate-100 px-1.5 flex items-center justify-center text-[10px] font-medium text-slate-500 shrink-0">
                    {["A", "B", "C", "D", "E", "F"][idx] || (idx + 1)}
                 </div>
              )}
              
              {isStudent || readOnly ? (
                <span className={`flex-1 leading-relaxed transition-colors ${
                    isCorrect ? "text-slate-900" : "text-slate-800"
                } ${isStudent ? "text-[15px] font-medium" : "text-sm font-bold"}`}>
                    {opt.text}
                </span>
              ) : (
                <input
                  type="text"
                  className={`${inputClass} flex-1`}
                  placeholder={`Option ${idx + 1} text`}
                  value={opt.text ?? ""}
                  onChange={(e) => updateText(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              {!(isStudent || readOnly) && (
                <button
                  type="button"
                  onClick={(e) => removeOption(e, idx)}
                  disabled={optionList.length <= 1}
                  className="shrink-0 rounded-lg p-2 text-[#64748b] hover:bg-red-100 hover:text-red-600 disabled:opacity-40 transition-colors"
                  aria-label="Remove option"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        })}
        
        {!(isStudent || readOnly) && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#bfdbfe] bg-[#eff6ff] py-3 text-sm font-medium text-[#2563eb] hover:border-[#2563eb] hover:bg-[#dbeafe]/50 transition-colors"
          >
            <Plus size={18} />
            Add option
          </button>
        )}
      </div>
    </div>
  );
}
