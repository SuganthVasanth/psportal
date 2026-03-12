import React, { useEffect, useState } from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function TrueFalse({ config = {}, value = {}, onChange }) {
  const [question, setQuestion] = useState(value.question ?? "");
  const [answer, setAnswer] = useState(value.answer ?? null);

  useEffect(() => {
    setQuestion(value.question ?? "");
    setAnswer(value.answer ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value || {})]);

  const syncValue = (q, a) => {
    setQuestion(q);
    setAnswer(a);
    onChange?.({ question: q, answer: a });
  };

  return (
    <div className={`${cardClass} flex flex-col gap-4`}>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Question here"
          value={question}
          onChange={(e) => syncValue(e.target.value, answer)}
        />
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">Correct answer</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 cursor-pointer hover:bg-[#e0e7ff]/30">
            <input
              type="radio"
              name="tf-answer"
              checked={answer === true}
              onChange={() => syncValue(question, true)}
            />
            <span>True</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 cursor-pointer hover:bg-[#e0e7ff]/30">
            <input
              type="radio"
              name="tf-answer"
              checked={answer === false}
              onChange={() => syncValue(question, false)}
            />
            <span>False</span>
          </label>
        </div>
      </div>
    </div>
  );
}
