import React from "react";
import { Trash2 } from "lucide-react";
import { TEMPLATE_COMPONENT_TYPES } from "./templateComponentTypes";

export default function TemplatePropertiesPanel({ component, onUpdate, onRemove }) {
  if (!component) {
    return (
      <div
        className="flex h-full w-full max-w-[16rem] shrink-0 flex-col overflow-hidden rounded-xl shadow-sm"
        style={{ border: "1px solid var(--color-pastel-border, #e2e8f0)", backgroundColor: "var(--color-pastel-lavender-soft, #f5f3ff)" }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-pastel-border, #e2e8f0)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-portal-text, #1e293b)" }}>Properties</h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-sm" style={{ color: "var(--color-pastel-text, #64748b)" }}>
          Select a component
        </div>
      </div>
    );
  }

  const props = component.properties || {};
  const setProp = (key, value) => onUpdate({ properties: { ...props, [key]: value } });
  const setOptionLabel = (idx, text) => {
    const labels = Array.isArray(props.optionLabels) ? [...props.optionLabels] : [];
    while (labels.length <= idx) labels.push(`Option ${labels.length + 1}`);
    labels[idx] = text;
    setProp("optionLabels", labels);
  };
  const hasOptions = ["multiple_choice", "checkbox_options", "dropdown", "image_question", "code_output_question"].includes(component.type);
  const hasPairs = component.type === "match_pairs";
  const hasImage = ["image", "image_question"].includes(component.type);
  const showLabel = !["blank_space"].includes(component.type);
  const showPlaceholder = ["input_field", "dropdown", "drag_drop_area", "numeric_answer", "cloze_passage", "fill_blank", "debugging_question"].includes(component.type);
  const showRequired = !["paragraph", "blank_space", "image"].includes(component.type);
  const numOpts = Math.max(1, parseInt(props.numberOfOptions, 10) || 4);

  return (
    <div
      className="flex h-full w-full max-w-[16rem] shrink-0 flex-col overflow-hidden rounded-xl shadow-sm"
      style={{ border: "1px solid var(--color-pastel-border, #e2e8f0)", backgroundColor: "var(--color-pastel-lavender-soft, #f5f3ff)" }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-pastel-border, #e2e8f0)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-portal-text, #1e293b)" }}>Properties</h3>
        <p className="mt-0.5 truncate text-xs" style={{ color: "var(--color-pastel-text, #64748b)" }}>
          {TEMPLATE_COMPONENT_TYPES[component.type] || component.type}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showLabel && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={props.label ?? ""}
              onChange={(e) => setProp("label", e.target.value)}
            />
          </div>
        )}
        {showPlaceholder && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Placeholder</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={props.placeholder ?? ""}
              onChange={(e) => setProp("placeholder", e.target.value)}
            />
          </div>
        )}
        {showRequired && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!props.required}
              onChange={(e) => setProp("required", e.target.checked)}
              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span className="text-sm text-slate-700">Required field</span>
          </label>
        )}
        {hasOptions && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Number of options</label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={props.numberOfOptions ?? 4}
                onChange={(e) =>
                  setProp("numberOfOptions", Math.max(1, parseInt(e.target.value, 10) || 1))
                }
              />
            </div>
            {component.type === "multiple_choice" && (
              <>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!props.allowMultipleCorrect}
                    onChange={(e) => setProp("allowMultipleCorrect", e.target.checked)}
                    className="rounded border-slate-300 text-violet-600"
                  />
                  <span className="text-xs text-slate-700">Multiple correct</span>
                </label>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Option labels</label>
                  <div className="space-y-1.5">
                    {Array.from({ length: numOpts }).map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                        placeholder={`Option ${i + 1}`}
                        value={(Array.isArray(props.optionLabels) ? props.optionLabels[i] : "") ?? ""}
                        onChange={(e) => setOptionLabel(i, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {hasPairs && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Number of rows</label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={props.pairs ?? 4}
                onChange={(e) =>
                  setProp("pairs", Math.max(1, parseInt(e.target.value, 10) || 1))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Left column label</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Column A"
                value={props.leftColumnLabel ?? ""}
                onChange={(e) => setProp("leftColumnLabel", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Right column label</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Column B"
                value={props.rightColumnLabel ?? ""}
                onChange={(e) => setProp("rightColumnLabel", e.target.value)}
              />
            </div>
          </>
        )}
        {hasImage && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Image URL</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="https://..."
              value={props.src ?? ""}
              onChange={(e) => setProp("src", e.target.value)}
            />
          </div>
        )}
        {component.type === "numeric_answer" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mode</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={props.mode ?? "exact"}
              onChange={(e) => setProp("mode", e.target.value)}
            >
              <option value="exact">Exact</option>
              <option value="range">Range</option>
              <option value="decimal">Decimal</option>
            </select>
          </div>
        )}
        {component.type === "arrange_order" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Number of items</label>
            <input
              type="number"
              min={2}
              max={20}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={props.numberOfItems ?? 4}
              onChange={(e) => setProp("numberOfItems", Math.max(2, parseInt(e.target.value, 10) || 2))}
            />
          </div>
        )}
        {(component.type === "cloze_passage" || component.type === "fill_blank") && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Number of blanks</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={props.numberOfBlanks ?? 2}
              onChange={(e) => setProp("numberOfBlanks", Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
        )}
        {component.type === "matrix_mcq" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Rows</label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={props.rows ?? 3}
                onChange={(e) => setProp("rows", Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Columns</label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={props.columns ?? 3}
                onChange={(e) => setProp("columns", Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          </>
        )}
        {component.type === "file_upload_question" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Allowed types</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder=".pdf,.doc,.docx"
                value={props.allowedTypes ?? ""}
                onChange={(e) => setProp("allowedTypes", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Max size (MB)</label>
              <input
                type="number"
                min={1}
                max={100}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={props.maxSizeMB ?? 10}
                onChange={(e) => setProp("maxSizeMB", Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          </>
        )}
        {component.type === "programming_question" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sample test cases</label>
              <input
                type="number"
                min={0}
                max={20}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={props.sampleTestCases ?? 2}
                onChange={(e) => setProp("sampleTestCases", Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Hidden test cases</label>
              <input
                type="number"
                min={0}
                max={20}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={props.hiddenTestCases ?? 2}
                onChange={(e) => setProp("hiddenTestCases", Math.max(0, parseInt(e.target.value, 10) || 0))}
              />
            </div>
          </>
        )}
        <div className="border-t border-slate-100 pt-4">
          <label className="mb-1 block text-xs font-medium text-slate-600">Validation rules</label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="e.g. minLength: 1, maxLength: 500"
            value={props.validationRules ?? ""}
            onChange={(e) => setProp("validationRules", e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          <Trash2 size={16} />
          Remove component
        </button>
      </div>
    </div>
  );
}
