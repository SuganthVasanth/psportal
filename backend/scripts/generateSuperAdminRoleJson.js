/**
 * Generate the super_admin role as a complete JSON document for MongoDB.
 * Run: node scripts/generateSuperAdminRoleJson.js
 *
 * Usage:
 *   node scripts/generateSuperAdminRoleJson.js           # print to stdout
 *   node scripts/generateSuperAdminRoleJson.js --file    # write to data/superadmin-role.json
 */

const fs = require("fs");
const path = require("path");

const SUPER_ADMIN_ROLE = {
  _id: { $oid: "674000000000000000000001" },
  role_name: "super_admin",
  description:
    "Full system access. Can manage all users, roles, courses, slots, movement passes, and dashboard data.",
  is_system_role: true,
};

const jsonString = JSON.stringify(SUPER_ADMIN_ROLE, null, 2);

if (process.argv.includes("--file")) {
  const outDir = path.join(__dirname, "..", "data");
  const outPath = path.join(outDir, "superadmin-role.json");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outPath, jsonString, "utf8");
  console.log("Written to:", outPath);
} else {
  console.log(jsonString);
}
