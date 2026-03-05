/**
 * Map a student (by email) to a warden/staff (by email).
 * For now: run manually. Later, student–warden mapping will be done by admin.
 *
 * Run from backend: node scripts/mapStudentToWarden.js
 *
 * Example: assign vasunthara.ec23@bitsathy.ac.in as warden to svidula2005@gmail.com
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const User = require("../models/User");
const Role = require("../models/Role");
const Student = require("../models/Student");

const STUDENT_EMAIL = "svidula2005@gmail.com";
const WARDEN_EMAIL = "vasunthara.ec23@bitsathy.ac.in";

const WARDEN_ACCESSES = "ward_students.view, ward_students.leave_approve, ward_students.room, ward_students.biometric";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    // 1. Ensure Warden role exists with correct accesses
    let wardenRole = await Role.findOne({ role_name: /^Warden$/i });
    if (!wardenRole) {
      wardenRole = await Role.create({
        role_name: "Warden",
        description: "Warden – view wards, approve leave",
        is_system_role: false,
        accesses: WARDEN_ACCESSES,
      });
      console.log("Created role: Warden");
    } else if (!wardenRole.accesses || !wardenRole.accesses.includes("ward_students.")) {
      wardenRole.accesses = WARDEN_ACCESSES;
      await wardenRole.save();
      console.log("Updated Warden role accesses.");
    }

    // 2. Find staff user (warden)
    const wardenUser = await User.findOne({ email: WARDEN_EMAIL }).lean();
    if (!wardenUser) {
      console.error("Warden user not found:", WARDEN_EMAIL, "- Create this user first (e.g. run mapStudentToMentor.js).");
      process.exit(1);
    }
    const wardenId = wardenUser._id;

    // Assign Warden role if not already
    const userWithRoles = await User.findById(wardenId).populate("roles").lean();
    const roleIds = (userWithRoles.roles || []).map((r) => r._id?.toString?.()).filter(Boolean);
    const wardenRoleId = wardenRole._id.toString();
    if (!roleIds.includes(wardenRoleId)) {
      await User.findByIdAndUpdate(wardenId, { $addToSet: { roles: wardenRole._id } });
      console.log("Assigned Warden role to", WARDEN_EMAIL);
    }

    // 3. Find student and set warden_id
    const studentUser = await User.findOne({ email: STUDENT_EMAIL }).lean();
    if (!studentUser) {
      console.error("Student user not found:", STUDENT_EMAIL);
      process.exit(1);
    }

    const student = await Student.findOne({ user_id: studentUser._id });
    if (!student) {
      console.error("Student record not found for", STUDENT_EMAIL, "- Create student first (e.g. run mapStudentToMentor.js).");
      process.exit(1);
    }

    student.warden_id = wardenId;
    await student.save();
    console.log("Assigned warden", WARDEN_EMAIL, "to student", STUDENT_EMAIL, "(", student.register_no, ")");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
