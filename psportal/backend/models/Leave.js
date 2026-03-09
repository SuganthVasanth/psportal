const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  register_no: { type: String, required: true },
  student_name: { type: String, default: "" },
  leaveType: { type: String, required: true },
  type: { type: String, default: "Leave" }, // "Leave" or "OD"
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  remarks: { type: String, default: "" },
  parentStatus: { type: String, default: "Pending" },
  status: { type: String, default: "Pending" },
  gateOut: { type: String, default: "-" },
  gateIn: { type: String, default: "-" },
  mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // assigned mentor at time of apply
  warden_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // assigned warden at time of apply
  wardenApproval: { status: String, by: String },
  mentorApproval: { status: String, by: String },
}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);
