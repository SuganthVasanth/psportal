const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController");

router.post("/", templateController.create);
router.get("/", templateController.getAll);
router.get("/:id", templateController.getById);
router.put("/:id", templateController.update);
router.delete("/:id", templateController.remove);

module.exports = router;
