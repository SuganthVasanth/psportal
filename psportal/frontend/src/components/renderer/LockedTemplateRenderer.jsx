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

const CONTENT_ONLY_TYPES = new Set(["question_text", "paragraph", "image"]);

/** Right/bottom padding inside the locked canvas (matches admin “canvas breathing room”). */
export const LOCKED_TEMPLATE_PAD = 40;
const DEFAULT_MIN_EXTENT_W = 600;
const DEFAULT_MIN_EXTENT_H = 400;

export function clampNum(n, fallback) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

/**
 * Canvas size for overflow + fit-zoom: max(right,bottom) from raw x,y,w,h plus padding.
 * Not exported layout order — only geometry.
 */
export function getLockedTemplateCanvasSize(layout) {
  const items = Array.isArray(layout) ? layout : [];
  if (!items.length) {
    return {
      width: DEFAULT_MIN_EXTENT_W + LOCKED_TEMPLATE_PAD,
      height: DEFAULT_MIN_EXTENT_H + LOCKED_TEMPLATE_PAD,
    };
  }
  let maxR = 0;
  let maxB = 0;
  for (const it of items) {
    const x = clampNum(it?.x, 0);
    const y = clampNum(it?.y, 0);
    const w = clampNum(it?.width, 0);
    const h = clampNum(it?.height, 0);
    maxR = Math.max(maxR, x + w);
    maxB = Math.max(maxB, y + h);
  }
  return {
    width: Math.max(DEFAULT_MIN_EXTENT_W, maxR) + LOCKED_TEMPLATE_PAD,
    height: Math.max(DEFAULT_MIN_EXTENT_H, maxB) + LOCKED_TEMPLATE_PAD,
  };
}

function UnknownTypePlaceholder({ type }) {
  return (
    <div
      className="flex h-full min-h-0 flex-col items-start justify-center rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-left"
      style={{ overflow: "auto", boxSizing: "border-box" }}
    >
      <span className="font-mono text-xs font-medium text-amber-900">{type || "unknown"}</span>
      <span className="mt-1 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
        Coming soon
      </span>
    </div>
  );
}

/**
 * Renders admin template layout exactly: raw x, y, width, height (px), array order → z-index.
 * No reordering, no bounding-box normalization.
 *
 * @param {object} [value] - answers keyed by component id (faculty/student forms)
 * @param {object} [answers] - alias for partial merge with `value` (read path)
 * @param {function} [onChange] - (full values object) => void
 * @param {function} [onAnswer] - optional (id, fieldValue) => void
 */
export default function LockedTemplateRenderer({
  layout = [],
  value = {},
  answers = {},
  onChange,
  onAnswer,
  readOnly = false,
  componentPrefix = "",
  studentMode = false,
  className = "",
  style = {},
  layoutMode = "canvas", // 'canvas' (absolute) or 'stack' (vertical list)
}) {
  const mergedValue = { ...(value || {}), ...(answers || {}) };

  const updateField = (id, fieldValue) => {
    const next = { ...mergedValue, [id]: fieldValue };
    onChange?.(next);
    onAnswer?.(id, fieldValue);
  };

  const isReadOnly = (type) => (studentMode && CONTENT_ONLY_TYPES.has(type)) || readOnly;

  const items = Array.isArray(layout) ? layout : [];
  const { width: canvasW, height: canvasH } = getLockedTemplateCanvasSize(items);
  const stretchSingleEditableItem = !readOnly && !studentMode && items.length === 1;

  if (items.length === 0) return null;

  const containerStyle = layoutMode === "stack" 
    ? { display: "flex", flexDirection: "column", gap: "24px", width: "100%", ...style }
    : { position: "relative", width: canvasW, minHeight: canvasH, boxSizing: "border-box", ...style };

  return (
    <div className={`${layoutMode === "stack" ? "sa-stack-renderer" : "relative"} ${className}`} style={containerStyle}>
      {items.map((item, index) => {
        const type = item.type;
        const props = item.properties || {};
        const val = mergedValue[item.id];
        const itemReadOnly = isReadOnly(type);

        const left = clampNum(item.x, 0);
        const top = clampNum(item.y, 0);
        const w = clampNum(item.width, 200);
        let h = clampNum(item.height, 80);

        const isStack = layoutMode === "stack";
        const boxStyle = isStack 
          ? { width: "100%", zIndex: index + 1, boxSizing: "border-box" }
          : { position: "absolute", left, top, width: w, height: h, zIndex: index + 1, boxSizing: "border-box" };

        if (stretchSingleEditableItem && !isStack) {
          const availableH = Math.max(120, canvasH - top - LOCKED_TEMPLATE_PAD / 2);
          h = Math.max(h, availableH);
          boxStyle.height = h;
        }

        const innerWrap = (child) => (
          <div className="h-full min-h-0 w-full overflow-auto" style={{ boxSizing: "border-box" }}>
            {child}
          </div>
        );

        if (type === "question_text") {
          const raw = typeof val === "string" ? val : val?.value;
          const text =
            raw != null && typeof raw !== "object"
              ? String(raw)
              : (props.placeholder || "Question here");
          const textControlled =
            raw != null && typeof raw !== "object" ? String(raw) : "";
          return (
            <div key={item.id} className={cardClass} style={boxStyle}>
              {innerWrap(
                <>
                  {props.label && (
                    <label className="mb-1 block text-sm font-medium text-slate-700">{props.label}</label>
                  )}
                  {itemReadOnly ? (
                    <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800 font-medium">{text}</div>
                  ) : (
                  <textarea
                    className={inputClass}
                    rows={4}
                    placeholder={props.placeholder || "Question here"}
                    value={textControlled}
                    onChange={(e) => updateField(item.id, { value: e.target.value })}
                  />
                  )}
                </>
              )}
            </div>
          );
        }

        if (type === "paragraph") {
          const rawP = typeof val === "string" ? val : val?.value;
          const displayText =
            rawP != null && typeof rawP !== "object"
              ? String(rawP)
              : (props.placeholder || "Instruction text");
          const displayControlled =
            rawP != null && typeof rawP !== "object" ? String(rawP) : "";
          return (
            <div key={item.id} className={cardClass} style={boxStyle}>
              {innerWrap(
                <>
                  {props.label && <label className="text-sm font-medium text-slate-700">{props.label}</label>}
                  {itemReadOnly ? (
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{displayText}</p>
                  ) : (
                    <textarea
                      className={`${inputClass} mt-1`}
                      rows={3}
                      placeholder={props.placeholder || "Instructions or paragraph text"}
                      value={displayControlled}
                      onChange={(e) => updateField(item.id, { value: e.target.value })}
                    />
                  )}
                </>
              )}
            </div>
          );
        }

        if (type === "input_field") {
          return (
            <div key={item.id} className={cardClass} style={boxStyle}>
              {innerWrap(
                <>
                  {props.label && (
                    <label className="mb-1 block text-sm font-medium text-slate-700">{props.label}</label>
                  )}
                  <input
                    type="text"
                    className={inputClass}
                    placeholder={props.placeholder}
                    value={val?.value ?? ""}
                    onChange={(e) => updateField(item.id, { value: e.target.value })}
                    readOnly={itemReadOnly}
                  />
                </>
              )}
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
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <MCQ
                  config={config}
                  value={val ?? {}}
                  onChange={(v) => updateField(item.id, v)}
                  readOnly={itemReadOnly}
                  studentMode={studentMode}
                  lockOptionCount={!studentMode}
                />
              )}
            </div>
          );
        }

        if (type === "checkbox_options") {
          const n = props.numberOfOptions ?? 4;
          const opts = Array.from({ length: n }, (_, i) => val?.options?.[i] ?? `Option ${i + 1}`);
          const checked = Array.isArray(val?.value) ? val.value : [];
          return (
            <div key={item.id} className={cardClass} style={boxStyle}>
              {innerWrap(
                <>
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
                </>
              )}
            </div>
          );
        }

        if (type === "dropdown") {
          const n = props.numberOfOptions ?? 4;
          const opts = Array.from({ length: n }, (_, i) => val?.options?.[i] ?? `Option ${i + 1}`);
          return (
            <div key={item.id} className={cardClass} style={boxStyle}>
              {innerWrap(
                <>
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
                </>
              )}
            </div>
          );
        }

        if (type === "image") {
          return (
            <div key={item.id} className={cardClass} style={boxStyle}>
              {innerWrap(
                <>
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
                </>
              )}
            </div>
          );
        }

        if (type === "numeric_answer") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <NumericAnswer config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "arrange_order") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <ArrangeOrder config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "cloze_passage") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <ClozePassage config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "matrix_mcq") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <MatrixMCQ config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "image_question") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <ImageQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "file_upload_question") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <FileUploadQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "code_output_question") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <CodeOutputQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "debugging_question") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <DebuggingQuestion config={item} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }
        if (type === "programming_question") {
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <ProgrammingQuestion
                  config={item}
                  value={val}
                  onChange={(v) => updateField(item.id, v)}
                  readOnly={itemReadOnly}
                  studentMode={studentMode}
                />
              )}
            </div>
          );
        }

        if (type === "fill_blank") {
          const fillConfig = { ...item, numberOfBlanks: props.numberOfBlanks ?? 2, label: props.label };
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <FillBlank config={fillConfig} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
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
              <div key={item.id} style={boxStyle}>
                {innerWrap(
                  <MatchFollowingStudent config={config} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
                )}
              </div>
            );
          }
          return (
            <div key={item.id} style={boxStyle}>
              {innerWrap(
                <MatchFollowing config={config} value={val} onChange={(v) => updateField(item.id, v)} readOnly={itemReadOnly} />
              )}
            </div>
          );
        }

        if (type === "blank_space") {
          return (
            <div
              key={item.id}
              className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-2"
              style={boxStyle}
            >
              <span className="text-xs text-slate-400">Blank</span>
            </div>
          );
        }

        if (type === "drag_drop_area") {
          return (
            <div key={item.id} className={cardClass} style={boxStyle}>
              {innerWrap(
                <>
                  {props.label && (
                    <span className="mb-1 block text-sm font-medium text-slate-700">{props.label}</span>
                  )}
                  <div className="flex min-h-[80px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 text-sm">
                    {props.placeholder || "Drag drop area"}
                  </div>
                </>
              )}
            </div>
          );
        }

        return (
          <div key={item.id} style={boxStyle}>
            <UnknownTypePlaceholder type={type} />
          </div>
        );
      })}
    </div>
  );
}
