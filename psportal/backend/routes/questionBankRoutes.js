const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const questionBankController = require("../controllers/questionBankController");

router.get("/my-tasks", authMiddleware, questionBankController.getMyTasks);
router.post("/", authMiddleware, questionBankController.upsertSubmission);

// Student: get approved questions for course (no auth so student can load exam)
router.get("/approved-for-course/:courseId", questionBankController.getApprovedQuestionsForCourse);
// Student: run code against visible testcases
router.post("/run-code", questionBankController.runAssessmentCode);
// Student: submit individual question for grading
router.post("/submit-question", questionBankController.submitAssessmentQuestion);

module.exports = router;
