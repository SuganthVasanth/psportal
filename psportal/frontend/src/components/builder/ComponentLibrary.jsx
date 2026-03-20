import React from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Type,
  FileText,
  Hash,
  List,
  CheckSquare,
  ChevronDown,
  Image,
  GitCompare,
  Minus,
  LayoutGrid,
  ListOrdered,
  AlignLeft,
  Table,
  Upload,
  Code2,
  Bug,
  Terminal,
} from "lucide-react";
import { TEMPLATE_COMPONENT_TYPES } from "./templateComponentTypes";

const ICONS = {
  question_text: Type,
  paragraph: FileText,
  input_field: Hash,
  multiple_choice: List,
  checkbox_options: CheckSquare,
  dropdown: ChevronDown,
  image: Image,
  match_pairs: GitCompare,
  blank_space: Minus,
  drag_drop_area: LayoutGrid,
  numeric_answer: Hash,
  arrange_order: ListOrdered,
  cloze_passage: AlignLeft,
  matrix_mcq: Table,
  image_question: Image,
  file_upload_question: Upload,
  code_output_question: Code2,
  debugging_question: Bug,
  programming_question: Terminal,
  fill_blank: AlignLeft,
};

function DraggableLibraryItem({ type }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type: "palette", componentType: type },
  });
  const Icon = ICONS[type] || Type;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700
        shadow-sm transition hover:border-violet-400 hover:bg-violet-50/50 cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <Icon size={16} className="text-slate-500 shrink-0" />
      <span>{TEMPLATE_COMPONENT_TYPES[type] || type}</span>
    </div>
  );
}

const COMPONENT_GROUPS = [
  {
    title: "Content",
    types: ["question_text", "paragraph", "input_field", "blank_space", "fill_blank", "cloze_passage"],
  },
  {
    title: "Choices",
    types: ["multiple_choice", "checkbox_options", "dropdown", "matrix_mcq"],
  },
  {
    title: "Interactive",
    types: ["match_pairs", "drag_drop_area", "arrange_order", "image", "image_question"],
  },
  {
    title: "Special",
    types: ["numeric_answer", "file_upload_question", "code_output_question", "debugging_question", "programming_question"],
  },
];

export default function ComponentLibrary() {
  return (
    <div
      className="flex h-full w-full max-w-[14rem] shrink-0 flex-col overflow-hidden rounded-xl shadow-sm"
      style={{ border: "1px solid var(--color-pastel-border, #e2e8f0)", backgroundColor: "var(--color-pastel-lavender-soft, #f5f3ff)" }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-pastel-border, #e2e8f0)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-portal-text, #1e293b)" }}>Component Library</h3>
        <p className="mt-0.5 text-xs" style={{ color: "var(--color-pastel-text, #64748b)" }}>Drag onto canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {COMPONENT_GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              {g.title}
            </p>
            <div className="space-y-1.5">
              {g.types.map((t) => (
                <DraggableLibraryItem key={t} type={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
