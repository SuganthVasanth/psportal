const express = require("express");
const busController = require("../controllers/busController");

const router = express.Router();

router.post("/", busController.createBus);
router.get("/", busController.getBuses);

router.get("/dayscholars", busController.getDayscholars);
router.post("/assign-student", busController.assignStudentToBus);
router.post("/bulk-assign", busController.bulkAssignStudentsToBus);

router.get("/student/:register_no", busController.getStudentBus);
router.get("/incharge/:incharge_id", busController.getBusByIncharge);

router.post("/location", busController.updateBusLocation);
router.get("/location/:busId", busController.getBusLocation);
router.put("/:id", busController.updateBus);
router.delete("/:id", busController.deleteBus);

module.exports = router;

