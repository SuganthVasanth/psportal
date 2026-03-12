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
  const hasOptions = ["multiple_choice", "checkbox_options", "dropdown"].includes(component.type);
  const hasPairs = component.type === "match_pairs";
  const hasImage = component.type === "image";
  const showLabel = !["blank_space"].includes(component.type);
  const showPlaceholder = ["input_field", "dropdown", "drag_drop_area"].includes(component.type);
  const showRequired = !["paragraph", "blank_space", "image"].includes(component.type);

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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Number of options
            </label>
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
        )}
        {hasPairs && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Pairs</label>
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
