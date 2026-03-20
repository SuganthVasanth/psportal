const mongoose = require("mongoose");

const practiceCourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // e.g. "c_programming", "python"
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

practiceCourseSchema.index({ order: 1, code: 1 });

module.exports = mongoose.model("PracticeCourse", practiceCourseSchema, "practice_courses");
