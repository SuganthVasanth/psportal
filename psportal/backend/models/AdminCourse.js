const mongoose = require("mongoose");

// Dashboard course list (name, description, status) - separate from main Course model
const studyMaterialSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  type: { type: String, enum: ["link", "file"], default: "link" },
  url: { type: String, default: "" },
  content: { type: String, default: "" },
}, { _id: false });

const levelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rewardPoints: { type: Number, default: 0 },
  prerequisiteLevelIndex: { type: Number, default: -1 },
  prerequisiteLevelIndices: [{ type: Number }],
  assessmentType: { type: String, default: "MCQ" },
  durationMinutes: { type: Number, default: 60 },
  topics: [{ type: String }],
  studyMaterials: [studyMaterialSchema],
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
