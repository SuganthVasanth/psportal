const mongoose = require("mongoose");

const codingProblemSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    courseId: { type: String, required: true },
    levelIndex: { type: Number, required: true },
    topic: { type: String, default: "" },
    exampleInputs: { type: String, default: "" },
    exampleOutputs: { type: String, default: "" },
    constraints: { type: String, default: "" },
    hints: { type: String, default: "" },
    sourcePlatform: { type: String, default: "" }, // LeetCode, HackerRank, HackerEarth
    linkToOriginalProblem: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

codingProblemSchema.index({ courseId: 1, levelIndex: 1, topic: 1 });

module.exports = mongoose.model("CodingProblem", codingProblemSchema, "coding_problems");
