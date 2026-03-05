const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/leave-types", leaveController.getActiveLeaveTypes);
router.get("/my-leaves", leaveController.getMyLeaves);
router.post("/apply", leaveController.applyLeave);
router.delete("/:id", leaveController.deleteLeave);
router.patch("/:id/mentor-approval", authMiddleware, leaveController.mentorApproval);
router.patch("/:id/warden-approval", authMiddleware, leaveController.wardenApproval);

module.exports = router;
