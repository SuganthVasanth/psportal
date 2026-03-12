import React, { useEffect, useState } from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function ShortAnswer({ config = {}, value = {}, onChange }) {
  const [question, setQuestion] = useState(value.question ?? "");
  const [correctAnswer, setCorrectAnswer] = useState(value.correctAnswer ?? "");
  const [wordLimit, setWordLimit] = useState(value.wordLimit ?? "");

  useEffect(() => {
    setQuestion(value.question ?? "");
    setCorrectAnswer(value.correctAnswer ?? "");
    setWordLimit(value.wordLimit ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value || {})]);

  const sync = (updates) => {
    const next = { question, correctAnswer, wordLimit: wordLimit ? parseInt(wordLimit, 10) : undefined, ...updates };
    onChange?.(next);
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
          onChange={(e) => { const v = e.target.value; setQuestion(v); sync({ question: v }); }}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Correct answer</label>
        <input
          type="text"
          className={inputClass}
          placeholder="Correct answer"
          value={correctAnswer}
          onChange={(e) => { const v = e.target.value; setCorrectAnswer(v); sync({ correctAnswer: v }); }}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Word limit (optional)</label>
        <input
          type="number"
          min={1}
          className={inputClass}
          placeholder="e.g. 50"
          value={wordLimit}
          onChange={(e) => { const v = e.target.value; setWordLimit(v); sync({ wordLimit: v ? parseInt(v, 10) : undefined }); }}
        />
      </div>
    </div>
  );
}
