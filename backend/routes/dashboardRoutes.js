const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// We might want to add a middleware here to verify token/roles later. 
// For now, we'll keep it simple or accept student_id as query for easy testing.
router.get("/student", dashboardController.getStudentDashboardData);
router.get("/my-courses", dashboardController.getMyCourses);

module.exports = router;
