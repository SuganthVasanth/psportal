const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true },
    facultyName: { type: String, required: true, trim: true },
    createdByUserId: { type: String, trim: true, index: true },
    date: { type: Date, required: true },
    googleClassroomLink: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

taskSchema.index({ date: -1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema, "tasks");

