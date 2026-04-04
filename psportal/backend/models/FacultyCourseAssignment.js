const mongoose = require("mongoose");

const facultyCourseAssignmentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCourse", required: true },
    level_index: { type: Number, default: 0 },
    // Optional: question template and count for this course/faculty
    template_id: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionTemplate" },
    question_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

facultyCourseAssignmentSchema.index({ user_id: 1, course_id: 1, level_index: 1 }, { unique: true });

module.exports = mongoose.model("FacultyCourseAssignment", facultyCourseAssignmentSchema);
