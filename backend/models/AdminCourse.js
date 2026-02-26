const mongoose = require("mongoose");

// Dashboard course list (name, description, status) - separate from main Course model
const adminCourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("AdminCourse", adminCourseSchema);
