import React from "react";
import { Trash2 } from "lucide-react";
import { COMPONENT_TYPES } from "./componentTypes";

export default function PropertiesPanel({ block, onUpdate, onRemove }) {
  if (!block) {
    return (
      <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">Properties</h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-gray-500">
          Select a component
        </div>
      </div>
    );
  }

  const hasOptions = ["radioGroup", "checkboxGroup", "dropdown", "optionList"].includes(block.component);
  const hasTestCases = block.component === "testCaseBuilder";
  const hasPairs = block.component === "matchingPairs";

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">Properties</h3>
        <p className="mt-0.5 truncate text-xs text-gray-500">{COMPONENT_TYPES[block.component] || block.component}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {block.component !== "sectionDivider" && block.component !== "cardContainer" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Label</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={block.label || ""}
                onChange={(e) => onUpdate({ label: e.target.value })}
              />
            </div>
            {(block.component === "textInput" || block.component === "textarea" || block.component === "numberInput" || block.component === "dropdown") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Placeholder</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={block.placeholder || ""}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                />
              </div>
            )}
            {(block.component === "textInput" || block.component === "textarea" || block.component === "numberInput") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Default value</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={block.defaultValue ?? ""}
                  onChange={(e) => onUpdate({ defaultValue: e.target.value })}
                />
              </div>
            )}
            {block.component !== "textLabel" && block.component !== "sectionDivider" && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!block.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>
            )}
          </>
        )}
        {hasOptions && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Number of options</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={block.options ?? 4}
              onChange={(e) => onUpdate({ options: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
          </div>
        )}
        {hasTestCases && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Max test cases (up to 6)</label>
            <input
              type="number"
              min={1}
              max={6}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={block.testCases ?? 3}
              onChange={(e) => {
                const raw = parseInt(e.target.value, 10) || 1;
                const clamped = Math.min(6, Math.max(1, raw));
                onUpdate({ testCases: clamped });
              }}
            />
          </div>
        )}
        {hasPairs && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Number of matching pairs</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={block.pairs ?? 4}
              onChange={(e) => onUpdate({ pairs: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Width</label>
            <input
              type="number"
              min={80}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={block.width ?? 300}
              onChange={(e) => onUpdate({ width: Math.max(80, parseInt(e.target.value, 10) || 80) })}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Height</label>
            <input
              type="number"
              min={24}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={block.height ?? 80}
              onChange={(e) => onUpdate({ height: Math.max(24, parseInt(e.target.value, 10) || 24) })}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          <Trash2 size={16} />
          Remove block
        </button>
      </div>
    </div>
  );
}
