export const COMPONENT_TYPES = {
  textLabel: "Text Label",
  textInput: "Text Input",
  textarea: "Textarea",
  numberInput: "Number Input",
  radioGroup: "Radio Button Group",
  checkboxGroup: "Checkbox Group",
  dropdown: "Dropdown",
  codeEditor: "Code Editor",
  optionList: "Option List (MCQ)",
  testCaseBuilder: "Test Case Builder",
  matchingPairs: "Matching Pairs",
  trueFalseSelector: "True/False Selector",
  fileUpload: "File Upload",
  sectionDivider: "Section Divider",
  cardContainer: "Card Container",
  fillBlank: "Fill in the Blank",
  shortAnswer: "Short Answer",
};

export const DEFAULT_PROPS = {
  textLabel: { label: "Label", placeholder: "", required: false, width: 300, height: 40, defaultValue: "" },
  textInput: { label: "Input", placeholder: "Enter text", required: false, width: 300, height: 40, defaultValue: "" },
  textarea: { label: "Question", placeholder: "Question here", required: true, width: 600, height: 120, defaultValue: "" },
  numberInput: { label: "Number", placeholder: "0", required: false, width: 120, height: 40, defaultValue: "" },
  radioGroup: { label: "Options", placeholder: "", required: false, options: 4, width: 300, height: 160 },
  checkboxGroup: { label: "Options", placeholder: "", required: false, options: 4, width: 300, height: 160 },
  dropdown: { label: "Dropdown", placeholder: "Select...", required: false, options: 4, width: 300, height: 40 },
  codeEditor: { label: "Code", placeholder: "", required: false, width: 600, height: 200 },
  optionList: { label: "Options", placeholder: "", required: true, options: 4, width: 400, height: 240 },
  testCaseBuilder: { label: "Test cases", placeholder: "", required: false, testCases: 3, width: 500, height: 280 },
  matchingPairs: { label: "Matching pairs", placeholder: "", required: true, pairs: 4, width: 500, height: 260 },
  trueFalseSelector: { label: "True/False", placeholder: "", required: true, width: 300, height: 80 },
  fileUpload: { label: "File", placeholder: "Choose file", required: false, width: 300, height: 80 },
  sectionDivider: { label: "", placeholder: "", required: false, width: 600, height: 24 },
  cardContainer: { label: "Card", placeholder: "", required: false, width: 400, height: 200 },
  fillBlank: { label: "Question", placeholder: "Accepted answers", required: true, width: 500, height: 220 },
  shortAnswer: { label: "Question", placeholder: "Correct answer", required: true, width: 500, height: 200 },
};

export function createBlock(componentType, overrides = {}) {
  const defaults = DEFAULT_PROPS[componentType] || { width: 300, height: 80 };
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    component: componentType,
    label: overrides.label ?? defaults.label,
    placeholder: overrides.placeholder ?? defaults.placeholder,
    required: overrides.required ?? defaults.required,
    width: overrides.width ?? defaults.width,
    height: overrides.height ?? defaults.height,
    ...(defaults.options != null && { options: overrides.options ?? defaults.options }),
    ...(defaults.testCases != null && { testCases: overrides.testCases ?? defaults.testCases }),
    ...(defaults.pairs != null && { pairs: overrides.pairs ?? defaults.pairs }),
    ...(defaults.defaultValue !== undefined && { defaultValue: overrides.defaultValue ?? defaults.defaultValue }),
  };
}
