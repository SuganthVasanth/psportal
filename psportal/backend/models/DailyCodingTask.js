const mongoose = require("mongoose");

const dailyCodingTaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    problemId: { type: String, required: true },
    date: { type: Date, required: true }, // day (start of day UTC or local)
    points: { type: Number, default: 10 },
  },
  { timestamps: true }
);

dailyCodingTaskSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("DailyCodingTask", dailyCodingTaskSchema, "daily_coding_tasks");
