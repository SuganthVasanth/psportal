const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/psCourseController");

router.get("/", ctrl.getCourses);
router.post("/", authMiddleware, roleMiddleware("admin", "super_admin"), ctrl.createCourse);
router.put("/:id", authMiddleware, roleMiddleware("admin", "super_admin"), ctrl.updateCourse);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "super_admin"), ctrl.deleteCourse);
router.patch("/bulk-status", authMiddleware, roleMiddleware("admin", "super_admin"), ctrl.bulkUpdateStatus);

module.exports = router;
