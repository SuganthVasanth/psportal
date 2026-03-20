import React from "react";
import MCQ from "../questionComponents/MCQ";
import MatchFollowing from "../questionComponents/MatchFollowing";
import MatchFollowingStudent from "../questionComponents/MatchFollowingStudent";
import FillBlank from "../questionComponents/FillBlank";
import NumericAnswer from "../questionTypes/NumericAnswer";
import ArrangeOrder from "../questionTypes/ArrangeOrder";
import ClozePassage from "../questionTypes/ClozePassage";
import MatrixMCQ from "../questionTypes/MatrixMCQ";
import ImageQuestion from "../questionTypes/ImageQuestion";
import FileUploadQuestion from "../questionTypes/FileUploadQuestion";
import CodeOutputQuestion from "../questionTypes/CodeOutputQuestion";
import DebuggingQuestion from "../questionTypes/DebuggingQuestion";
import ProgrammingQuestion from "../questionTypes/ProgrammingQuestion";
const cardClass = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

/**
 * Renders a question template layout (from Admin Template Builder).
 * Used by faculty when creating/editing questions and in preview.
 * layout: [{ id, type, x, y, width, height, properties }]
 * - type: question_text | paragraph | input_field | multiple_choice | checkbox_options |
 *         dropdown | image | match_pairs | blank_space | drag_drop_area
 */
/** When true, question_text and paragraph are read-only (student exam: show question, edit answers only). */
const CONTENT_ONLY_TYPES = new Set(["question_text", "paragraph", "image"]);

export default function DynamicTemplateRenderer({
  layout = [],
  value = {},
  onChange,
  readOnly = false,
  componentPrefix = "",
  studentMode = false,
}) {
  const updateField = (id, fieldValue) => {
    const next = { ...(value || {}), [id]: fieldValue };
    onChange?.(next);
  };

  const sortedLayout = [...layout].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

  const isReadOnly = (type) => (studentMode && CONTENT_ONLY_TYPES.has(type)) || readOnly;

  return (
    <div className="flex flex-col gap-4">
      {sortedLayout.map((item) => {
        const type = item.type;
        const props = item.properties || {};
        const val = (value || {})[item.id];
        const itemReadOnly = isReadOnly(type);
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
                readOnly={itemReadOnly}
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
              {itemReadOnly ? (
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
                readOnly={itemReadOnly}
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
            optionLabels: Array.isArray(props.optionLabels) ? props.optionLabels : undefined,
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
                      readOnly={itemReadOnly}
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
                disabled={itemReadOnly}
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
        if (type === "numeric_answer") {
          return (
            <div key={item.id} style={commonStyle}>
              <NumericAnswer config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "arrange_order") {
          return (
            <div key={item.id} style={commonStyle}>
              <ArrangeOrder config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "cloze_passage") {
          return (
            <div key={item.id} style={commonStyle}>
              <ClozePassage config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "matrix_mcq") {
          return (
            <div key={item.id} style={commonStyle}>
              <MatrixMCQ config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "image_question") {
          return (
            <div key={item.id} style={commonStyle}>
              <ImageQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "file_upload_question") {
          return (
            <div key={item.id} style={commonStyle}>
              <FileUploadQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "code_output_question") {
          return (
            <div key={item.id} style={commonStyle}>
              <CodeOutputQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "debugging_question") {
          return (
            <div key={item.id} style={commonStyle}>
              <DebuggingQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
            </div>
          );
        }
        if (type === "programming_question") {
          return (
            <div key={item.id} style={commonStyle}>
              <ProgrammingQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} studentMode={studentMode} />
            </div>
          );
        }
        if (type === "fill_blank") {
          const fillConfig = { ...item, numberOfBlanks: props.numberOfBlanks ?? 2, label: props.label };
          return (
            <div key={item.id} style={commonStyle}>
              <FillBlank config={fillConfig} value={val} onChange={(v) => updateField(item.id, v)} />
            </div>
          );
        }
        if (type === "match_pairs") {
          const config = {
            ...item,
            pairs: props.pairs ?? 4,
            label: props.label,
            required: props.required,
            leftColumnLabel: props.leftColumnLabel,
            rightColumnLabel: props.rightColumnLabel,
          };
          if (studentMode) {
            return (
              <div key={item.id} style={commonStyle}>
                <MatchFollowingStudent config={config} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              </div>
            );
          }
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
