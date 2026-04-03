const StudentExamAttempt = require("../models/StudentExamAttempt");
const QuestionBankSubmission = require("../models/QuestionBankSubmission");
const StudentLevelProgress = require("../models/StudentLevelProgress");
const CourseSlotBooking = require("../models/CourseSlotBooking");
const AdminCourse = require("../models/AdminCourse");

/**
 * Grades an assessment attempt and updates the student's level progress status.
 * @param {string} register_no 
 * @param {string} course_id 
 * @param {string} booking_id 
 * @returns {Object} { score, isPassed, message }
 */
async function processAssessmentResult(register_no, course_id, booking_id) {
  try {
    // 1. Get the attempt
    let attempt = await StudentExamAttempt.findOne({ register_no, course_id, booking_id: booking_id?.toString() });
    if (!attempt) {
      attempt = await StudentExamAttempt.findOne({ register_no, course_id }).sort({ submitted_at: -1 });
    }

    // 2. Get correct answers from the Question Bank
    const qb = await QuestionBankSubmission.findOne({ course_id, status: "approved" }).lean();
    
    let isPassed = false;
    let finalScore = 0;

    if (attempt) {
      let totalScore = 0;
      
      // If we have an approved question bank, we can cross-reference
      if (qb && Array.isArray(qb.questions)) {
        const qbMap = {};
        qb.questions.forEach(q => { qbMap[q.questionNumber] = q; });

        if (Array.isArray(attempt.questions)) {
          attempt.questions.forEach(aq => {
            const qInfo = qbMap[aq.questionNumber];
            if (!qInfo) return;

            // If it's a programming question, it likely already has a score from submitAssessmentQuestion
            if (aq.score !== undefined && aq.score > 0) {
              totalScore += aq.score;
            } else {
              // Fallback to MCQ/Text logic
              const expected = qInfo.correctAnswerKey;
              const actual = aq.value;
              if (expected != null && actual != null) {
                if (String(expected).trim().toLowerCase() === String(actual).trim().toLowerCase()) {
                  // For non-programming, what is the score? 
                  // If programming is 50, maybe MCQ is also significant.
                  // But for now, let's say 10 points if not specified.
                  totalScore += 10; 
                }
              }
            }
          });
        }
      }

      // The user wants "score" to determine pass/fail. 
      // If they say "calculated out of 50" for each, 
      // I'll just use the raw summed score.
      finalScore = totalScore;
      isPassed = finalScore >= 50; // Total 50 required to pass
      
      attempt.score = finalScore;
      attempt.isPassed = isPassed;
      await attempt.save();
    }

    // 3. Update Progression
    const activeProgress = await StudentLevelProgress.findOne({ register_no, course_id, status: { $in: ["enrolled", "submitted"] } });
    
    // 4. Recalculate pass if needed based on level configs
    if (activeProgress && attempt) {
      const course = await AdminCourse.findById(course_id).lean();
      const levelIdx = activeProgress.level_index;
      if (course && Array.isArray(course.levels) && course.levels[levelIdx]) {
        const passReq = course.levels[levelIdx].passPercentage || 50;
        isPassed = finalScore >= passReq;
        attempt.isPassed = isPassed;
        await attempt.save();
      }
    }

    if (activeProgress) {
      if (isPassed) {
        activeProgress.status = "completed";
        activeProgress.completed_at = new Date();
        await activeProgress.save();
      } else {
        // If failed or missed, set status to failed and record the time for cooldown
        activeProgress.status = "failed";
        activeProgress.last_failed_at = new Date();
        await activeProgress.save();
      }
    }

    // 4. Mark booking as processed
    if (booking_id) {
      await CourseSlotBooking.updateOne({ _id: booking_id }, { $set: { processed: true } });
    }

    return {
      score: finalScore,
      isPassed,
      message: isPassed ? "Assessment passed! Next level unlocked." : "Assessment failed. Please re-enroll to try again."
    };

  } catch (err) {
    console.error("processAssessmentResult error:", err);
    throw err;
  }
}

module.exports = { processAssessmentResult };
