const mongoose = require("mongoose");

const studentLevelProgressSchema = new mongoose.Schema({
  register_no: { type: String, required: true },
  course_id: { type: String, required: true },
  level_index: { type: Number, required: true },
  status: { type: String, enum: ["enrolled", "completed"], default: "enrolled" },
  completed_at: { type: Date },
}, { timestamps: true });

studentLevelProgressSchema.index({ register_no: 1, course_id: 1, level_index: 1 }, { unique: true });

module.exports = mongoose.model("StudentLevelProgress", studentLevelProgressSchema);
