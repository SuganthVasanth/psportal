const mongoose = require("mongoose");

// Dashboard course list (name, description, status) - separate from main Course model
const levelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rewardPoints: { type: Number, default: 0 },
  prerequisiteLevelIndex: { type: Number, default: -1 },
  prerequisiteLevelIndices: [{ type: Number }],
  assessmentType: { type: String, default: "MCQ" },
  topics: [{ type: String }],
  studyMaterials: [{
    type: { type: String, enum: ["file", "link"], required: true, default: "link" },
    title: { type: String, required: true, default: "Study Material" },
    url: { type: String, required: true, default: "" }
  }],
  prerequisiteCourses: [{ type: String }],
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
  levels: [levelSchema],
}, { timestamps: true });

module.exports = mongoose.model("AdminCourse", adminCourseSchema);
