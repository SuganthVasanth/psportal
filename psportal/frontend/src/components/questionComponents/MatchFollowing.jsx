import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function MatchFollowing({ config = {}, value = {}, onChange }) {
  const { label = "Matching pairs", pairs: numPairs = 4 } = config;
  const [pairList, setPairList] = useState(
    value.pairs || Array.from({ length: Math.max(1, numPairs) }, (_, i) => ({ left: `Item ${i + 1}`, right: `Match ${i + 1}` }))
  );

  useEffect(() => {
    const next =
      value?.pairs || Array.from({ length: Math.max(1, numPairs) }, (_, i) => ({ left: `Item ${i + 1}`, right: `Match ${i + 1}` }));
    setPairList(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPairs, JSON.stringify(value?.pairs || null)]);

  const syncValue = (next) => {
    setPairList(next);
    onChange?.({ ...value, pairs: next });
  };

  const addPair = () => syncValue([...pairList, { left: "", right: "" }]);
  const removePair = (idx) => syncValue(pairList.filter((_, i) => i !== idx));
  const updatePair = (idx, field, val) =>
    syncValue(pairList.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));

  return (
    <div className={`${cardClass} flex flex-col gap-4`}>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex flex-col gap-3">
        {pairList.map((p, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50/50 p-2">
            <input
              type="text"
              className={inputClass}
              placeholder="Left item"
              value={p.left}
              onChange={(e) => updatePair(idx, "left", e.target.value)}
            />
            <div className="flex items-center gap-1">
              <input
                type="text"
                className={inputClass}
                placeholder="Right item"
                value={p.right}
                onChange={(e) => updatePair(idx, "right", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removePair(idx)}
                disabled={pairList.length <= 1}
                className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addPair}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-2 text-sm font-medium text-gray-600 hover:border-[#6366f1] hover:bg-[#e0e7ff]/30"
        >
          <Plus size={16} />
          Add pair
        </button>
      </div>
    </div>
  );
}
