const mongoose = require("mongoose");

const practiceLevelSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    levelIndex: { type: Number, required: true },
    name: { type: String, required: true },
    topics: [{ type: String }], // e.g. ["Variables", "Input Output"]
  },
  { timestamps: true }
);

practiceLevelSchema.index({ courseId: 1, levelIndex: 1 }, { unique: true });

module.exports = mongoose.model("PracticeLevel", practiceLevelSchema, "practice_levels");
