import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function FillBlank({ config = {}, value = {}, onChange }) {
  const [question, setQuestion] = useState(value.question ?? "");
  const [answers, setAnswers] = useState(value.answers || [""]);

  useEffect(() => {
    setQuestion(value.question ?? "");
    setAnswers(value.answers || [""]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value || {})]);

  const syncValue = (q, a) => {
    setQuestion(q);
    setAnswers(a);
    onChange?.({ question: q, answers: a });
  };

  const addAnswer = () => syncValue(question, [...answers, ""]);
  const removeAnswer = (idx) => {
    const next = answers.filter((_, i) => i !== idx);
    if (next.length === 0) next.push("");
    syncValue(question, next);
  };
  const updateAnswer = (idx, text) => syncValue(question, answers.map((a, i) => (i === idx ? text : a)));

  return (
    <div className={`${cardClass} flex flex-col gap-4`}>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Question text (use _____ for blank)"
          value={question}
          onChange={(e) => syncValue(e.target.value, answers)}
        />
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">Accepted answers</span>
        <div className="flex flex-col gap-2">
          {answers.map((a, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder="Accepted answer"
                value={a}
                onChange={(e) => updateAnswer(idx, e.target.value)}
              />
              <button type="button" onClick={() => removeAnswer(idx)} disabled={answers.length <= 1} className="shrink-0 rounded-lg p-2 text-gray-500 hover:text-red-600 disabled:opacity-40">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAnswer}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-[#6366f1] hover:bg-[#e0e7ff]/30"
          >
            <Plus size={16} /> Add answer
          </button>
        </div>
      </div>
    </div>
  );
}
