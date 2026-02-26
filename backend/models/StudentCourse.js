const mongoose = require("mongoose");

const studentCourseSchema = new mongoose.Schema({
  register_no: { type: String, required: true },
  course_id: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, default: "" },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("StudentCourse", studentCourseSchema);
