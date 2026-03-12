import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import ResizableBlock from "./ResizableBlock";
import { COMPONENT_TYPES } from "./componentTypes";

function BlockPreview({ block }) {
  const { component, label, placeholder, width, height } = block;
  const name = COMPONENT_TYPES[component] || component;
  if (component === "sectionDivider") {
    return <div className="flex h-full items-center px-2"><hr className="w-full border-gray-300" /></div>;
  }
  if (component === "cardContainer") {
    return <div className="flex h-full items-center justify-center p-2 text-sm text-gray-500 rounded-lg bg-gray-50 border border-dashed border-gray-300">Card</div>;
  }
  return (
    <div className="flex h-full flex-col justify-center p-3 text-left">
      {label && <span className="mb-1 text-xs font-medium text-gray-500">{label}</span>}
      <span className="text-sm text-gray-600 truncate">{placeholder || name}</span>
    </div>
  );
}

export default function DraggableComponent({ block, selected, onSelect, onResize }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { type: "canvas-block", block },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-50 opacity-90" : ""}>
      <ResizableBlock
        width={block.width}
        height={block.height}
        selected={selected}
        onSelect={onSelect}
        onResize={(e, { size }) => onResize(block.id, size)}
      >
        <div className="absolute left-0 top-0 flex h-full w-full items-stretch gap-0">
          <div
            className="flex cursor-grab items-center justify-center border-r border-gray-200 bg-gray-50/80 px-1.5 active:cursor-grabbing rounded-l-xl"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <BlockPreview block={block} />
          </div>
        </div>
      </ResizableBlock>
    </div>
  );
}
