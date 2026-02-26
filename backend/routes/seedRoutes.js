const express = require("express");
const router = express.Router();
const seedController = require("../controllers/seedController");

router.post("/students", seedController.seedFakeStudents);

module.exports = router;
