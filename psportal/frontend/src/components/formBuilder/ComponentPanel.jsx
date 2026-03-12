import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENT_TYPES } from "./componentTypes";
import {
  Type,
  FileInput,
  Hash,
  List,
  CheckSquare,
  ChevronDown,
  Code,
  ListOrdered,
  GitCompare,
  ToggleLeft,
  Upload,
  Minus,
  Layout,
} from "lucide-react";

const ICONS = {
  textLabel: Type,
  textInput: FileInput,
  textarea: FileInput,
  numberInput: Hash,
  radioGroup: List,
  checkboxGroup: CheckSquare,
  dropdown: ChevronDown,
  codeEditor: Code,
  optionList: ListOrdered,
  testCaseBuilder: List,
  matchingPairs: GitCompare,
  trueFalseSelector: ToggleLeft,
  fileUpload: Upload,
  sectionDivider: Minus,
  cardContainer: Layout,
};

function DraggableItem({ type }) {
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
        flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700
        shadow-sm transition hover:border-portal-primary hover:bg-portal-primary-light/30 cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <Icon size={16} className="text-portal-muted shrink-0" />
      <span>{COMPONENT_TYPES[type] || type}</span>
    </div>
  );
}

export default function ComponentPanel() {
  const groups = [
    { title: "Basic", types: ["textLabel", "textInput", "textarea", "numberInput"] },
    { title: "Choices", types: ["radioGroup", "checkboxGroup", "dropdown", "trueFalseSelector"] },
    { title: "Question", types: ["optionList", "testCaseBuilder", "matchingPairs", "fillBlank", "shortAnswer"] },
    { title: "Other", types: ["codeEditor", "fileUpload", "sectionDivider", "cardContainer"] },
  ];

  return (
    <div className="flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">Components</h3>
        <p className="mt-0.5 text-xs text-gray-500">Drag onto canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{g.title}</p>
            <div className="space-y-1.5">
              {g.types.map((t) => (
                <DraggableItem key={t} type={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
