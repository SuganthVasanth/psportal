const cron = require("node-cron");
const CourseSlotBooking = require("../models/CourseSlotBooking");
const StudentExamAttempt = require("../models/StudentExamAttempt");
const QuestionBankSubmission = require("../models/QuestionBankSubmission");
const StudentLevelProgress = require("../models/StudentLevelProgress");

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
      if (!slot) continue;
      const timeSlot = slot.time_slot_id;
      if (!timeSlot || !slot.date) continue;

      // Calculate exact end time
      const endTimeStr = timeSlot.endTime || "23:59";
      const [hours, minutes] = endTimeStr.split(":").map(Number);
      
      const slotEndDate = new Date(slot.date);
      slotEndDate.setHours(hours, minutes, 0, 0);

      // Add a 5 minute grace period after slot end before processing
      const gracePeriodMs = 5 * 60 * 1000;
      
      if (now.getTime() > (slotEndDate.getTime() + gracePeriodMs)) {
        await processExpiredBooking(booking);
      }
    }
  } catch (err) {
    console.error("[Cron Error] processing expired slots:", err);
  }
});

async function processExpiredBooking(booking) {
  try {
    const { register_no, course_id, _id: booking_id } = booking;

    // 1. Get the attempt
    // In questionBankController, booking_id could be passed. We check both booking_id or just register_no + course_id
    let attempt = await StudentExamAttempt.findOne({ register_no, course_id, booking_id: booking_id.toString() });
    if (!attempt) {
       // Fallback in case the frontend didn't send booking_id but sent early
       attempt = await StudentExamAttempt.findOne({ register_no, course_id }).sort({ submitted_at: -1 });
    }

    // 2. Get correct answers from the Question Bank
    const qb = await QuestionBankSubmission.findOne({ course_id, status: "approved" }).lean();
    
    let isPassed = false;
    let finalScore = 0;

    if (attempt && qb && Array.isArray(qb.questions) && qb.questions.length > 0) {
      let correctCount = 0;
      const totalQuestions = qb.questions.length;
      
      // Map correct answers
      const correctAnswersMap = {};
      qb.questions.forEach(q => {
        correctAnswersMap[q.questionNumber] = q.correctAnswerKey;
      });

      // Grade attempt
      if (Array.isArray(attempt.questions)) {
        attempt.questions.forEach(aq => {
          const expected = correctAnswersMap[aq.questionNumber];
          const actual = aq.value;
          
          if (expected && actual) {
            // Compare string values directly (simplistic approach)
            if (String(expected).trim().toLowerCase() === String(actual).trim().toLowerCase()) {
              correctCount++;
            }
          }
        });
      }

      finalScore = (correctCount / totalQuestions) * 100;
      isPassed = finalScore >= 50; // 50% pass mark assumption
      
      // Update attempt
      attempt.score = finalScore;
      attempt.isPassed = isPassed;
      await attempt.save();
    }

    // 3. Update StudentLevelProgress
    // We assume there's one active 'enrolled' progress for this course_id.
    const activeProgress = await StudentLevelProgress.findOne({ register_no, course_id, status: "enrolled" });
    
    if (activeProgress) {
      if (isPassed) {
        // Mark completed 
        activeProgress.status = "completed";
        activeProgress.completed_at = new Date();
        await activeProgress.save();
        console.log(`[Cron] Student ${register_no} passed course ${course_id} with score ${finalScore}. Marked Level ${activeProgress.level_index} completed.`);
      } else {
        // Delete to cancel enrollment and allow re-registration
        await StudentLevelProgress.deleteOne({ _id: activeProgress._id });
        console.log(`[Cron] Student ${register_no} failed/missed course ${course_id} with score ${finalScore}. Canceled Level ${activeProgress.level_index} enrollment.`);
      }
    }

    // 4. Mark booking as processed
    booking.processed = true;
    await booking.save();

  } catch (err) {
    console.error(`[Cron Error] Failed to process booking ${booking._id}:`, err);
  }
}

module.exports = { processExpiredBooking };
