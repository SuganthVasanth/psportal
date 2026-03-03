/**
 * Seed 5 fake students with their own courses, activity points, and completed courses.
 * Run from backend: node scripts/seedFakeStudents.js
 *
 * Login (email / password):
 *   student1@test.com ... student5@test.com  /  password123
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/User");
const Role = require("../models/Role");
const Student = require("../models/Student");
const PointTransaction = require("../models/PointTransaction");
const StudentCourse = require("../models/StudentCourse");

const FAKE_PASSWORD = "password123";

const COURSES_POOL = [
  { id: "1", title: "Placement Pre Assessment - Feb 2026 IT", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400" },
  { id: "2", title: "Logical Reasoning - 1A", image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400" },
  { id: "3", title: "Programming Java Level - 4", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400" },
  { id: "4", title: "Programming C++ - Level 3", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400" },
  { id: "5", title: "Construction management - Level 0", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400" },
  { id: "6", title: "New Product Development and Innovations - Level 1D", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400" },
];

const FAKE_STUDENTS = [
  { register_no: "7376231CS001", name: "Priya M", email: "student1@test.com", activity_points: 5200, courseIds: ["1", "2", "3"], completedIds: ["1", "2"] },
  { register_no: "7376231CS002", name: "Arjun K", email: "student2@test.com", activity_points: 8100, courseIds: ["2", "3", "4", "5"], completedIds: ["2", "3"] },
  { register_no: "7376231CS003", name: "Sneha R", email: "student3@test.com", activity_points: 12300, courseIds: ["1", "3", "5", "6"], completedIds: ["1"] },
  { register_no: "7376231CS004", name: "Vikram S", email: "student4@test.com", activity_points: 4500, courseIds: ["1", "2", "4", "6"], completedIds: ["1", "2", "4"] },
  { register_no: "7376231CS005", name: "Ananya T", email: "student5@test.com", activity_points: 9800, courseIds: ["3", "4", "5", "6"], completedIds: ["3", "4"] },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected\n");

    let studentRole = await Role.findOne({ role_name: /student/i });
    if (!studentRole) {
      studentRole = await Role.create({ role_name: "student", description: "Default student role", is_system_role: true });
      console.log("Created role: student");
    }
    const roleId = studentRole._id;

    const hashedPassword = await bcrypt.hash(FAKE_PASSWORD, 10);

    for (const s of FAKE_STUDENTS) {
      const user = await User.findOneAndUpdate(
        { email: s.email },
        { $set: { name: s.name, password: hashedPassword, roles: [roleId] } },
        { returnDocument: "after", upsert: true, runValidators: true }
      ).select("+password");
      const userId = user._id;

      await Student.deleteMany({ register_no: s.register_no });
      const studentDoc = await Student.create({
        _id: "S_" + s.register_no,
        user_id: userId,
        name: s.name,
        register_no: s.register_no,
        profile_pic: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
        activity_points: s.activity_points,
        department: "Computer Science and Engineering",
        type: "dayscholar",
      });

      await PointTransaction.deleteMany({ student_id: studentDoc._id });
      const pts = [
        { student_id: studentDoc._id, activity_category: "Personalized Skills - Technical", activity_title: "C Programming Level - 1", points_earned: 300, date_earned: new Date() },
        { student_id: studentDoc._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Java Level - 2", points_earned: 600, date_earned: new Date() },
        { student_id: studentDoc._id, activity_category: "T&P Training", activity_title: "Placement Training", points_earned: 500, date_earned: new Date() },
        { student_id: studentDoc._id, activity_category: "Certification Courses", activity_title: "Course Completion", points_earned: Math.max(0, s.activity_points - 1400), date_earned: new Date() },
      ];
      const sum = pts.reduce((a, t) => a + t.points_earned, 0);
      if (sum !== s.activity_points) {
        pts[pts.length - 1].points_earned += (s.activity_points - sum);
      }
      await PointTransaction.insertMany(pts);

      await StudentCourse.deleteMany({ register_no: s.register_no });
      const courseDocs = s.courseIds.map((cid) => {
        const c = COURSES_POOL.find((p) => p.id === cid);
        return {
          register_no: s.register_no,
          course_id: cid,
          title: c ? c.title : "Course " + cid,
          image: c ? c.image : "",
          completed: (s.completedIds || []).includes(cid),
        };
      });
      await StudentCourse.insertMany(courseDocs);

      console.log("  ", s.email, "→", s.register_no, s.name, "| points:", s.activity_points, "| courses:", s.courseIds.length, "| completed:", s.completedIds.length);
    }

    console.log("\n--- Fake student logins (no real email needed) ---");
    console.log("Email                 | Password     | Register No    | Name");
    console.log("---------------------|--------------|----------------|----------");
    FAKE_STUDENTS.forEach((s) => {
      console.log(`${s.email.padEnd(20)} | ${FAKE_PASSWORD.padEnd(12)} | ${s.register_no.padEnd(14)} | ${s.name}`);
    });
    console.log("\nDone. Use these to login and see per-student My Courses, activity points, and completed courses.");
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
