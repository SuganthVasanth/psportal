const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const ctrl = require("../controllers/enrollmentController");

router.post("/", authMiddleware, ctrl.enroll);
router.get("/my", authMiddleware, ctrl.getMyEnrollments);

module.exports = router;
