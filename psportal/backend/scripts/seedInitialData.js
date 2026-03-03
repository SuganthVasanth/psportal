/**
 * Seed roles and initial users into MongoDB.
 * Run from backend: node scripts/seedInitialData.js
 *
 * Users:
 *   vidulasanjana.ec23@bitsathy.ac.in  → admin
 *   svidula2005@gmail.com              → student
 *   vidula2005@gmail.com               → student
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const User = require("../models/User");
const Role = require("../models/Role");

const DEFAULT_PASSWORD = "Password@123";

const ROLES = [
  { role_name: "super_admin", description: "Full system access", is_system_role: true },
  { role_name: "admin", description: "Manage students and courses", is_system_role: true },
  { role_name: "student", description: "Default student role", is_system_role: true },
];

const USERS = [
  { email: "vidulasanjana.ec23@bitsathy.ac.in", role_name: "admin", name: "Vidula Sanjana" },
  { email: "svidula2005@gmail.com", role_name: "student", name: "S Vidula" },
  { email: "vidula2005@gmail.com", role_name: "student", name: "Vidula" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected\n");

    // 1. Seed roles
    console.log("Seeding roles...");
    const roleMap = {};
    for (const r of ROLES) {
      const role = await Role.findOneAndUpdate(
        { role_name: r.role_name },
        { $set: r },
        { returnDocument: "after", upsert: true }
      );
      roleMap[r.role_name] = role;
      console.log("  ", r.role_name);
    }

    // 2. Seed users with roles and default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log("\nSeeding users...");

    for (const u of USERS) {
      const role = roleMap[u.role_name];
      if (!role) throw new Error(`Role ${u.role_name} not found`);

      const update = {
        name: u.name,
        password: hashedPassword,
        roles: [role._id],
      };

      const user = await User.findOneAndUpdate(
        { email: u.email },
        { $set: update },
        { returnDocument: "after", upsert: true, runValidators: true }
      );
      console.log("  ", u.email, "→", u.role_name);
    }

    console.log("\n--- Summary ---");
    console.log("Email                              | Role        | Password (change after first login)");
    console.log("-----------------------------------|-------------|------------------");
    USERS.forEach((u) => {
      console.log(`${u.email.padEnd(34)} | ${u.role_name.padEnd(11)} | ${DEFAULT_PASSWORD}`);
    });
    console.log("\nDone. You can login with email + password (POST /api/auth/login) or with Google.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

seed();
