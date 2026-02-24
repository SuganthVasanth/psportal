const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createRole,
  assignRole
} = require("../controllers/roleController");

// Only super_admin can create roles
router.post(
  "/create-role",
  auth,
  roleMiddleware("super_admin"),
  createRole
);

// Admin + super_admin can assign roles
router.post(
  "/assign-role",
  auth,
  roleMiddleware("super_admin", "admin"),
  assignRole
);

module.exports = router;