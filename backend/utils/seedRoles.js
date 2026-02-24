// const Role = require("../models/Role");

// const seedRoles = async () => {
//   const roles = [
//     { name: "super_admin", isSystem: true },
//     { name: "admin", isSystem: true },
//     { name: "student", isSystem: true }
//   ];

//   for (let role of roles) {
//     const exists = await Role.findOne({ name: role.name });
//     if (!exists) {
//       await Role.create(role);
//     }
//   }
// };

// module.exports = seedRoles;
const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Role = require("../models/Role");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");

  const roles = [
    {
      role_name: "super_admin",
      description: "Full system access",
      is_system_role: true
    },
    {
      role_name: "admin",
      description: "Manage students and courses",
      is_system_role: true
    },
    {
      role_name: "student",
      description: "Default student role",
      is_system_role: true
    }
  ];

  for (let role of roles) {
    await Role.updateOne(
      { role_name: role.role_name },
      role,
      { upsert: true }
    );
  }

  console.log("Roles seeded successfully");
  process.exit();
}

seed();