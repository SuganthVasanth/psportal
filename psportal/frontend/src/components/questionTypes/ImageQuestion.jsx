import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";

export default function ImageQuestion({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const src = props.src ?? "";
  const n = Math.max(1, parseInt(props.numberOfOptions, 10) || 4);
  const options = value?.options ?? Array.from({ length: n }, (_, i) => `Option ${i + 1}`);
  const selected = value?.value ?? "";

  return (
    <div className={cardClass}>
      {props.label && <span className="mb-2 block text-sm font-medium text-slate-700">{props.label}</span>}
      {src ? (
        <img src={src} alt="" className="max-h-64 w-full object-contain rounded-lg border border-slate-200 mb-3" />
      ) : (
        <div className="h-32 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-sm mb-3">No image</div>
      )}
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <label key={i} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`img-q-${config.id}`}
              checked={selected === String(i)}
              onChange={() => onChange?.({ ...value, value: String(i) })}
              disabled={readOnly}
              className="rounded border-slate-300 text-violet-600"
            />
            <span className="text-sm">{typeof opt === "string" ? opt : opt?.text ?? `Option ${i + 1}`}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
