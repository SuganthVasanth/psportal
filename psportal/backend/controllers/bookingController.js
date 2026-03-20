const CourseSlotBooking = require("../models/CourseSlotBooking");
const SlotTemplate = require("../models/SlotTemplate");

exports.getActiveSlots = async (req, res) => {
  try {
    // Show slots that are not explicitly "Inactive" (include "Active", undefined, or any other value)
    const list = await SlotTemplate.find({ status: { $ne: "Inactive" } })
      .populate("venue_id")
      .populate("time_slot_id")
      .lean();
    const mapped = list.map((s) => ({
      id: s._id.toString(),
      slot_template_id: s._id.toString(),
      venueLabel: s.venue_id?.name || "",
      timeLabel: s.time_slot_id ? `${s.time_slot_id.startTime} – ${s.time_slot_id.endTime}` : "",
      startTime: s.time_slot_id?.startTime || "",
    }));
    // Order by time first, then by venue name
    mapped.sort((a, b) => {
      const t = (a.startTime || "").localeCompare(b.startTime || "");
      if (t !== 0) return t;
      return (a.venueLabel || "").localeCompare(b.venueLabel || "");
    });
    res.json(mapped.map(({ startTime, ...rest }) => rest));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { register_no, student_name, course_id, course_name, slot_template_id, venue_label, time_label } = req.body;
    if (!register_no || !course_id || !course_name || !slot_template_id || !venue_label || !time_label) {
      return res.status(400).json({ message: "register_no, course_id, course_name, slot_template_id, venue_label, time_label required" });
    }
    const slot = await SlotTemplate.findById(slot_template_id).lean();
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    if ((slot.status || "Active") !== "Active") {
      return res.status(400).json({ message: "Selected slot is not available (inactive)" });
    }
    const doc = await CourseSlotBooking.create({
      register_no,
      student_name: student_name || "",
      course_id,
      course_name,
      slot_template_id,
      venue_label,
      time_label,
    });
    res.status(201).json({
      id: doc._id.toString(),
      register_no: doc.register_no,
      course_name: doc.course_name,
      venue_label: doc.venue_label,
      time_label: doc.time_label,
      booked_at: doc.booked_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { register_no } = req.query;
    if (!register_no) return res.status(400).json({ message: "register_no required" });
    const list = await CourseSlotBooking.find({ register_no })
      .populate({ path: "slot_template_id", populate: { path: "time_slot_id" } })
      .sort({ booked_at: -1 })
      .lean();
    res.json(
      list.map((b) => {
        const timeSlot = b.slot_template_id?.time_slot_id;
        const slot_start_time = timeSlot?.startTime || null;
        const slot_end_time = timeSlot?.endTime || null;
        return {
          id: b._id.toString(),
          course_id: b.course_id,
          course_name: b.course_name,
          venue_label: b.venue_label,
          time_label: b.time_label,
          booked_at: b.booked_at,
          slot_start_time: slot_start_time || undefined,
          slot_end_time: slot_end_time || undefined,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
