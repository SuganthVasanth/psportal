import React from "react";
import MCQ from "../questionComponents/MCQ";
import MatchFollowing from "../questionComponents/MatchFollowing";
const cardClass = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

/**
 * Renders a question template layout (from Admin Template Builder).
 * Used by faculty when creating/editing questions and in preview.
 * layout: [{ id, type, x, y, width, height, properties }]
 * - type: question_text | paragraph | input_field | multiple_choice | checkbox_options |
 *         dropdown | image | match_pairs | blank_space | drag_drop_area
 */
export default function DynamicTemplateRenderer({
  layout = [],
  value = {},
  onChange,
  readOnly = false,
  componentPrefix = "",
}) {
  const updateField = (id, fieldValue) => {
    const next = { ...(value || {}), [id]: fieldValue };
    onChange?.(next);
  };

  const sortedLayout = [...layout].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

  return (
    <div className="flex flex-col gap-4">
      {sortedLayout.map((item) => {
        const type = item.type;
        const props = item.properties || {};
        const val = (value || {})[item.id];
        const commonStyle =
          item.width || item.height
            ? { width: item.width, minHeight: item.height }
            : {};

        if (type === "question_text") {
          return (
            <div key={item.id} className={cardClass} style={commonStyle}>
              {props.label && (
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {props.label}
                </label>
              )}
              <textarea
                className={inputClass}
                rows={4}
                placeholder={props.placeholder || "Question here"}
                value={val?.value ?? ""}
                onChange={(e) => updateField(item.id, { value: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          );
        }
        if (type === "paragraph") {
          const displayText = val?.value ?? props.placeholder ?? "Instruction text";
          return (
            <div key={item.id} className={cardClass} style={commonStyle}>
              {props.label && (
                <label className="text-sm font-medium text-slate-700">{props.label}</label>
              )}
              {readOnly ? (
                <p className="mt-1 text-sm text-slate-600">{displayText}</p>
              ) : (
                <textarea
                  className={`${inputClass} mt-1`}
                  rows={3}
                  placeholder={props.placeholder || "Instructions or paragraph text"}
                  value={displayText}
                  onChange={(e) => updateField(item.id, { value: e.target.value })}
                />
              )}
            </div>
          );
        }
        if (type === "input_field") {
          return (
            <div key={item.id} className={cardClass} style={commonStyle}>
              {props.label && (
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {props.label}
                </label>
              )}
              <input
                type="text"
                className={inputClass}
                placeholder={props.placeholder}
                value={val?.value ?? ""}
                onChange={(e) => updateField(item.id, { value: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          );
        }
        if (type === "multiple_choice") {
          const config = {
            ...item,
            label: props.label,
            options: props.numberOfOptions ?? 4,
            required: props.required,
            prefix: componentPrefix,
          };
          return (
            <div key={item.id} style={commonStyle}>
              <MCQ config={config} value={val} onChange={(v) => updateField(item.id, v)} />
            </div>
          );
        }
        if (type === "checkbox_options") {
          const n = props.numberOfOptions ?? 4;
          const opts = Array.from({ length: n }, (_, i) => val?.options?.[i] ?? `Option ${i + 1}`);
          const checked = val?.value ?? [];
          return (
            <div key={item.id} className={cardClass} style={commonStyle}>
              {props.label && (
                <span className="mb-2 block text-sm font-medium text-slate-700">{props.label}</span>
              )}
              <div className="flex flex-col gap-2">
                {opts.map((o, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked.includes(String(i))}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...checked, String(i)]
                          : checked.filter((x) => x !== String(i));
                        updateField(item.id, { value: next });
                      }}
                      readOnly={readOnly}
                    />
                    <span className="text-sm">{typeof o === "string" ? o : o?.text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        }
        if (type === "dropdown") {
          const n = props.numberOfOptions ?? 4;
          const opts = Array.from({ length: n }, (_, i) => val?.options?.[i] ?? `Option ${i + 1}`);
          return (
            <div key={item.id} className={cardClass} style={commonStyle}>
              {props.label && (
                <label className="mb-1 block text-sm font-medium text-slate-700">{props.label}</label>
              )}
              <select
                className={inputClass}
                value={val?.value ?? ""}
                onChange={(e) => updateField(item.id, { value: e.target.value })}
                disabled={readOnly}
              >
                <option value="">{props.placeholder || "Select..."}</option>
                {opts.map((opt, i) => (
                  <option key={i} value={String(i)}>
                    {typeof opt === "string" ? opt : opt?.text}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (type === "image") {
          return (
            <div key={item.id} className={cardClass} style={commonStyle}>
              {props.label && (
                <span className="mb-1 block text-sm font-medium text-slate-700">{props.label}</span>
              )}
              {props.src ? (
                <img src={props.src} alt="" className="max-h-64 w-full object-contain rounded-lg" />
              ) : (
                <div className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-sm">
                  No image URL
                </div>
              )}
            </div>
          );
        }
        if (type === "match_pairs") {
          const config = { ...item, pairs: props.pairs ?? 4, label: props.label, required: props.required };
          return (
            <div key={item.id} style={commonStyle}>
              <MatchFollowing config={config} value={val} onChange={(v) => updateField(item.id, v)} />
            </div>
          );
        }
        if (type === "blank_space") {
          return (
            <div key={item.id} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-2" style={commonStyle}>
              <span className="text-xs text-slate-400">Blank</span>
            </div>
          );
        }
        if (type === "drag_drop_area") {
          return (
            <div key={item.id} className={cardClass} style={commonStyle}>
              {props.label && (
                <span className="mb-1 block text-sm font-medium text-slate-700">{props.label}</span>
              )}
              <div className="flex min-h-[80px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 text-sm">
                {props.placeholder || "Drag drop area"}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
