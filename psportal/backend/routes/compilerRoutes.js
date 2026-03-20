const express = require("express");
const compilerController = require("../controllers/compilerController");

const router = express.Router();

router.post("/run", compilerController.run);

module.exports = router;
