import React from "react";
import { X } from "lucide-react";
import DynamicTemplateRenderer from "../renderer/DynamicTemplateRenderer";

export default function TemplatePreviewModal({ layout, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-800">Preview Template</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {layout.length === 0 ? (
            <p className="text-slate-500">No components in template. Add components and preview again.</p>
          ) : (
            <DynamicTemplateRenderer layout={layout} readOnly={false} />
          )}
        </div>
      </div>
    </div>
  );
}
