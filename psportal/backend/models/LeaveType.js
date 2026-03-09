const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
