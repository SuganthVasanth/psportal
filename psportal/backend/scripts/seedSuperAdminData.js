/**
 * Seed sample data for Super Admin Dashboard (roles, users, courses, venues, slots, leave types, workflows, settings).
 * Run from backend: node scripts/seedSuperAdminData.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const Role = require("../models/Role");
const User = require("../models/User");
const AdminCourse = require("../models/AdminCourse");
const Venue = require("../models/Venue");
const TimeSlot = require("../models/TimeSlot");
const SlotTemplate = require("../models/SlotTemplate");
const LeaveType = require("../models/LeaveType");
const LeaveWorkflow = require("../models/LeaveWorkflow");
const AdminSettings = require("../models/AdminSettings");
const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD = "Password@123";

const ROLES = [
  {
    role_name: "Student",
    description: "Can view courses, apply leave",
    accesses: "courses.view, leave.apply",
  },
  {
    role_name: "Mentor",
    description: "Can approve leave, view students",
    // Mentor dashboard permissions
    accesses: [
      "mentees.view",
      "mentees.courses",
      "mentees.reward_points",
      "mentees.activity_points",
      "mentees.leave_approve",
      "mentees.attendance",
    ].join(", "),
  },
  {
    role_name: "Warden",
    description: "Hostel warden approvals",
    // Warden dashboard permissions
    accesses: [
      "ward_students.view",
      "ward_students.room",
      "ward_students.biometric",
      "ward_students.leave_approve",
    ].join(", "),
  },
  {
    role_name: "Hostel Manager",
    description: "Manage hostel and leave flow",
    // Hostel manager dashboard permissions
    accesses: ["hostel.manage"].join(", "),
  },
  {
    role_name: "Security",
    description: "View approved leaves and biometric logs",
    // Security dashboard permissions
    accesses: ["security.leaves"].join(", "),
  },
  {
    role_name: "Admin",
    description: "Manage students and courses",
    accesses: "admin.*",
  },
];

const SAMPLE_USERS = [
  { email: "vidula@example.com", name: "Vidula S", role_name: "Student" },
  { email: "mentor@example.com", name: "Mentor User", role_name: "Mentor" },
  { email: "admin@example.com", name: "Admin User", role_names: ["Admin", "Mentor"] },
];

const SAMPLE_COURSES = [
  { name: "PS Activity 101", description: "Introduction to PS", status: "Active" },
  { name: "Advanced PS", description: "Level 2 course", status: "Active" },
];

const SAMPLE_VENUES = [
  { name: "Hall A", location: "Block 1" },
  { name: "Lab 2", location: "Block 2" },
];

const SAMPLE_TIME_SLOTS = [
  { startTime: "09:00", endTime: "10:30" },
  { startTime: "14:00", endTime: "15:30" },
];

const SAMPLE_LEAVE_TYPES = [
  { type: "Sick Leave", code: "SL" },
  { type: "SP", code: "SP" },
  { type: "OnDuty - Events", code: "OD-E" },
];

const SAMPLE_LEAVE_WORKFLOWS = [
  { leaveType: "Sick Leave", workflow: "Mentor → Warden" },
  { leaveType: "SP", workflow: "Mentor → Warden" },
  { leaveType: "OnDuty - Events", workflow: "Mentor only" },
];

const SETTINGS = [
  { key: "leaveApprovalSteps", value: "mentor, warden, hostel_manager" },
  { key: "coursePoints", value: { activityPoints: "10", rewardPoints: "5", description: "", numLevels: "3", prerequisites: "" } },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected – seeding Super Admin data\n");

    const roleMap = {};

    // 1. Roles (upsert by role_name; don't overwrite system roles)
    console.log("Seeding roles...");
    for (const r of ROLES) {
      const role = await Role.findOneAndUpdate(
        { role_name: r.role_name },
        { $set: { role_name: r.role_name, description: r.description || "", accesses: r.accesses || "", is_system_role: false } },
        { returnDocument: "after", upsert: true }
      );
      roleMap[r.role_name] = role;
      console.log("  ", r.role_name);
    }

    // 2. Sample users with roles (only if not exist)
    console.log("\nSeeding sample users...");
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    for (const u of SAMPLE_USERS) {
      const roleNames = u.role_names || [u.role_name];
      const roleIds = roleNames.map((rn) => roleMap[rn]?._id).filter(Boolean);
      if (roleIds.length === 0) continue;
      await User.findOneAndUpdate(
        { email: u.email },
        { $set: { name: u.name, roles: roleIds }, $setOnInsert: { email: u.email, password: hashedPassword } },
        { upsert: true }
      );
      console.log("  ", u.email);
    }

    // 3. Admin courses
    console.log("\nSeeding admin courses...");
    for (const c of SAMPLE_COURSES) {
      await AdminCourse.findOneAndUpdate(
        { name: c.name },
        { $set: c },
        { upsert: true }
      );
      console.log("  ", c.name);
    }

    // 4. Venues
    console.log("\nSeeding venues...");
    const venueIds = [];
    for (const v of SAMPLE_VENUES) {
      const doc = await Venue.findOneAndUpdate(
        { name: v.name },
        { $set: v },
        { returnDocument: "after", upsert: true }
      );
      venueIds.push(doc._id);
      console.log("  ", v.name);
    }

    // 5. Time slots
    console.log("\nSeeding time slots...");
    const timeSlotIds = [];
    for (const t of SAMPLE_TIME_SLOTS) {
      const doc = await TimeSlot.findOneAndUpdate(
        { startTime: t.startTime, endTime: t.endTime },
        { $set: t },
        { returnDocument: "after", upsert: true }
      );
      timeSlotIds.push(doc._id);
      console.log("  ", t.startTime, "-", t.endTime);
    }

    // 6. Slot templates (venue + time)
    console.log("\nSeeding slot templates...");
    if (venueIds.length >= 2 && timeSlotIds.length >= 2) {
      await SlotTemplate.findOneAndUpdate(
        { venue_id: venueIds[0], time_slot_id: timeSlotIds[0] },
        { venue_id: venueIds[0], time_slot_id: timeSlotIds[0], status: "Active" },
        { upsert: true }
      );
      await SlotTemplate.findOneAndUpdate(
        { venue_id: venueIds[1], time_slot_id: timeSlotIds[1] },
        { venue_id: venueIds[1], time_slot_id: timeSlotIds[1], status: "Active" },
        { upsert: true }
      );
      console.log("  2 slot templates");
    }

    // 7. Leave types
    console.log("\nSeeding leave types...");
    for (const l of SAMPLE_LEAVE_TYPES) {
      await LeaveType.findOneAndUpdate(
        { code: l.code },
        { $set: l },
        { upsert: true }
      );
      console.log("  ", l.code);
    }

    // 8. Leave workflows
    console.log("\nSeeding leave workflows...");
    for (const w of SAMPLE_LEAVE_WORKFLOWS) {
      await LeaveWorkflow.findOneAndUpdate(
        { leaveType: w.leaveType },
        { $set: w },
        { upsert: true }
      );
      console.log("  ", w.leaveType);
    }

    // 9. Settings
    console.log("\nSeeding settings...");
    for (const s of SETTINGS) {
      await AdminSettings.findOneAndUpdate(
        { key: s.key },
        { $set: { value: s.value } },
        { upsert: true }
      );
      console.log("  ", s.key);
    }

    console.log("\n--- Super Admin seed done ---");
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
