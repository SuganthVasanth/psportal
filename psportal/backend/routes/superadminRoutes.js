const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/superadminController");

// Optional: add auth + roleMiddleware("super_admin") later
// const auth = require("../middleware/authMiddleware");
// const roleMiddleware = require("../middleware/roleMiddleware");

// Roles
router.get("/roles", ctrl.getRoles);
router.post("/roles", ctrl.createRole);
router.put("/roles/:id", ctrl.updateRole);

// Users
router.get("/users", ctrl.getUsers);
router.post("/users", ctrl.createUser);
router.put("/users/:id", ctrl.updateUser);

// Admin courses
router.get("/courses", ctrl.getCourses);
router.post("/courses", ctrl.createCourse);
router.put("/courses/:id", ctrl.updateCourse);

// Venues
router.get("/venues", ctrl.getVenues);
router.post("/venues", ctrl.createVenue);
router.put("/venues/:id", ctrl.updateVenue);

// Time slots
router.get("/time-slots", ctrl.getTimeSlots);
router.post("/time-slots", ctrl.createTimeSlot);
router.put("/time-slots/:id", ctrl.updateTimeSlot);

// Slot templates
router.get("/slot-templates", ctrl.getSlotTemplates);
router.post("/slot-templates", ctrl.createSlotTemplate);
router.put("/slot-templates/:id", ctrl.updateSlotTemplate);

// Leave types
router.get("/leave-types", ctrl.getLeaveTypes);
router.post("/leave-types", ctrl.createLeaveType);
router.put("/leave-types/:id", ctrl.updateLeaveType);

// Leave workflows
router.get("/leave-workflows", ctrl.getLeaveWorkflows);
router.post("/leave-workflows", ctrl.createLeaveWorkflow);
router.put("/leave-workflows/:id", ctrl.updateLeaveWorkflow);

// Settings (get all, update by key)
router.get("/settings", ctrl.getSettings);
router.put("/settings", ctrl.updateSettings);

// Faculty course assignments
router.get("/faculty-assignments", ctrl.getFacultyAssignments);
router.post("/faculty-assignments", ctrl.assignFacultyToCourse);
router.delete("/faculty-assignments/:id", ctrl.unassignFacultyFromCourse);

// Question bank submissions (admin list & review)
router.get("/question-bank-submissions", ctrl.getQuestionBankSubmissions);
router.patch("/question-bank-submissions/:id/review", ctrl.reviewQuestionBankSubmission);

module.exports = router;
