import React, { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { createBlock } from "./componentTypes";
import DraggableComponent from "./DraggableComponent";
import ComponentPanel from "./ComponentPanel";
import PropertiesPanel from "./PropertiesPanel";
import { COMPONENT_TYPES } from "./componentTypes";

const GRID_SIZE = 8;

function layoutToJson(layout) {
  return layout.map((b) => {
    const item = {
      component: b.component,
      label: b.label,
      placeholder: b.placeholder,
      required: b.required,
      width: b.width,
      height: b.height,
    };
    if (b.options != null) item.options = b.options;
    if (b.testCases != null) item.testCases = b.testCases;
    if (b.pairs != null) item.pairs = b.pairs;
    if (b.defaultValue != null && b.defaultValue !== "") item.defaultValue = b.defaultValue;
    return item;
  });
}

export default function BuilderCanvas({ questionTypeName, initialLayout, onSave, authHeaders }) {
  const [blocks, setBlocks] = useState(() => {
    const l = initialLayout?.layout;
    return Array.isArray(l?.layout) ? l.layout.map((item, i) => ({ ...item, id: item.id || `block-${i}-${Date.now()}` })) : (l && !Array.isArray(l) ? [] : []);
  });
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [questionType, setQuestionType] = useState(questionTypeName || "");
  const API_BASE = "http://localhost:5000";

  const selectedBlock = blocks.find((b) => b.id === selectedId);
  const { setNodeRef: setCanvasRef } = useDroppable({ id: "builder-canvas" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback((event) => {
    // optional: visual feedback
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);

      const activeData = active?.data?.current;

      if (activeData?.type === "palette") {
        const componentType = activeData.componentType;
        const newBlock = createBlock(componentType);
        if (over) {
          const overId = over.id;
          const insertIndex = blocks.findIndex((b) => b.id === overId);
          if (insertIndex >= 0) {
            setBlocks((prev) => {
              const next = [...prev];
              next.splice(insertIndex, 0, newBlock);
              return next;
            });
          } else {
            setBlocks((prev) => [...prev, newBlock]);
          }
        } else {
          setBlocks((prev) => [...prev, newBlock]);
        }
        setSelectedId(newBlock.id);
        return;
      }

      if (!over) return;
      const overData = over.data.current;
      if (activeData?.type === "canvas-block" && overData?.type === "canvas-block") {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
        setBlocks((prev) => {
          const next = [...prev];
          const [removed] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, removed);
          return next;
        });
      }
    },
    [blocks]
  );

  const handleResize = useCallback((blockId, size) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, width: size.width, height: size.height } : b))
    );
  }, []);

  const handleUpdateBlock = useCallback((updates) => {
    if (!selectedId) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === selectedId ? { ...b, ...updates } : b))
    );
  }, [selectedId]);

  const handleRemoveBlock = useCallback(() => {
    if (!selectedId) return;
    setBlocks((prev) => prev.filter((b) => b.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handleSave = useCallback(async () => {
    const layout = layoutToJson(blocks);
    const name = questionType.trim() || "Custom";
    const payload = {
      questionType: name.replace(/\s+/g, "_"),
      displayName: name,
      layout: { questionType: name, layout },
    };
    try {
      if (initialLayout?.id) {
        const res = await fetch(`${API_BASE}/api/question-type-layouts/${initialLayout.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to update");
      } else {
        const res = await fetch(`${API_BASE}/api/question-type-layouts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to save");
      }
      onSave?.(payload);
    } catch (e) {
      alert(e.message || "Save failed");
    }
  }, [blocks, questionType, initialLayout, authHeaders, onSave]);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
  };

  const activeBlock = activeId && typeof activeId === "string" && activeId.startsWith("block-")
    ? blocks.find((b) => b.id === activeId)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-1 gap-4 overflow-hidden rounded-xl bg-[#f4f7fe] p-4">
      <ComponentPanel />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white shadow-sm"
          onClick={() => setSelectedId(null)}
        >
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-2">
            <input
              type="text"
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800"
              placeholder="Question type name (e.g. Match The Following)"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
            />
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#16a34a]"
            >
              Save question type
            </button>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div ref={setCanvasRef} className="mx-auto flex min-h-[200px] max-w-2xl flex-col gap-4">
                {blocks.length === 0 && (
                  <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-500">
                    Drop components here
                  </div>
                )}
                {blocks.map((block) => (
                  <DraggableComponent
                    key={block.id}
                    block={block}
                    selected={selectedId === block.id}
                    onSelect={() => setSelectedId(block.id)}
                    onResize={handleResize}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeBlock ? (
            <div
              className="rounded-xl border-2 border-gray-200 bg-white p-3 shadow-lg"
              style={{ width: activeBlock.width, height: activeBlock.height }}
            >
              <span className="text-sm text-gray-600">
                {COMPONENT_TYPES[activeBlock.component] || activeBlock.component}
              </span>
            </div>
          ) : activeId && String(activeId).startsWith("palette-") ? (
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg text-sm text-gray-700">
              {COMPONENT_TYPES[String(activeId).replace("palette-", "")] || activeId}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <PropertiesPanel
        block={selectedBlock}
        onUpdate={handleUpdateBlock}
        onRemove={handleRemoveBlock}
      />
    </div>
  );
}
