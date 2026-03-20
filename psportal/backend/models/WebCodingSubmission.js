const mongoose = require("mongoose");

const webCodingSubmissionSchema = new mongoose.Schema(
  {
    register_no: { type: String, required: true, index: true },
    level: { type: Number, required: true, index: true }, // 1..3
    problemId: { type: String, required: true, index: true },

    // Latest attempt data (code can change every submit).
    language: { type: String, default: "c" }, // c/cpp/javascript/python
    stdin: { type: String, default: "" },
    code: { type: String, default: "" },

    // Completion tracking.
    isAccepted: { type: Boolean, default: false }, // once accepted, stays true
    lastVerdict: { type: String, default: "Failed" }, // Accepted/Failed
    lastPassed: { type: Number, default: 0 },
    lastTotal: { type: Number, default: 0 },
    lastSubmittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

webCodingSubmissionSchema.index({ register_no: 1, level: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model("WebCodingSubmission", webCodingSubmissionSchema, "web_coding_submissions");

