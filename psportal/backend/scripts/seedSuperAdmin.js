/**
 * Creates a super admin account for PS Portal.
 * Run: node scripts/seedSuperAdmin.js (from backend folder)
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const User = require("../models/User");
const Role = require("../models/Role");

const SUPER_ADMIN_EMAIL = "superadmin@psportal.local";
const SUPER_ADMIN_PASSWORD = "SuperAdmin@123";
const SUPER_ADMIN_NAME = "Super Admin";

async function seedSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    let superAdminRole = await Role.findOne({ role_name: "super_admin" });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        role_name: "super_admin",
        description: "Full system access",
        is_system_role: true,
      });
      console.log("Created super_admin role");
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    let user = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (user) {
      user.password = hashedPassword;
      user.name = SUPER_ADMIN_NAME;
      if (!user.roles.some((r) => r.toString() === superAdminRole._id.toString())) {
        user.roles.push(superAdminRole._id);
      }
      await user.save();
      console.log("Updated existing super admin user");
    } else {
      user = await User.create({
        name: SUPER_ADMIN_NAME,
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        roles: [superAdminRole._id],
      });
      console.log("Created super admin user");
    }

    console.log("\n--- Super Admin Credentials ---");
    console.log("Email (username):", SUPER_ADMIN_EMAIL);
    console.log("Password:", SUPER_ADMIN_PASSWORD);
    console.log("-------------------------------\n");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

seedSuperAdmin();
