const mongoose = require("mongoose");

const facultyCourseAssignmentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCourse", required: true },
}, { timestamps: true });

facultyCourseAssignmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model("FacultyCourseAssignment", facultyCourseAssignmentSchema);
