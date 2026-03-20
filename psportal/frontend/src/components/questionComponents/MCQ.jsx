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

export default function MCQ({ config = {}, value = {}, onChange }) {
  const { id: fieldId, label = "Options", required, options: numOptions = 4, prefix, optionLabels } = config;
  const radioName = `mcq-correct-${prefix || "q"}-${fieldId || "default"}`;
  const defaultOptions = Array.from({ length: Math.max(1, numOptions) }, (_, i) => ({
    text: (Array.isArray(optionLabels) && optionLabels[i]) || `Option ${i + 1}`,
    correct: i === 0,
  }));
  const [optionList, setOptionList] = useState(value.options || defaultOptions);

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
    setOptionList(next);
    onChange?.({ ...value, options: next });
  };

  const addOption = () => syncValue([...optionList, { text: `Option ${optionList.length + 1}`, correct: false }]);
  const removeOption = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    const next = optionList.filter((_, i) => i !== idx);
    if (next.length && !next.some((o) => o.correct)) next[0].correct = true;
    syncValue(next);
  };
  const setCorrect = (idx) => syncValue(optionList.map((o, i) => ({ ...o, correct: i === idx })));
  const updateText = (idx, text) => syncValue(optionList.map((o, i) => (i === idx ? { ...o, text } : o)));

  return (
    <div className={`${cardClass} flex flex-col gap-4`}>
      {label && <span className="text-sm font-medium text-[#1a202c]">{label}</span>}
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
                if (e.target.closest("button") || e.target.closest("input[type='text']")) return;
                setCorrect(idx);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (e.target.closest("button") || e.target.closest("input[type='text']")) return;
                  setCorrect(idx);
                }
              }}
              className="flex items-center gap-3 rounded-xl border-2 p-3 transition-all min-h-[52px] cursor-pointer"
              style={{
                backgroundColor: isCorrect ? "#e0e7ff" : pastel,
                borderColor: isCorrect ? "#8b5cf6" : "rgba(226, 232, 240, 0.9)",
              }}
            >
              <label
                className="mcq-option-radio flex items-center justify-center shrink-0 w-10 h-10 rounded-full border-2 cursor-pointer transition-colors select-none hover:border-[#8b5cf6] hover:bg-[#ddd6fe]/80"
                style={{
                  borderColor: isCorrect ? "#8b5cf6" : "#c7d2fe",
                  backgroundColor: isCorrect ? "#8b5cf6" : "rgba(255,255,255,0.7)",
                }}
                title="Mark as correct answer"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="radio"
                  name={radioName}
                  checked={isCorrect}
                  onChange={() => setCorrect(idx)}
                  className="sr-only"
                  aria-label={`Option ${idx + 1} correct`}
                />
                {isCorrect ? <Check size={20} className="text-white" strokeWidth={2.5} /> : null}
              </label>
              <input
                type="text"
                className={`${inputClass} flex-1`}
                placeholder={`Option ${idx + 1} text`}
                value={opt.text}
                onChange={(e) => updateText(idx, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={(e) => removeOption(e, idx)}
                disabled={optionList.length <= 1}
                className="shrink-0 rounded-lg p-2 text-[#64748b] hover:bg-red-100 hover:text-red-600 disabled:opacity-40 transition-colors"
                aria-label="Remove option"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addOption}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c7d2fe] bg-[#f4f7fe] py-3 text-sm font-medium text-[#6366f1] hover:border-[#8b5cf6] hover:bg-[#e0e7ff]/50 transition-colors"
        >
          <Plus size={18} />
          Add option
        </button>
      </div>
    </div>
  );
}
