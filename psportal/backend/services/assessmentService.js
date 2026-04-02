const StudentExamAttempt = require("../models/StudentExamAttempt");
const QuestionBankSubmission = require("../models/QuestionBankSubmission");
const StudentLevelProgress = require("../models/StudentLevelProgress");
const CourseSlotBooking = require("../models/CourseSlotBooking");

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

    if (attempt && qb && Array.isArray(qb.questions) && qb.questions.length > 0) {
      let correctCount = 0;
      const totalQuestions = qb.questions.length;
      
      const correctAnswersMap = {};
      qb.questions.forEach(q => {
        correctAnswersMap[q.questionNumber] = q.correctAnswerKey;
      });

      if (Array.isArray(attempt.questions)) {
        attempt.questions.forEach(aq => {
          const expected = correctAnswersMap[aq.questionNumber];
          const actual = aq.value;
          if (expected != null && actual != null) {
            if (String(expected).trim().toLowerCase() === String(actual).trim().toLowerCase()) {
              correctCount++;
            }
          }
        });
      }

      finalScore = (correctCount / totalQuestions) * 100;
      isPassed = finalScore >= 50; 
      
      attempt.score = finalScore;
      attempt.isPassed = isPassed;
      await attempt.save();
    }

    // 3. Update Progression
    const activeProgress = await StudentLevelProgress.findOne({ register_no, course_id, status: { $in: ["enrolled", "submitted"] } });
    
    if (activeProgress) {
      if (isPassed) {
        activeProgress.status = "completed";
        activeProgress.completed_at = new Date();
        await activeProgress.save();
      } else {
        // If failed or missed, remove the enrollment to allow retry
        await StudentLevelProgress.deleteOne({ _id: activeProgress._id });
        // Also remove the specific booking if it exists
        if (booking_id) {
          await CourseSlotBooking.deleteOne({ _id: booking_id });
        }
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
