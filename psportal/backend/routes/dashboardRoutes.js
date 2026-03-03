const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/student", dashboardController.getStudentDashboardData);
router.get("/my-courses", dashboardController.getMyCourses);

// Role-based user dashboard (mentor, warden, technical faculty) — requires auth
router.get("/me", authMiddleware, dashboardController.getDashboardMe);

module.exports = router;
