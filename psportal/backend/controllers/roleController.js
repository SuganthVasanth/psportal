const User = require("../models/User");
const Role = require("../models/Role");

// Create new role
exports.createRole = async (req, res) => {
  try {
    const { role_name, description } = req.body;

    if (!role_name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Default system role is false
    const role = await Role.create({
      role_name,
      description,
      is_system_role: false
    });

    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    console.error("Error creating role:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Role already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Assign role by email
exports.assignRole = async (req, res) => {
  try {
    const { email, role_name } = req.body;

    if (!email || !role_name) {
      return res.status(400).json({ message: "Email and role name are required" });
    }

    let user = await User.findOne({ email });
    const role = await Role.findOne({ role_name });

    if (!role) {
      return res.status(404).json({ message: `Role '${role_name}' not found` });
    }

    if (!user) {
      // Create a placeholder user entry with just their email and pre-assigned role
      user = await User.create({ email, roles: [role._id] });
      return res.json({ message: `Placeholder profile created. Role '${role_name}' assigned to ${email} successfully` });
    }

    // Check if user already has the role
    if (user.roles && user.roles.includes(role._id)) {
      return res.status(400).json({ message: "User already has this role" });
    }

    // Add role to user
    if (!user.roles) {
      user.roles = [];
    }
    user.roles.push(role._id);
    await user.save();

    res.json({ message: `Role '${role_name}' assigned to ${email} successfully` });
  } catch (error) {
    console.error("Error assigning role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
