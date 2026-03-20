const mongoose = require("mongoose");

const codingSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    register_no: { type: String, required: true },
    problemId: { type: String, required: true },
    courseId: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, default: "" },
    result: { type: String, default: "pending" }, // accepted, wrong_answer, runtime_error, etc.
    executionTime: { type: Number, default: null },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

codingSubmissionSchema.index({ register_no: 1, problemId: 1 });
codingSubmissionSchema.index({ register_no: 1, submittedAt: -1 });

module.exports = mongoose.model("CodingSubmission", codingSubmissionSchema, "coding_submissions");
