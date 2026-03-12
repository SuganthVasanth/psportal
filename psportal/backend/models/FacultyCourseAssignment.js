const mongoose = require("mongoose");

const facultyCourseAssignmentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCourse", required: true },
    // Optional: question template and count for this course/faculty
    template_id: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionTemplate" },
    question_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

facultyCourseAssignmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model("FacultyCourseAssignment", facultyCourseAssignmentSchema);
