import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
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
import { getLockedTemplateCanvasSize } from "../../components/renderer/LockedTemplateRenderer";

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
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [templatesList, setTemplatesList] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [templateIdInput, setTemplateIdInput] = useState("");

  const lastLoadedTemplateIdRef = useRef(null);

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
  }, [history.reset]);

  useEffect(() => {
    if (!initialTemplateId) return;
    const id = String(initialTemplateId);
    if (lastLoadedTemplateIdRef.current === id) return;
    lastLoadedTemplateIdRef.current = id;
    templateApi
      .getById(initialTemplateId)
      .then(loadTemplate)
      .catch(() => {});
  }, [initialTemplateId, loadTemplate]);

  useEffect(() => {
    // If you open builder directly (without coming from the template list),
    // initialTemplateId will be null. Let the admin pick a template to edit.
    if (initialTemplateId) return;
    setTemplatesLoading(true);
    setTemplatesError(null);
    templateApi
      .getAll("")
      .then((list) => setTemplatesList(Array.isArray(list) ? list : []))
      .catch((e) => setTemplatesError(e?.message || "Failed to load templates"))
      .finally(() => setTemplatesLoading(false));
  }, [initialTemplateId]);

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
    setTemplateIdInput("");
  }, [history]);

  const handleLoadById = useCallback(() => {
    const id = (templateIdInput || "").trim();
    if (!id) return;
    templateApi
      .getById(id)
      .then(loadTemplate)
      .catch((e) => setTemplatesError(e?.message || "Failed to load template by id"));
  }, [templateIdInput, loadTemplate]);

  const canvasZoomBounds = { min: 0.6, max: 1.8, step: 0.1 };
  const zoomOutCanvas = () =>
    setCanvasZoom((z) =>
      Math.max(canvasZoomBounds.min, Number((z - canvasZoomBounds.step).toFixed(2)))
    );
  const zoomInCanvas = () =>
    setCanvasZoom((z) =>
      Math.min(canvasZoomBounds.max, Number((z + canvasZoomBounds.step).toFixed(2)))
    );
  const resetCanvasZoom = () => setCanvasZoom(1);

  const canvasSize = useMemo(() => getLockedTemplateCanvasSize(layout), [layout]);

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
            {!initialTemplateId && (
              <select
                value={editingId || ""}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) {
                    handleNew();
                    return;
                  }
                  templateApi
                    .getById(id)
                    .then(loadTemplate)
                    .catch(() => {});
                }}
                disabled={templatesLoading}
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{
                  borderColor: "var(--color-pastel-border)",
                  backgroundColor: "var(--color-portal-card)",
                  minWidth: 280,
                }}
                aria-label="Choose template to edit"
              >
                <option value="">
                  {templatesLoading ? "Loading templates..." : "Choose template to edit"}
                </option>
                {(templatesList || []).map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name || t.key || "Untitled"}
                  </option>
                ))}
              </select>
            )}
            {!initialTemplateId && templatesError && (
              <span className="text-xs text-red-500">
                {templatesError}
              </span>
            )}
            {!initialTemplateId && !templatesLoading && !templatesError && templatesList.length === 0 && (
              <span className="text-xs text-slate-500">No templates found.</span>
            )}
            {!initialTemplateId && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={templateIdInput}
                  onChange={(e) => setTemplateIdInput(e.target.value)}
                  placeholder="Paste template id"
                  className="rounded-lg border px-3 py-1.5 text-sm"
                  style={{
                    borderColor: "var(--color-pastel-border)",
                    backgroundColor: "var(--color-portal-card)",
                    minWidth: 240,
                  }}
                  aria-label="Template id"
                />
                <button
                  type="button"
                  onClick={handleLoadById}
                  disabled={!templateIdInput.trim()}
                  className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    borderColor: "var(--color-pastel-border)",
                    backgroundColor: "var(--color-portal-card)",
                    color: "var(--color-portal-text)",
                  }}
                >
                  Load
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5"
            style={{ borderColor: "var(--color-pastel-border)", backgroundColor: "var(--color-portal-card)" }}
            title="Canvas zoom"
          >
            <button
              type="button"
              onClick={zoomOutCanvas}
              disabled={canvasZoom <= canvasZoomBounds.min + 1e-9}
              className="rounded-md border px-2 py-1 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--color-pastel-border)", color: "var(--color-portal-text)", backgroundColor: "var(--color-portal-card)" }}
              aria-label="Zoom out canvas"
            >
              -
            </button>
            <button
              type="button"
              onClick={resetCanvasZoom}
              className="rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-100"
              style={{ color: "var(--color-pastel-text)" }}
              aria-label="Reset canvas zoom"
              title="Reset zoom"
            >
              {Math.round(canvasZoom * 100)}%
            </button>
            <button
              type="button"
              onClick={zoomInCanvas}
              disabled={canvasZoom >= canvasZoomBounds.max - 1e-9}
              className="rounded-md border px-2 py-1 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--color-pastel-border)", color: "var(--color-portal-text)", backgroundColor: "var(--color-portal-card)" }}
              aria-label="Zoom in canvas"
            >
              +
            </button>
          </div>
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
            <div className="flex-1 min-h-0 overflow-auto">
              <div style={{ zoom: canvasZoom }} className="min-w-max">
                <TemplateCanvas
                  layout={layout}
                  canvasSize={canvasSize}
                  setLayout={setLayout}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  pushHistory={pushHistory}
                />
              </div>
            </div>
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
