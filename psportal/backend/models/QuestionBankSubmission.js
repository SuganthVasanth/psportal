const mongoose = require("mongoose");

const questionBankSubmissionSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdminCourse", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["draft", "submitted", "approved", "rejected"],
    default: "draft",
  },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  file_url: { type: String, default: "" },
  file_name: { type: String, default: "" },
  submitted_at: { type: Date },
  reviewed_at: { type: Date },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  review_remarks: { type: String, default: "" },
}, { timestamps: true });

questionBankSubmissionSchema.index({ course_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("QuestionBankSubmission", questionBankSubmissionSchema);
