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
      let earned = 0;
      let possible = 0;
      
      // If we have an approved question bank, we can cross-reference
      if (qb && Array.isArray(qb.questions)) {
        const qbMap = {};
        qb.questions.forEach(q => { qbMap[q.questionNumber] = q; });

        if (Array.isArray(attempt.questions)) {
          attempt.questions.forEach(aq => {
            const qInfo = qbMap[aq.questionNumber];
            if (!qInfo) return;

            // 1. Programming question (already scored 0-50 per question)
            if (aq.score !== undefined && aq.score > 0) {
              earned += aq.score;
              possible += 50; 
            } else {
              // 2. Template-based MCQ / Text logic
              const qbVal = qInfo.value || {};
              const studentVal = aq.value || {};
              
              let questionCorrect = true;
              let isGradable = false;

              // Check for template components with options (MCQ)
              Object.keys(qbVal).forEach(k => {
                const qComp = qbVal[k];
                const sComp = studentVal[k];
                // Component has options -> it's an MCQ or similar gradable component
                if (qComp && Array.isArray(qComp.options) && qComp.options.length > 0) {
                  isGradable = true;
                  const correctIdx = qComp.options.findIndex(o => o.correct === true);
                  if (correctIdx !== -1) {
                    // Check if student selected the correct index
                    if (String(sComp?.value) !== String(correctIdx)) {
                      questionCorrect = false;
                    }
                  }
                }
              });

              if (isGradable) {
                possible += 1;
                if (questionCorrect) earned += 1;
              } else {
                // Final fallback: Legacy correctAnswerKey (simple string match)
                const expected = qInfo.correctAnswerKey;
                const actual = typeof aq.value === 'string' ? aq.value : aq.value?.value;
                if (expected != null && actual != null) {
                  possible += 1;
                  if (String(expected).trim().toLowerCase() === String(actual).trim().toLowerCase()) {
                    earned += 1;
                  }
                }
              }
            }
          });
        }
      }

      // Calculate percentage-based final score (0-100)
      finalScore = possible > 0 ? Math.round((earned / possible) * 100) : 0;
      isPassed = false; // Will be determined by level threshold below
      
      attempt.score = finalScore;
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
