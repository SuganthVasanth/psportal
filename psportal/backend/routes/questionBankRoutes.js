const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const questionBankController = require("../controllers/questionBankController");

router.get("/my-tasks", authMiddleware, questionBankController.getMyTasks);
router.post("/", authMiddleware, questionBankController.upsertSubmission);

module.exports = router;
