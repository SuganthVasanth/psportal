const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "PSCourse", required: true },
    studentId: { type: String, required: true },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
