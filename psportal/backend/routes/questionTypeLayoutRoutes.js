const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const questionTypeLayoutController = require("../controllers/questionTypeLayoutController");

router.get("/", authMiddleware, questionTypeLayoutController.list);
router.get("/:questionType", authMiddleware, questionTypeLayoutController.getByType);
router.post("/", authMiddleware, questionTypeLayoutController.create);
router.put("/:id", authMiddleware, questionTypeLayoutController.update);
router.delete("/:id", authMiddleware, questionTypeLayoutController.remove);

module.exports = router;
