const mongoose = require("mongoose");

// Time-of-day slot template (e.g. 09:00 - 10:30) for admin dashboard
const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true }   // "10:30"
}, { timestamps: true });

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
