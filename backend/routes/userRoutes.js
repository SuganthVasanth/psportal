const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const { getAllUsers } = require("../controllers/userController");

// Only super_admin can view all users
router.get(
    "/",
    auth,
    roleMiddleware("super_admin"),
    getAllUsers
);

module.exports = router;
