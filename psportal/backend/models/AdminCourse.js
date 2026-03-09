const mongoose = require("mongoose");

// Dashboard course list (name, description, status) - separate from main Course model
const levelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rewardPoints: { type: Number, default: 0 },
  prerequisiteLevelIndex: { type: Number, default: -1 },
  prerequisiteLevelIndices: [{ type: Number }],
  assessmentType: { type: String, default: "MCQ" },
  topics: [{ type: String }],
}, { _id: false });

const adminCourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  type: { type: String, default: "" },
  course_logo: { type: String, default: "" },
  level: { type: String, default: "" },
  activity_points: { type: Number, default: 0 },
  reward_points: { type: Number, default: 0 },
  faculty: { type: String, default: "" },
  prerequisites: [{ type: String }],
  levels: [levelSchema],
}, { timestamps: true });

module.exports = mongoose.model("AdminCourse", adminCourseSchema);
