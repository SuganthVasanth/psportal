const express = require("express");
const practiceController = require("../controllers/practiceController");

const router = express.Router();

router.get("/courses", practiceController.getCourses);
router.get("/courses/:courseId/levels", practiceController.getLevels);
router.get("/problems", practiceController.getProblems);
router.get("/problems/:problemId", practiceController.getProblem);
router.get("/daily-task", practiceController.getDailyTask);
router.get("/streak", practiceController.getStreak);
router.get("/submissions", practiceController.getSubmissions);
router.post("/submit", practiceController.submit);
router.get("/leaderboard", practiceController.getLeaderboard);
router.get("/dashboard", practiceController.getDashboard);

module.exports = router;
