const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");
const Student = require("../models/Student");
const PointTransaction = require("../models/PointTransaction");
const StudentCourse = require("../models/StudentCourse");
const Leave = require("../models/Leave");

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

exports.seedFakeStudents = async (req, res) => {
  try {
    let studentRole = await Role.findOne({ role_name: /student/i });
    if (!studentRole) {
      studentRole = await Role.create({ role_name: "student", description: "Default student role", is_system_role: true });
    }
    const roleId = studentRole._id;
    const hashedPassword = await bcrypt.hash(FAKE_PASSWORD, 10);

    const created = [];

    for (const s of FAKE_STUDENTS) {
      const user = await User.findOneAndUpdate(
        { email: s.email },
        { $set: { name: s.name, password: hashedPassword, roles: [roleId] } },
        { returnDocument: "after", upsert: true, runValidators: true }
      );
      const userId = user._id;

      await Student.deleteMany({ register_no: s.register_no });
      const studentDoc = await Student.create({
        _id: "S_" + s.register_no,
        user_id: userId,
        name: s.name,
        register_no: s.register_no,
        profile_pic: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(s.register_no),
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

      await Leave.deleteMany({ register_no: s.register_no });
      const leaveDocs = [
        { register_no: s.register_no, student_name: s.name, leaveType: "Sick Leave", type: "Leave", fromDate: new Date("2026-01-10"), toDate: new Date("2026-01-11"), remarks: "Medical", parentStatus: "Approved", status: "Completed" },
        { register_no: s.register_no, student_name: s.name, leaveType: "GP", type: "Leave", fromDate: new Date("2026-02-20"), toDate: new Date("2026-02-22"), remarks: "Personal", parentStatus: "Pending", status: "Pending" },
      ];
      await Leave.insertMany(leaveDocs);

      created.push({
        register_no: s.register_no,
        name: s.name,
        email: s.email,
        activity_points: s.activity_points,
        courses: s.courseIds.length,
        completed: s.completedIds.length,
      });
    }

    res.status(200).json({
      message: "Fake students pushed to MongoDB",
      count: created.length,
      students: created,
      loginPassword: FAKE_PASSWORD,
    });
  } catch (err) {
    console.error("Seed students error:", err);
    res.status(500).json({ message: err.message || "Seed failed" });
  }
};
