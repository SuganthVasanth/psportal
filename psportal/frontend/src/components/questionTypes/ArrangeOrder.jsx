import React, { useState } from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function ArrangeOrder({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const n = Math.max(2, parseInt(props.numberOfItems, 10) || 4);
  const [items, setItems] = useState(
    value?.items ?? Array.from({ length: n }, (_, i) => `Item ${i + 1}`)
  );

  const handleReorder = (fromIdx, toIdx) => {
    if (readOnly) return;
    const next = [...items];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    setItems(next);
    onChange?.({ ...value, items: next });
  };

  if (readOnly) {
    return (
      <div className={cardClass}>
        <span className="mb-2 block text-sm font-medium text-slate-700">Arrange in order</span>
        <div className="flex flex-col gap-2">
          {(value?.items ?? items).map((item, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              {i + 1}. {item}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <span className="mb-2 block text-sm font-medium text-slate-700">Drag to reorder</span>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <span className="text-slate-400 text-xs">⋮⋮</span>
            <input
              type="text"
              className={`${inputClass} flex-1`}
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                setItems(next);
                onChange?.({ ...value, items: next });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
