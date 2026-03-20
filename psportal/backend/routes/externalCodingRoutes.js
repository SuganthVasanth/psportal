const express = require("express");
const externalCodingController = require("../controllers/externalCodingController");

const router = express.Router();

// Fetch platform questions (LeetCode) based on level concepts/topics stored in DB
router.get("/coding-questions", externalCodingController.getCodingQuestionsForLevel);

module.exports = router;

