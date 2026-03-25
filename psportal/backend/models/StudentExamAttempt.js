const mongoose = require("mongoose");

const studentExamAttemptSchema = new mongoose.Schema(
  {
    register_no: { type: String, required: true },
    course_id: { type: String, required: true },
    booking_id: { type: String, default: "" },
    score: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    questions: [
      {
        questionNumber: { type: Number, required: true },
        template_id: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionTemplate" },
        value: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    submitted_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentExamAttemptSchema.index({ register_no: 1, course_id: 1 });

module.exports = mongoose.model("StudentExamAttempt", studentExamAttemptSchema);
