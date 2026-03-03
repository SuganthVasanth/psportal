const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const messageController = require("../controllers/messageController");

router.get("/", authMiddleware, messageController.getMessages);
router.post("/", authMiddleware, messageController.sendMessage);

module.exports = router;
