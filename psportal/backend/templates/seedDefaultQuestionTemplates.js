const QuestionTemplate = require("../models/QuestionTemplate");

const DEFAULT_TEMPLATES = [
  {
    key: "mcq",
    name: "Multiple Choice Question",
    description: "Standard MCQ template",
    config: { numberOfOptions: 4, allowMultipleCorrect: false },
    layout: [
      {
        id: "q",
        type: "question_text",
        x: 120,
        y: 40,
        width: 640,
        height: 120,
        properties: { label: "Question", required: true, placeholder: "Question here" },
      },
      {
        id: "mcq",
        type: "multiple_choice",
        x: 120,
        y: 200,
        width: 520,
        height: 260,
        properties: { label: "Options", required: true, numberOfOptions: 4 },
      },
    ],
  },
  {
    key: "fill_blank",
    name: "Fill in the Blank",
    description: "Sentence with blanks",
    config: { numberOfBlanks: 1 },
    layout: [
      {
        id: "q",
        type: "question_text",
        x: 120,
        y: 40,
        width: 640,
        height: 120,
        properties: { label: "Sentence", required: true, placeholder: "Write the sentence with blanks" },
      },
      {
        id: "ans",
        type: "input_field",
        x: 120,
        y: 200,
        width: 360,
        height: 56,
        properties: { label: "Correct answer", required: true, placeholder: "Answer" },
      },
    ],
  },
  {
    key: "programming",
    name: "Programming Question",
    description: "Coding problem with test cases",
    config: { numberOfTestCases: 3 },
    layout: [
      {
        id: "ps",
        type: "question_text",
        x: 120,
        y: 40,
        width: 720,
        height: 140,
        properties: { label: "Problem statement", required: true, placeholder: "Describe the problem..." },
      },
      {
        id: "in",
        type: "paragraph",
        x: 120,
        y: 210,
        width: 360,
        height: 56,
        properties: { label: "Input format", required: false, placeholder: "Describe input format..." },
      },
      {
        id: "out",
        type: "paragraph",
        x: 500,
        y: 210,
        width: 360,
        height: 56,
        properties: { label: "Output format", required: false, placeholder: "Describe output format..." },
      },
      {
        id: "tc",
        type: "drag_drop_area",
        x: 120,
        y: 290,
        width: 740,
        height: 260,
        properties: { label: "Test cases", required: false, placeholder: "Add test cases (Input / Output)" },
      },
    ],
  },
  {
    key: "match_following",
    name: "Match the Following",
    description: "Match left and right columns",
    config: { numberOfPairs: 4 },
    layout: [
      {
        id: "q",
        type: "question_text",
        x: 120,
        y: 40,
        width: 640,
        height: 120,
        properties: { label: "Question", required: true, placeholder: "Question here" },
      },
      {
        id: "pairs",
        type: "match_pairs",
        x: 120,
        y: 200,
        width: 740,
        height: 320,
        properties: { label: "Pairs", required: true, pairs: 4 },
      },
    ],
  },
];

async function seedDefaultQuestionTemplates() {
  try {
    await Promise.all(
      DEFAULT_TEMPLATES.map((tpl) =>
        QuestionTemplate.findOneAndUpdate(
          { key: tpl.key },
          { ...tpl, isDefault: true },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        )
      )
    );
    // eslint-disable-next-line no-console
    console.log("[seed] Default question templates ensured");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[seed] Failed to seed default question templates", err);
  }
}

module.exports = { seedDefaultQuestionTemplates };

