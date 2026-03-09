/**
 * Map a student (by email) to a mentor/staff (by email).
 * For now: run manually. Later, student–mentor and student–warden mapping will be done by admin.
 *
 * Run from backend: node scripts/mapStudentToMentor.js
 *
 * Example: map svidula2005@gmail.com (student) → vasunthara.ec23@bitsathy.ac.in (mentor)
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const User = require("../models/User");
const Role = require("../models/Role");
const Student = require("../models/Student");

const STUDENT_EMAIL = "svidula2005@gmail.com";
const MENTOR_EMAIL = "vasunthara.ec23@bitsathy.ac.in";

const MENTOR_ACCESSES = "mentees.view, mentees.leave_approve, mentees.courses, mentees.attendance";
const DEFAULT_PASSWORD = "Password@123";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    // 1. Ensure Mentor role exists with correct accesses (for staff dashboard)
    let mentorRole = await Role.findOne({ role_name: /^Mentor$/i });
    if (!mentorRole) {
      mentorRole = await Role.create({
        role_name: "Mentor",
        description: "Mentor – view mentees, approve leave",
        is_system_role: false,
        accesses: MENTOR_ACCESSES,
      });
      console.log("Created role: Mentor");
    } else if (!mentorRole.accesses || !mentorRole.accesses.includes("mentees.")) {
      mentorRole.accesses = MENTOR_ACCESSES;
      await mentorRole.save();
      console.log("Updated Mentor role accesses.");
    }

    // 2. Find or create staff user (mentor)
    let mentorUser = await User.findOne({ email: MENTOR_EMAIL }).lean();
    if (!mentorUser) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      const name = MENTOR_EMAIL.split("@")[0].replace(/\./g, " ");
      mentorUser = await User.create({
        email: MENTOR_EMAIL,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        password: hashedPassword,
        roles: [mentorRole._id],
      });
      mentorUser = mentorUser.toObject();
      console.log("Created staff user:", MENTOR_EMAIL, "(Mentor). Default password:", DEFAULT_PASSWORD);
    } else {
      const hasRole = await User.findById(mentorUser._id).populate("roles").lean();
      const roleIds = (hasRole.roles || []).map((r) => r._id?.toString?.()).filter(Boolean);
      const mentorRoleId = mentorRole._id.toString();
      if (!roleIds.includes(mentorRoleId)) {
        await User.findByIdAndUpdate(mentorUser._id, { $addToSet: { roles: mentorRole._id } });
        console.log("Assigned Mentor role to", MENTOR_EMAIL);
      }
    }
    const mentorId = mentorUser._id;

    // 3. Find student user and Student record; set mentor_id
    const studentUser = await User.findOne({ email: STUDENT_EMAIL }).lean();
    if (!studentUser) {
      console.error("Student user not found:", STUDENT_EMAIL);
      process.exit(1);
    }

    let student = await Student.findOne({ user_id: studentUser._id });
    if (!student) {
      const registerNo = "7376231CS321";
      student = await Student.create({
        _id: "S_" + registerNo,
        user_id: studentUser._id,
        name: studentUser.name || "S Vidula",
        register_no: registerNo,
        mentor_id: mentorId,
        department: "Computer Science and Engineering",
        type: "dayscholar",
      });
      console.log("Created Student:", student.register_no, "(", student.name, ") and set mentor:", MENTOR_EMAIL);
    } else {
      student.mentor_id = mentorId;
      await student.save();
      console.log("Mapped student", STUDENT_EMAIL, "→ mentor", MENTOR_EMAIL, "(", student.register_no, ")");
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
