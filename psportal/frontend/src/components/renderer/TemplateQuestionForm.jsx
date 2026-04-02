import React, { useEffect, useMemo, useRef, useState } from "react";
import { templateApi } from "../../services/templateApi";
import LockedTemplateRenderer, { getLockedTemplateCanvasSize } from "./LockedTemplateRenderer";

/**
 * Faculty integration: fetch a question template by ID and render it.
 * Student exam: pass optional `layout` from GET /question-banks/approved-for-course (verbatim from DB) to skip a second fetch.
 *
 * @param {string} templateId - MongoDB _id of the template
 * @param {Array<{id,type,x,y,width,height,properties}>} [layout] - Raw layout from API; when non-empty, used as-is (no client transform)
 * @param {object} value - Current form values (keyed by component id)
 * @param {function} onChange - (values) => void
 * @param {boolean} readOnly - Disable editing
 */
export default function TemplateQuestionForm({
  templateId,
  layout: layoutFromExam = null,
  value = {},
  onChange,
  readOnly = false,
  fitToContainer = false,
  componentPrefix = "",
  studentMode = false,
  layoutMode = "canvas",
}) {
  const [template, setTemplate] = useState(null);
  const hasEmbeddedLayout = Array.isArray(layoutFromExam) && layoutFromExam.length > 0;
  const [loading, setLoading] = useState(() => Boolean(templateId && !hasEmbeddedLayout));
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const [fitZoom, setFitZoom] = useState(1);

  const effectiveLayout = useMemo(() => {
    if (hasEmbeddedLayout) return layoutFromExam;
    const items = template?.layout;
    return Array.isArray(items) ? items : [];
  }, [hasEmbeddedLayout, layoutFromExam, template?.layout]);

  const bounds = useMemo(() => {
    if (!effectiveLayout.length) return { width: 0, height: 0 };
    return getLockedTemplateCanvasSize(effectiveLayout);
  }, [effectiveLayout]);

  // Fit-to-container keeps the same ratios across screens by scaling the whole canvas.
  // disabled in 'stack' mode as it uses native flow.
  const shouldFit = !!(readOnly || studentMode || fitToContainer) && layoutMode !== "stack";

  useEffect(() => {
    if (hasEmbeddedLayout) {
      setTemplate(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (!templateId) {
      setTemplate(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    templateApi
      .getById(templateId)
      .then((data) => {
        setTemplate(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load template");
        setLoading(false);
      });
  }, [templateId, hasEmbeddedLayout]);

  useEffect(() => {
    if (!shouldFit) {
      setFitZoom(1);
      return;
    }
    if (!bounds.width) return;
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const padding = 12; // matches p-3 below
      const availableW = Math.max(0, rect.width - padding * 2);
      const availableH = Math.max(0, rect.height - padding * 2);
      if (!availableW || !availableH) return;
      const raw = Math.min(availableW / bounds.width, availableH / bounds.height);
      const z = Math.min(1, raw);
      setFitZoom(Number(z.toFixed(3)));
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [shouldFit, bounds.width]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading template…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }
  if (!effectiveLayout.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No template selected or template has no components.
      </div>
    );
  }

  const isStack = layoutMode === "stack";

  return (
    <div ref={containerRef} className={`h-full w-full overflow-auto ${isStack ? "p-8" : "p-3"}`}>
      <div
        className={isStack ? "w-full" : "mx-auto origin-top"}
        style={isStack ? {} : {
          width: bounds.width || "auto",
          minHeight: bounds.height || "auto",
          zoom: shouldFit ? fitZoom : 1,
        }}
      >
        <LockedTemplateRenderer
          layout={effectiveLayout}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          componentPrefix={componentPrefix}
          studentMode={studentMode}
          layoutMode={layoutMode}
        />
      </div>
    </div>
  );
}
