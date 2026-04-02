const cron = require("node-cron");
const CourseSlotBooking = require("../models/CourseSlotBooking");
const StudentExamAttempt = require("../models/StudentExamAttempt");
const QuestionBankSubmission = require("../models/QuestionBankSubmission");
const StudentLevelProgress = require("../models/StudentLevelProgress");

const { processAssessmentResult } = require("./assessmentService");

// Runs every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    // console.log("[Cron] Checking for expired assessment slots...");
    const now = new Date();
    
    // Find unprocessed bookings. Populate slot_id and time_slot_id to access endTime and date
    const pendingBookings = await CourseSlotBooking.find({ processed: { $ne: true } })
      .populate({
        path: "slot_id",
        populate: { path: "time_slot_id" }
      });

    for (const booking of pendingBookings) {
      const slot = booking.slot_id;
      if (!slot) {
        // Orphaned booking, just mark processed
        booking.processed = true;
        await booking.save();
        continue;
      }
      const timeSlot = slot.time_slot_id;
      if (!timeSlot || !slot.date) {
        booking.processed = true;
        await booking.save();
        continue;
      }

      // Calculate exact end time
      const endTimeStr = timeSlot.endTime || "23:59";
      const [hours, minutes] = endTimeStr.split(":").map(Number);
      
      const slotEndDate = new Date(slot.date);
      slotEndDate.setHours(hours, minutes, 0, 0);

      // Add a 5 minute grace period after slot end before processing
      const gracePeriodMs = 5 * 60 * 1000;
      
      if (now.getTime() > (slotEndDate.getTime() + gracePeriodMs)) {
        console.log(`[Cron] Processing expired booking ${booking._id} for ${booking.register_no}`);
        await processAssessmentResult(booking.register_no, booking.course_id, booking._id);
      }
    }
  } catch (err) {
    console.error("[Cron Error] processing expired slots:", err);
  }
});

async function processExpiredBooking(booking) {
  // Deprecated: replaced by processAssessmentResult in assessmentService
  return processAssessmentResult(booking.register_no, booking.course_id, booking._id);
}

module.exports = { processExpiredBooking };


module.exports = { processExpiredBooking };
