const mongoose = require("mongoose");

const questionTypeLayoutSchema = new mongoose.Schema(
  {
    questionType: { type: String, required: true, unique: true },
    displayName: { type: String, default: "" },
    layout: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

//questionTypeLayoutSchema.index({ questionType: 1 });

module.exports = mongoose.model("QuestionTypeLayout", questionTypeLayoutSchema);
