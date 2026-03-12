import React from "react";
import { Rnd } from "react-rnd";
import { TEMPLATE_COMPONENT_TYPES } from "./templateComponentTypes";

const GRID = 8;

function ComponentPreview({ component }) {
  const type = component.type;
  const props = component.properties || {};
  const label = props.label || TEMPLATE_COMPONENT_TYPES[type] || type;

  if (type === "blank_space") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-400 text-xs">
        Blank
      </div>
    );
  }
  if (type === "paragraph") {
    return (
      <div className="flex h-full w-full flex-col justify-center p-2 text-left">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-xs text-slate-400 truncate">{props.placeholder || "Instruction text"}</span>
      </div>
    );
  }
  if (type === "image") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 p-2">
        <span className="text-xs text-slate-500">{label || "Image"}</span>
        {props.src ? (
          <img src={props.src} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-400">No URL</span>
        )}
      </div>
    );
  }
  if (type === "match_pairs") {
    return (
      <div className="flex h-full w-full flex-col justify-center p-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-xs text-slate-400">{props.pairs ?? 4} pairs</span>
      </div>
    );
  }
  if (type === "drag_drop_area") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 text-xs text-slate-500">
        {props.placeholder || "Drag drop area"}
      </div>
    );
  }
  if (type === "multiple_choice" || type === "checkbox_options") {
    const n = props.numberOfOptions ?? 4;
    return (
      <div className="flex h-full w-full flex-col p-2">
        <span className="mb-1 text-xs font-medium text-slate-500">{label}</span>
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: Math.min(n, 4) }).map((_, i) => (
            <div key={i} className="h-5 rounded border border-slate-200 bg-white" />
          ))}
          {n > 4 && <span className="text-xs text-slate-400">+{n - 4} more</span>}
        </div>
      </div>
    );
  }
  if (type === "dropdown") {
    return (
      <div className="flex h-full w-full flex-col justify-center p-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="mt-1 h-8 rounded border border-slate-200 bg-white" />
      </div>
    );
  }
  // question_text, input_field
  return (
    <div className="flex h-full w-full flex-col justify-center p-2 text-left">
      {label && <span className="mb-0.5 text-xs font-medium text-slate-500">{label}</span>}
      <span className="text-xs text-slate-400 truncate">{props.placeholder || type}</span>
    </div>
  );
}

export default function CanvasItem({
  component,
  selected,
  onSelect,
  onPosition,
  onResize,
  onDelete,
}) {
  const handleDragStop = (e, d) => {
    onPosition({ x: Math.round(d.x / GRID) * GRID, y: Math.round(d.y / GRID) * GRID });
  };
  const handleResizeStop = (e, direction, ref, delta, pos) => {
    const w = ref.offsetWidth;
    const h = ref.offsetHeight;
    onResize({
      x: Math.round(pos.x / GRID) * GRID,
      y: Math.round(pos.y / GRID) * GRID,
      width: Math.round(w / GRID) * GRID,
      height: Math.round(h / GRID) * GRID,
    });
  };

  return (
    <Rnd
      size={{ width: component.width, height: component.height }}
      position={{ x: component.x, y: component.y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      dragGrid={[GRID, GRID]}
      resizeGrid={[GRID, GRID]}
      minWidth={80}
      minHeight={24}
      bounds="parent"
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onClick={(e) => e.stopPropagation()}
      className={selected ? "z-10" : ""}
      enableResizing={selected}
    >
      <div
        className={`
          h-full w-full rounded-xl border-2 bg-white shadow-sm transition
          ${selected ? "border-violet-500 ring-2 ring-violet-500/20" : "border-slate-200 hover:border-slate-300"}
        `}
      >
        <ComponentPreview component={component} />
      </div>
    </Rnd>
  );
}
