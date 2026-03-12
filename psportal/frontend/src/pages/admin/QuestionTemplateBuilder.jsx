import React, { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  Save,
  Undo2,
  Redo2,
  Copy,
  Eye,
  Plus,
  X,
} from "lucide-react";
import ComponentLibrary from "../../components/builder/ComponentLibrary";
import TemplateCanvas, {
  CANVAS_DROP_ID,
  layoutToTemplateSchema,
} from "../../components/builder/TemplateCanvas";
import TemplatePropertiesPanel from "../../components/builder/TemplatePropertiesPanel";
import {
  createTemplateComponent,
  TEMPLATE_COMPONENT_TYPES,
} from "../../components/builder/templateComponentTypes";
import { useTemplateHistory } from "../../components/builder/useTemplateHistory";
import { templateApi } from "../../services/templateApi";
import TemplatePreviewModal from "../../components/builder/TemplatePreviewModal";

const GRID = 8;
const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
};

export default function QuestionTemplateBuilder({ initialTemplateId = null, onClose = null }) {
  const [layout, setLayoutState] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const history = useTemplateHistory(layout, 50);

  const setLayout = useCallback(
    (fnOrValue) => {
      setLayoutState((prev) => {
        const next = typeof fnOrValue === "function" ? fnOrValue(prev) : fnOrValue;
        return next;
      });
    },
    []
  );

  const pushHistory = useCallback(
    (nextLayout) => {
      history.push(nextLayout);
    },
    [history]
  );

  const handleUndo = useCallback(() => {
    const prev = history.undo();
    if (prev) setLayoutState(prev);
  }, [history]);

  const handleRedo = useCallback(() => {
    const next = history.redo();
    if (next) setLayoutState(next);
  }, [history]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      const activeData = active?.data?.current;
      if (activeData?.type === "palette" && over?.id === CANVAS_DROP_ID) {
        const componentType = activeData.componentType;
        const pos = {
          x: 20,
          y: 20 + layout.length * (80 + GRID),
        };
        const newComponent = createTemplateComponent(componentType, { x: pos.x, y: pos.y });
        setLayoutState((prev) => {
          const next = [...prev, newComponent];
          history.push(next);
          return next;
        });
        setSelectedId(newComponent.id);
      }
    },
    [layout.length, history]
  );

  const activePaletteType =
    activeId && String(activeId).startsWith("palette-")
      ? String(activeId).replace("palette-", "")
      : null;
  const activeComponent = activePaletteType
    ? createTemplateComponent(activePaletteType)
    : null;

  const selectedComponent = layout.find((c) => c.id === selectedId);

  const updateComponent = useCallback(
    (updates) => {
      if (!selectedId) return;
      setLayoutState((prev) => {
        const next = prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                ...updates,
                properties: { ...(c.properties || {}), ...(updates.properties || {}) },
              }
            : c
        );
        history.push(next);
        return next;
      });
    },
    [selectedId, history]
  );

  const removeComponent = useCallback(() => {
    if (!selectedId) return;
    setLayoutState((prev) => {
      const next = prev.filter((c) => c.id !== selectedId);
      history.push(next);
      return next;
    });
    setSelectedId(null);
  }, [selectedId, history]);

  const duplicateComponent = useCallback(() => {
    if (!selectedId) return;
    const src = layout.find((c) => c.id === selectedId);
    if (!src) return;
    const copy = {
      ...createTemplateComponent(src.type, {
        x: src.x + 20,
        y: src.y + 20,
        width: src.width,
        height: src.height,
        properties: { ...src.properties },
      }),
    };
    copy.id = `component-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setLayoutState((prev) => {
      const next = [...prev, copy];
      history.push(next);
      return next;
    });
    setSelectedId(copy.id);
  }, [selectedId, layout, history]);

  const loadTemplate = useCallback((template) => {
    const layoutData = (template.layout || []).map((item) => ({
      id: item.id || `component-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: item.type,
      x: item.x ?? 0,
      y: item.y ?? 0,
      width: item.width ?? 200,
      height: item.height ?? 80,
      properties: item.properties || {},
    }));
    setLayoutState(layoutData);
    history.reset(layoutData);
    setTemplateName(template.name || "");
    setTemplateDescription(template.description || "");
    setEditingId(template._id);
    setSelectedId(null);
  }, [history]);

  useEffect(() => {
    if (!initialTemplateId) return;
    templateApi
      .getById(initialTemplateId)
      .then(loadTemplate)
      .catch(() => {});
  }, [initialTemplateId, loadTemplate]);

  const handleSave = useCallback(async () => {
    const name = templateName.trim() || "Untitled Template";
    const payload = {
      name,
      description: templateDescription.trim(),
      layout: layoutToTemplateSchema(layout),
    };
    setSaveStatus("saving");
    try {
      if (editingId) {
        await templateApi.update(editingId, payload);
        setSaveStatus("saved");
      } else {
        const created = await templateApi.create(payload);
        setEditingId(created._id);
        setSaveStatus("saved");
      }
    } catch (e) {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus(null), 2500);
  }, [templateName, templateDescription, layout, editingId]);

  const handleNew = useCallback(() => {
    setLayoutState([]);
    history.reset([]);
    setTemplateName("");
    setTemplateDescription("");
    setEditingId(null);
    setSelectedId(null);
  }, [history]);

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: "var(--color-pastel-surface, #f1f5f9)" }}>
      <header
        className="flex shrink-0 items-center justify-between border-b px-4 py-3 shadow-sm"
        style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-pastel-lavender-soft, #f5f3ff)" }}
      >
        <div className="flex items-center gap-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)", color: "var(--color-pastel-text)" }}
              title="Exit full screen"
            >
              <X size={18} />
              Exit
            </button>
          )}
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: "var(--color-pastel-indigo, #e0e7ff)", backgroundColor: "var(--color-portal-card)", color: "var(--color-portal-primary)" }}
          >
            <Plus size={16} />
            New template
          </button>
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-portal-text)" }}>Question Template Builder</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)" }}
              placeholder="Template name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <input
              type="text"
              className="rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)" }}
              placeholder="Description (optional)"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!history.canUndo}
            className="rounded-lg border p-2 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)", color: "var(--color-pastel-text)" }}
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!history.canRedo}
            className="rounded-lg border p-2 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)", color: "var(--color-pastel-text)" }}
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
          <button
            type="button"
            onClick={duplicateComponent}
            disabled={!selectedId}
            className="rounded-lg border p-2 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)", color: "var(--color-pastel-text)" }}
            title="Duplicate component"
          >
            <Copy size={18} />
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors"
            style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)", color: "var(--color-pastel-text)" }}
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
            style={{ backgroundColor: "var(--color-portal-primary)", color: "#fff" }}
          >
            <Save size={16} />
            {saveStatus === "saving" ? "Saving…" : "Save Template"}
          </button>
          {saveStatus === "saved" && (
            <span className="text-sm" style={{ color: "var(--color-portal-success)" }}>Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-500">Save failed</span>
          )}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 min-h-0 gap-3 p-4">
          <div className="w-52 shrink-0 flex flex-col min-h-0">
            <ComponentLibrary />
          </div>

          <div
            className="flex flex-1 min-w-0 flex-col min-h-0 rounded-xl shadow-sm overflow-hidden"
            style={{ border: "1px solid var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)" }}
          >
            <TemplateCanvas
              layout={layout}
              setLayout={setLayout}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              pushHistory={pushHistory}
            />
          </div>

          <div className="w-64 shrink-0 flex flex-col min-h-0">
            <TemplatePropertiesPanel
              component={selectedComponent}
              onUpdate={updateComponent}
              onRemove={removeComponent}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeComponent ? (
            <div
              className="rounded-xl border-2 p-3 shadow-lg"
              style={{
                width: activeComponent.width,
                height: activeComponent.height,
                borderColor: "var(--color-pastel-indigo)",
                backgroundColor: "var(--color-pastel-lavender-soft)",
              }}
            >
              <span className="text-sm" style={{ color: "var(--color-pastel-text)" }}>
                {TEMPLATE_COMPONENT_TYPES[activeComponent.type] || activeComponent.type}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {previewOpen && (
        <TemplatePreviewModal
          layout={layout}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}
