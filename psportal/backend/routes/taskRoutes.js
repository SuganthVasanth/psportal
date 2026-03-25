const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.get("/classrooms", taskController.getClassroomSummaries);
router.get("/classrooms/:taskId/students", taskController.getClassroomStudents);
router.post("/:taskId/register", taskController.registerForTask);

module.exports = router;

