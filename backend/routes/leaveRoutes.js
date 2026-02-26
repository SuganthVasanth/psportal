const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");

router.get("/my-leaves", leaveController.getMyLeaves);
router.post("/apply", leaveController.applyLeave);
router.delete("/:id", leaveController.deleteLeave);

module.exports = router;
