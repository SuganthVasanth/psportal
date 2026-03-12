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
};

const GRID_SIZE = 8;

export function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function createTemplateComponent(type, overrides = {}) {
  const defaults = DEFAULT_TEMPLATE_PROPS[type] || { width: 200, height: 80 };
  const id = `component-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    if (["label", "placeholder", "required", "numberOfOptions", "pairs", "src"].includes(key)) {
      base.properties[key] = overrides.properties?.[key] ?? defaults[key];
    }
  });
  if (defaults.numberOfOptions != null) base.properties.numberOfOptions = overrides.properties?.numberOfOptions ?? defaults.numberOfOptions;
  if (defaults.pairs != null) base.properties.pairs = overrides.properties?.pairs ?? defaults.pairs;
  if (defaults.src !== undefined) base.properties.src = overrides.properties?.src ?? defaults.src;
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
