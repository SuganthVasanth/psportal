const User = require("../models/User");

// @desc    Get all users with their roles
// @route   GET /api/users
// @access  Private (super_admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate("roles");
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error fetching users" });
    }
};

module.exports = {
    getAllUsers,
};
