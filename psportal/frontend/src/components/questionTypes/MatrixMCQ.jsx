import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";

export default function MatrixMCQ({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const rows = Math.max(1, parseInt(props.rows, 10) || 3);
  const cols = Math.max(1, parseInt(props.columns, 10) || 3);
  const selected = value?.selected ?? {};
  const setSelected = (r, c) => {
    if (readOnly) return;
    const next = { ...selected, [r]: c };
    onChange?.({ ...value, selected: next });
  };

  return (
    <div className={cardClass}>
      <span className="mb-2 block text-sm font-medium text-slate-700">{props.label ?? "Matrix MCQ"}</span>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-200 p-2 bg-slate-50 text-left w-1/3">Statement</th>
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className="border border-slate-200 p-2 bg-slate-50 text-center">
                  Col {c + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                <td className="border border-slate-200 p-2">Row {r + 1}</td>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="border border-slate-200 p-1 text-center">
                    <input
                      type="radio"
                      name={`matrix-${config.id}-${r}`}
                      checked={selected[r] === c}
                      onChange={() => setSelected(r, c)}
                      disabled={readOnly}
                      className="rounded border-slate-300 text-violet-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
