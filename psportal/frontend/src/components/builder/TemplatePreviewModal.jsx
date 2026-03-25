import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import LockedTemplateRenderer from "../renderer/LockedTemplateRenderer";

export default function TemplatePreviewModal({ layout, onClose }) {
  const [zoom, setZoom] = useState(1);

  const zoomBounds = useMemo(() => ({ min: 0.6, max: 1.8, step: 0.1 }), []);

  const decZoom = () => setZoom((z) => Math.max(zoomBounds.min, Number((z - zoomBounds.step).toFixed(2))));
  const incZoom = () => setZoom((z) => Math.min(zoomBounds.max, Number((z + zoomBounds.step).toFixed(2))));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-800">Preview Template</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decZoom}
                disabled={zoom <= zoomBounds.min + 1e-9}
                className="rounded-lg border px-2 py-1 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: "var(--color-pastel-border)", color: "var(--color-portal-text)", backgroundColor: "var(--color-portal-card)" }}
                aria-label="Zoom out"
                title="Zoom out"
              >
                -
              </button>
              <span className="text-sm text-slate-600" style={{ minWidth: 52, textAlign: "center" }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={incZoom}
                disabled={zoom >= zoomBounds.max - 1e-9}
                className="rounded-lg border px-2 py-1 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: "var(--color-pastel-border)", color: "var(--color-portal-text)", backgroundColor: "var(--color-portal-card)" }}
                aria-label="Zoom in"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>
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
            <div style={{ zoom }}>
              <LockedTemplateRenderer layout={layout} readOnly={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
