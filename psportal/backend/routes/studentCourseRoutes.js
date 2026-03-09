const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/studentCourseController");

router.get("/", ctrl.getAvailableCourses);
router.get("/:id/progress", ctrl.getStudentLevelProgress);
router.get("/:id", ctrl.getCourseById);
router.post("/:id/register-level", ctrl.registerLevel);
router.patch("/:id/complete-level", ctrl.completeLevel);

module.exports = router;
