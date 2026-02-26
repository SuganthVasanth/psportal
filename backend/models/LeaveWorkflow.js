const mongoose = require("mongoose");

const leaveWorkflowSchema = new mongoose.Schema({
  leaveType: { type: String, required: true },
  workflow: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("LeaveWorkflow", leaveWorkflowSchema);
