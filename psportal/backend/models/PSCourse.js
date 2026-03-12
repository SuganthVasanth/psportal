const mongoose = require("mongoose");

// Level inside a course: matches Admin level edit form (name, reward points, prereq levels, assessment type, topics)
const levelItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    rewardPoints: { type: Number, default: 0 },
    prerequisiteLevelIndex: { type: Number, default: -1 },
    prerequisiteLevelIndices: [{ type: Number }],
    assessmentType: { type: String, default: "MCQ" },
    topics: [{ type: String }],
  },
  { _id: false }
);

const psCourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive", "Draft"], default: "Active" },
    level: { type: Boolean, default: false },
    parentCourse: { type: String, default: "" },
    prereq: [{ type: String }],
    levels: [levelItemSchema],
  },
  { timestamps: true, collection: "courses" }
);

module.exports = mongoose.model("PSCourse", psCourseSchema);
