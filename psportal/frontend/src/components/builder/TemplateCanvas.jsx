import React, { useCallback, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { createTemplateComponent, layoutToTemplateSchema } from "./templateComponentTypes";
import CanvasItem from "./CanvasItem";
import { getLockedTemplateCanvasSize } from "../renderer/LockedTemplateRenderer";

const GRID = 8;
export const CANVAS_DROP_ID = "template-canvas";

export default function TemplateCanvas({
  layout,
  setLayout,
  selectedId,
  setSelectedId,
  pushHistory,
  canvasSize = null,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROP_ID });

  const updateComponent = useCallback(
    (id, updates) => {
      setLayout((prev) => {
        const next = prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...updates,
                properties: { ...(c.properties || {}), ...(updates.properties || {}) },
              }
            : c
        );
        pushHistory?.(next);
        return next;
      });
    },
    [setLayout, pushHistory]
  );

  const updateComponentPosition = useCallback(
    (id, pos) => updateComponent(id, { x: pos.x, y: pos.y }),
    [updateComponent]
  );
  const updateComponentSize = useCallback(
    (id, size) =>
      updateComponent(id, {
        x: size.x,
        y: size.y,
        width: size.width,
        height: size.height,
      }),
    [updateComponent]
  );

  const computedCanvasSize = useMemo(() => {
    if (canvasSize && typeof canvasSize === "object") return canvasSize;
    return getLockedTemplateCanvasSize(layout);
  }, [canvasSize, layout]);

  return (
    <div
      ref={setNodeRef}
      className={`
        relative rounded-xl border-2 bg-slate-50/80 overflow-hidden
        ${isOver ? "border-violet-400 bg-violet-50/30" : "border-dashed border-slate-300"}
      `}
      style={{
        width: computedCanvasSize?.width,
        height: computedCanvasSize?.height,
        minWidth: computedCanvasSize?.width,
        minHeight: computedCanvasSize?.height,
        boxSizing: "border-box",
      }}
      onClick={() => setSelectedId(null)}
    >
      {layout.map((component) => (
        <CanvasItem
          key={component.id}
          component={component}
          selected={selectedId === component.id}
          onSelect={() => setSelectedId(component.id)}
          onPosition={(pos) => updateComponentPosition(component.id, pos)}
          onResize={(size) => updateComponentSize(component.id, size)}
        />
      ))}
      {layout.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
          Drop components here
        </div>
      )}
    </div>
  );
}

export { layoutToTemplateSchema };
