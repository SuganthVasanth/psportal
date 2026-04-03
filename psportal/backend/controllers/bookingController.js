const mongoose = require("mongoose");
const CourseSlotBooking = require("../models/CourseSlotBooking");
const SlotTemplate = require("../models/SlotTemplate");
const Slot = require("../models/Slot");
const AdminCourse = require("../models/AdminCourse");
const StudentLevelProgress = require("../models/StudentLevelProgress");

exports.getActiveSlots = async (req, res) => {
  try {
    const { course_id, level_index, register_no } = req.query;

    // Check for cooldown if register_no is provided
    if (register_no && course_id && level_index !== undefined) {
      const progress = await StudentLevelProgress.findOne({
        register_no,
        course_id,
        level_index: parseInt(level_index)
      }).lean();

      if (progress && progress.last_failed_at) {
        const cooldownMs = 48 * 60 * 60 * 1000;
        const timeSinceFail = Date.now() - new Date(progress.last_failed_at).getTime();
        if (timeSinceFail < cooldownMs) {
          const remainingHours = Math.ceil((cooldownMs - timeSinceFail) / (60 * 60 * 1000));
          return res.status(200).json({ 
            cooldownActive: true, 
            message: `A 48-hour cooldown is active after a failed attempt. Please try again in approximately ${remainingHours} hours.`,
            remainingMs: cooldownMs - timeSinceFail
          });
        }
      }
    }

    const filter = {};
    let studentDuration = 60;

    if (course_id) {
      if (level_index !== undefined && level_index !== "") {
        filter.allowed_courses = {
          $elemMatch: {
            course_id: new mongoose.Types.ObjectId(course_id),
            level_indices: parseInt(level_index)
          }
        };

        // Find duration for this specific level
        const course = await AdminCourse.findById(course_id).lean();
        if (course && Array.isArray(course.levels)) {
          const lvl = course.levels[parseInt(level_index)];
          if (lvl && lvl.durationMinutes) {
            studentDuration = lvl.durationMinutes;
          }
        }
      } else {
        filter["allowed_courses.course_id"] = course_id;
      }
    }

    // Fetch slots that are scheduled for the future (or today / late yesterday) and have capacity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Include yesterday to catch slots that span past midnight
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    filter.date = { $gte: yesterday };

    const list = await Slot.find(filter)
      .populate("venue_id")
      .populate("time_slot_id")
      .lean();

    const formatTime = (timeStr, duration) => {
      if (!timeStr) return "";
      const [h, m] = timeStr.split(":").map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + duration);

      const fmt = (d) => {
        const hh = d.getHours();
        const mm = d.getMinutes();
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const h12 = hh % 12 || 12;
        return `${h12}:${mm.toString().padStart(2, '0')} ${ampm}`;
      };

      return `${fmt(start)} – ${fmt(end)}`;
    };

    const mapped = list.map((s) => ({
      id: s._id.toString(), // Assessment Slot ID
      slot_template_id: s.slot_template_id?.toString(),
      venueLabel: s.venue_id?.name || "",
      timeLabel: s.time_slot_id ? formatTime(s.time_slot_id.startTime, studentDuration) : "",
      startTime: s.time_slot_id?.startTime || "",
      endTime: s.time_slot_id?.endTime || "",
      date: s.date,
      capacity: s.capacity,
      bookedCount: s.booked_count || 0,
      available: (s.capacity || 30) > (s.booked_count || 0)
    }));

    const now = new Date();
    const finalFiltered = mapped.filter((s) => {
      if (!s.date || !s.startTime) return true; // Keep if data is missing to be safe
      const [h, m] = s.startTime.split(":").map(Number);
      
      // Calculate active window based on actual slot date + startTime
      const slotStart = new Date(s.date);
      slotStart.setHours(h, m, 0, 0);

      const slotEnd = new Date(slotStart);
      // Window remains open until startTime + duration + buffer
      slotEnd.setMinutes(slotEnd.getMinutes() + studentDuration + 15); 
      
      return now < slotEnd;
    });

    res.json(finalFiltered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { register_no, student_name, course_id, course_name, slot_id, venue_label, time_label } = req.body;
    
    if (!register_no || !course_id || !slot_id) {
      return res.status(400).json({ message: "register_no, course_id, and slot_id are required" });
    }

    // 1. Check if student already has a booking for this course
    const existing = await CourseSlotBooking.findOne({ register_no, course_id, processed: { $ne: true } });
    if (existing) {
      return res.status(400).json({ message: "You have already booked a slot for this course." });
    }

    // Cooldown check
    const progress = await StudentLevelProgress.findOne({ register_no, course_id }).sort({ level_index: -1 }).lean();
      if (progress && progress.last_failed_at) {
        const cooldownMs = 48 * 60 * 60 * 1000;
        const timeSinceFail = Date.now() - new Date(progress.last_failed_at).getTime();
        if (timeSinceFail < cooldownMs) {
          const remainingHours = Math.ceil((cooldownMs - timeSinceFail) / (60 * 60 * 1000));
          return res.status(403).json({ message: `A 48-hour cooldown is active after a failed attempt. Please try again in approximately ${remainingHours} hours.` });
        }
      }

    // 2. Check slot existence and capacity
    const slot = await Slot.findById(slot_id);
    if (!slot) return res.status(404).json({ message: "Assessment slot not found" });
    
    if (slot.booked_count >= slot.capacity) {
      return res.status(400).json({ message: "Selected slot is full. Please choose another one." });
    }

    // 3. Create booking
    let slotTemplateId = slot.slot_template_id;
    if (!slotTemplateId) {
      const template = await SlotTemplate.findOne({ venue_id: slot.venue_id, time_slot_id: slot.time_slot_id });
      if (template) slotTemplateId = template._id;
    }

    const doc = await CourseSlotBooking.create({
      register_no,
      student_name: student_name || "",
      course_id,
      course_name,
      slot_id,
      slot_template_id: slotTemplateId, 
      venue_label: venue_label || "",
      time_label: time_label || "",
    });

    // 4. Increment booked count
    slot.booked_count = (slot.booked_count || 0) + 1;
    await slot.save();

    res.status(201).json({
      id: doc._id.toString(),
      course_id: String(doc.course_id),
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
    
    // Only return active (unprocessed) bookings
    const list = await CourseSlotBooking.find({ register_no, processed: { $ne: true } })
      .populate({ 
        path: "slot_id", 
        populate: [
          { path: "venue_id" },
          { path: "time_slot_id" }
        ] 
      })
      .sort({ booked_at: -1 })
      .lean();

    res.json(
      list.map((b) => {
        const slot = b.slot_id;
        const timeSlot = slot?.time_slot_id;
        return {
          id: b._id.toString(),
          course_id: b.course_id,
          course_name: b.course_name,
          venue_label: slot?.venue_id?.name || b.venue_label,
          time_label: timeSlot ? `${timeSlot.startTime} – ${timeSlot.endTime}` : b.time_label,
          startTime: timeSlot?.startTime || "",
          endTime: timeSlot?.endTime || "",
          date: slot?.date,
          booked_at: b.booked_at,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
