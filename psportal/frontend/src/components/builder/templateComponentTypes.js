/**
 * Question Template Builder – component type definitions.
 * Types match backend template schema and DynamicQuestionRenderer.
 */
export const TEMPLATE_COMPONENT_TYPES = {
  question_text: "Question Text",
  paragraph: "Paragraph / Instruction",
  input_field: "Input Field",
  multiple_choice: "Multiple Choice Options",
  checkbox_options: "Checkbox Options",
  dropdown: "Dropdown",
  image: "Image",
  match_pairs: "Match Pair Component",
  blank_space: "Blank Space",
  drag_drop_area: "Drag Drop Area",
  numeric_answer: "Numeric Answer",
  arrange_order: "Arrange in Order",
  cloze_passage: "Cloze Passage (Multi Blank)",
  matrix_mcq: "Matrix MCQ",
  image_question: "Image Question",
  file_upload_question: "File Upload",
  code_output_question: "Code Output Question",
  debugging_question: "Debugging Question",
  programming_question: "Programming Question",
  fill_blank: "Fill in the Blank",
};

export const DEFAULT_TEMPLATE_PROPS = {
  question_text: {
    label: "Question",
    placeholder: "Question here",
    required: true,
    width: 500,
    height: 80,
  },
  paragraph: {
    label: "Instruction",
    placeholder: "Instructions or paragraph text",
    required: false,
    width: 500,
    height: 60,
  },
  input_field: {
    label: "Input",
    placeholder: "Enter text",
    required: false,
    width: 300,
    height: 40,
  },
  multiple_choice: {
    label: "Options",
    placeholder: "",
    required: true,
    numberOfOptions: 4,
    width: 400,
    height: 200,
  },
  checkbox_options: {
    label: "Options",
    placeholder: "",
    required: false,
    numberOfOptions: 4,
    width: 400,
    height: 180,
  },
  dropdown: {
    label: "Dropdown",
    placeholder: "Select...",
    required: false,
    numberOfOptions: 4,
    width: 300,
    height: 40,
  },
  image: {
    label: "Image",
    placeholder: "",
    required: false,
    src: "",
    width: 400,
    height: 200,
  },
  match_pairs: {
    label: "Match pairs",
    placeholder: "",
    required: true,
    pairs: 4,
    width: 600,
    height: 300,
  },
  blank_space: {
    label: "",
    placeholder: "",
    required: false,
    width: 200,
    height: 40,
  },
  drag_drop_area: {
    label: "Drag drop area",
    placeholder: "Drop items here",
    required: false,
    width: 400,
    height: 200,
  },
  numeric_answer: {
    label: "Numeric Answer",
    placeholder: "Enter number",
    required: true,
    mode: "exact",
    width: 300,
    height: 80,
  },
  arrange_order: {
    label: "Arrange in Order",
    placeholder: "",
    required: true,
    numberOfItems: 4,
    width: 400,
    height: 200,
  },
  cloze_passage: {
    label: "Cloze Passage",
    placeholder: "Passage text. Use ___ for blanks.",
    required: true,
    numberOfBlanks: 2,
    width: 500,
    height: 220,
  },
  matrix_mcq: {
    label: "Matrix MCQ",
    placeholder: "",
    required: true,
    rows: 3,
    columns: 3,
    width: 500,
    height: 260,
  },
  image_question: {
    label: "Image Question",
    placeholder: "",
    required: false,
    src: "",
    numberOfOptions: 4,
    width: 450,
    height: 280,
  },
  file_upload_question: {
    label: "File Upload",
    placeholder: "Choose file",
    required: false,
    allowedTypes: ".pdf,.doc,.docx",
    maxSizeMB: 10,
    width: 400,
    height: 100,
  },
  code_output_question: {
    label: "Code Output Question",
    placeholder: "",
    required: true,
    numberOfOptions: 4,
    width: 500,
    height: 280,
  },
  debugging_question: {
    label: "Debugging Question",
    placeholder: "Code with bug",
    required: true,
    width: 550,
    height: 320,
  },
  programming_question: {
    label: "Programming Question",
    placeholder: "",
    required: true,
    sampleTestCases: 2,
    hiddenTestCases: 2,
    width: 600,
    height: 400,
  },
  fill_blank: {
    label: "Fill in the Blank",
    placeholder: "Question with _____ blanks",
    required: true,
    numberOfBlanks: 2,
    width: 500,
    height: 220,
  },
};

const GRID_SIZE = 8;

export function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

const PROP_KEYS = [
  "label", "placeholder", "required", "numberOfOptions", "pairs", "src",
  "mode", "numberOfItems", "numberOfBlanks", "rows", "columns", "allowedTypes", "maxSizeMB",
  "sampleTestCases", "hiddenTestCases", "optionLabels", "allowMultipleCorrect",
  "leftColumnLabel", "rightColumnLabel",
];
export function createTemplateComponent(type, overrides = {}) {
  const defaults = DEFAULT_TEMPLATE_PROPS[type] || { width: 200, height: 80 };
  const id = overrides.id || `component-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const base = {
    id,
    type,
    x: overrides.x ?? 0,
    y: overrides.y ?? 0,
    width: overrides.width ?? defaults.width,
    height: overrides.height ?? defaults.height,
    properties: {},
  };
  Object.keys(defaults).forEach((key) => {
    if (key === "width" || key === "height") return;
    base.properties[key] = overrides.properties?.[key] ?? defaults[key];
  });
  PROP_KEYS.forEach((key) => {
    if (overrides.properties?.[key] !== undefined) base.properties[key] = overrides.properties[key];
  });
  return base;
}

export function layoutToTemplateSchema(layout) {
  return layout.map((item) => ({
    id: item.id,
    type: item.type,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    properties: item.properties || {},
  }));
}
