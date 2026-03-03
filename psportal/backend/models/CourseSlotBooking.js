const mongoose = require("mongoose");

const courseSlotBookingSchema = new mongoose.Schema({
  register_no: { type: String, required: true },
  student_name: { type: String, default: "" },
  course_id: { type: String, required: true },
  course_name: { type: String, required: true },
  slot_template_id: { type: mongoose.Schema.Types.ObjectId, ref: "SlotTemplate", required: true },
  venue_label: { type: String, required: true },
  time_label: { type: String, required: true },
  booked_at: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("CourseSlotBooking", courseSlotBookingSchema);
