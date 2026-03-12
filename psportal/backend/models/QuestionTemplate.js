const mongoose = require("mongoose");

const layoutItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const configSchema = new mongoose.Schema(
  {
    // MCQ
    numberOfOptions: Number,
    allowMultipleCorrect: Boolean,
    // Fill in the Blank
    numberOfBlanks: Number,
    // Programming
    numberOfTestCases: Number,
    // Match the Following
    numberOfPairs: Number,
  },
  { _id: false }
);

const questionTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ["mcq", "fill_blank", "programming", "match_following"],
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    layout: { type: [layoutItemSchema], default: [] },
    config: { type: configSchema, default: {} },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

questionTemplateSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("QuestionTemplate", questionTemplateSchema);
