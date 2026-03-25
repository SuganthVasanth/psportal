const mongoose = require("mongoose");

const taskRegistrationSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    register_no: { type: String, required: true, trim: true, index: true },
    studentName: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

taskRegistrationSchema.index({ taskId: 1, register_no: 1 }, { unique: true });

module.exports = mongoose.model("TaskRegistration", taskRegistrationSchema, "task_registrations");

