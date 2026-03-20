const express = require("express");
const codingPracticeController = require("../controllers/codingPracticeController");

const router = express.Router();

router.get("/problems/:level", codingPracticeController.getProblems);
router.get("/problem/:problemId", codingPracticeController.getProblemDetails);
router.get("/testcases/:level/:problemId", codingPracticeController.getTestCases);
router.post("/run", codingPracticeController.run);
router.post("/submit", codingPracticeController.submit);

module.exports = router;
