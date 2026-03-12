const Role = require("../models/Role");
const User = require("../models/User");
const AdminCourse = require("../models/AdminCourse");
const FacultyCourseAssignment = require("../models/FacultyCourseAssignment");
const QuestionBankSubmission = require("../models/QuestionBankSubmission");
const Venue = require("../models/Venue");
const TimeSlot = require("../models/TimeSlot");
const SlotTemplate = require("../models/SlotTemplate");
const LeaveType = require("../models/LeaveType");
const LeaveWorkflow = require("../models/LeaveWorkflow");
const AdminSettings = require("../models/AdminSettings");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD = "Password@123";

// ——— Roles ———
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().lean();
    res.json(roles.map((r) => ({ id: r._id.toString(), role: r.role_name, description: r.description || "", accesses: r.accesses || "" })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { role, description, accesses } = req.body;
    const doc = await Role.create({ role_name: role || "New Role", description: description || "", accesses: accesses || "" });
    res.status(201).json({ id: doc._id.toString(), role: doc.role_name, description: doc.description, accesses: doc.accesses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role, description, accesses } = req.body;
    const doc = await Role.findByIdAndUpdate(req.params.id, { role_name: role, description, accesses }, { returnDocument: 'after' });
    if (!doc) return res.status(404).json({ message: "Role not found" });
    res.json({ id: doc._id.toString(), role: doc.role_name, description: doc.description, accesses: doc.accesses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Users (with roles) ———
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("roles").lean();
    res.json(
      users.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name || "",
        roles: (u.roles || []).map((r) => r.role_name),
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, name, roles } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const roleDocs = await Role.find({ role_name: { $in: roles || [] } });
    const roleIds = roleDocs.map((r) => r._id);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const doc = await User.create({ email, name: name || "", password: hashedPassword, roles: roleIds });
    res.status(201).json({ id: doc._id.toString(), email: doc.email, name: doc.name, roles: roles || [] });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Email already exists" });
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { email, name, roles } = req.body;
    const roleDocs = await Role.find({ role_name: { $in: roles || [] } });
    const roleIds = roleDocs.map((r) => r._id);
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { email: email || undefined, name: name !== undefined ? name : undefined, roles: roleIds },
      { returnDocument: 'after' }
    ).populate("roles");
    if (!doc) return res.status(404).json({ message: "User not found" });
    res.json({ id: doc._id.toString(), email: doc.email, name: doc.name, roles: (doc.roles || []).map((r) => r.role_name) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Admin courses ———
exports.getCourses = async (req, res) => {
  try {
    const list = await AdminCourse.find().lean();
    res.json(
      list.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.description || "",
        status: c.status || "Active",
        type: c.type || "",
        course_logo: c.course_logo || "",
        level: c.level || "",
        activityPoints: c.activity_points ?? 0,
        rewardPoints: c.reward_points ?? 0,
        faculty: c.faculty || "",
        levels: Array.isArray(c.levels) ? c.levels.map((l) => ({
          name: l.name || "",
          rewardPoints: l.rewardPoints ?? 0,
          prerequisiteLevelIndex: l.prerequisiteLevelIndex ?? -1,
          prerequisiteLevelIndices: Array.isArray(l.prerequisiteLevelIndices) ? l.prerequisiteLevelIndices : (l.prerequisiteLevelIndex != null && l.prerequisiteLevelIndex >= 0 ? [l.prerequisiteLevelIndex] : []),
          assessmentType: l.assessmentType || "MCQ",
          topics: Array.isArray(l.topics) ? l.topics : [],
          prerequisiteCourses: Array.isArray(l.prerequisiteCourses) ? l.prerequisiteCourses : [],
          studyMaterials: Array.isArray(l.studyMaterials) ? l.studyMaterials.map((m) => ({ type: m.type || "link", title: m.title || "", url: m.url || "" })) : [],
        })) : [],
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      type,
      course_logo,
      level,
      activityPoints,
      rewardPoints,
      faculty,
      levels,
    } = req.body;
    const doc = await AdminCourse.create({
      name: name || "New Course",
      description: description || "",
      status: status || "Active",
      type: type || "",
      course_logo: course_logo || "",
      level: level || "",
      activity_points: activityPoints ?? 0,
      reward_points: rewardPoints ?? 0,
      faculty: faculty || "",
      levels: Array.isArray(levels) ? levels : [],
    });
    res.status(201).json({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      status: doc.status,
      type: doc.type,
      course_logo: doc.course_logo,
      level: doc.level,
      activityPoints: doc.activity_points,
      rewardPoints: doc.reward_points,
      faculty: doc.faculty,
      levels: Array.isArray(doc.levels) ? doc.levels.map((l) => ({
        name: l.name || "",
        rewardPoints: l.rewardPoints ?? 0,
        prerequisiteLevelIndex: l.prerequisiteLevelIndex ?? -1,
        prerequisiteLevelIndices: Array.isArray(l.prerequisiteLevelIndices) ? l.prerequisiteLevelIndices : [],
        assessmentType: l.assessmentType || "MCQ",
        topics: Array.isArray(l.topics) ? l.topics : [],
        prerequisiteCourses: Array.isArray(l.prerequisiteCourses) ? l.prerequisiteCourses : [],
        studyMaterials: Array.isArray(l.studyMaterials) ? l.studyMaterials.map((m) => ({ type: m.type || "link", title: m.title || "", url: m.url || "" })) : [],
      })) : [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      type,
      course_logo,
      level,
      activityPoints,
      rewardPoints,
      faculty,
      levels,
    } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;
    if (type !== undefined) update.type = type;
    if (course_logo !== undefined) update.course_logo = course_logo;
    if (level !== undefined) update.level = level;
    if (activityPoints !== undefined) update.activity_points = activityPoints;
    if (rewardPoints !== undefined) update.reward_points = rewardPoints;
    if (faculty !== undefined) update.faculty = faculty;
    if (levels !== undefined) update.levels = Array.isArray(levels) ? levels : [];
    const doc = await AdminCourse.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });
    if (!doc) return res.status(404).json({ message: "Course not found" });
    res.json({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      status: doc.status,
      type: doc.type,
      course_logo: doc.course_logo,
      level: doc.level,
      activityPoints: doc.activity_points,
      rewardPoints: doc.reward_points,
      faculty: doc.faculty,
      levels: Array.isArray(doc.levels) ? doc.levels.map((l) => ({
        name: l.name || "",
        rewardPoints: l.rewardPoints ?? 0,
        prerequisiteLevelIndex: l.prerequisiteLevelIndex ?? -1,
        prerequisiteLevelIndices: Array.isArray(l.prerequisiteLevelIndices) ? l.prerequisiteLevelIndices : [],
        assessmentType: l.assessmentType || "MCQ",
        topics: Array.isArray(l.topics) ? l.topics : [],
        prerequisiteCourses: Array.isArray(l.prerequisiteCourses) ? l.prerequisiteCourses : [],
        studyMaterials: Array.isArray(l.studyMaterials) ? l.studyMaterials.map((m) => ({ type: m.type || "link", title: m.title || "", url: m.url || "" })) : [],
      })) : [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Venues ———
exports.getVenues = async (req, res) => {
  try {
    const list = await Venue.find().lean();
    res.json(list.map((v) => ({ id: v._id.toString(), name: v.name, location: v.location || "" })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createVenue = async (req, res) => {
  try {
    const doc = await Venue.create({ name: req.body.name || "", location: req.body.location || "" });
    res.status(201).json({ id: doc._id.toString(), name: doc.name, location: doc.location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const doc = await Venue.findByIdAndUpdate(req.params.id, { name: req.body.name, location: req.body.location }, { returnDocument: 'after' });
    if (!doc) return res.status(404).json({ message: "Venue not found" });
    res.json({ id: doc._id.toString(), name: doc.name, location: doc.location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Time slots ———
exports.getTimeSlots = async (req, res) => {
  try {
    const list = await TimeSlot.find().lean();
    res.json(list.map((t) => ({ id: t._id.toString(), startTime: t.startTime, endTime: t.endTime })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTimeSlot = async (req, res) => {
  try {
    const doc = await TimeSlot.create({ startTime: req.body.startTime || "09:00", endTime: req.body.endTime || "10:30" });
    res.status(201).json({ id: doc._id.toString(), startTime: doc.startTime, endTime: doc.endTime });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTimeSlot = async (req, res) => {
  try {
    const doc = await TimeSlot.findByIdAndUpdate(req.params.id, { startTime: req.body.startTime, endTime: req.body.endTime }, { returnDocument: 'after' });
    if (!doc) return res.status(404).json({ message: "Time slot not found" });
    res.json({ id: doc._id.toString(), startTime: doc.startTime, endTime: doc.endTime });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Slot templates (venue + time) ———
exports.getSlotTemplates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const list = await SlotTemplate.find(filter).populate("venue_id").populate("time_slot_id").lean();
    res.json(
      list.map((s) => ({
        id: s._id.toString(),
        venueId: s.venue_id?._id?.toString(),
        timeId: s.time_slot_id?._id?.toString(),
        venueLabel: s.venue_id?.name || "",
        timeLabel: s.time_slot_id ? `${s.time_slot_id.startTime} – ${s.time_slot_id.endTime}` : "",
        status: s.status || "Active",
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSlotTemplate = async (req, res) => {
  try {
    const { venue_id, time_slot_id, status } = req.body;
    if (!venue_id || !time_slot_id) return res.status(400).json({ message: "venue_id and time_slot_id required" });
    const doc = await SlotTemplate.create({ venue_id, time_slot_id, status: status || "Active" });
    const populated = await SlotTemplate.findById(doc._id).populate("venue_id").populate("time_slot_id").lean();
    res.status(201).json({
      id: doc._id.toString(),
      venueId: populated.venue_id?._id?.toString(),
      timeId: populated.time_slot_id?._id?.toString(),
      venueLabel: populated.venue_id?.name || "",
      timeLabel: populated.time_slot_id ? `${populated.time_slot_id.startTime} – ${populated.time_slot_id.endTime}` : "",
      status: populated.status || "Active",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSlotTemplate = async (req, res) => {
  try {
    const { venue_id, time_slot_id, venueLabel, timeLabel, status } = req.body;
    const update = {};
    if (venue_id) update.venue_id = venue_id;
    if (time_slot_id) update.time_slot_id = time_slot_id;
    if (status !== undefined) update.status = status;
    const doc = await SlotTemplate.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' }).populate("venue_id").populate("time_slot_id");
    if (!doc) return res.status(404).json({ message: "Slot template not found" });
    res.json({
      id: doc._id.toString(),
      venueId: doc.venue_id?._id?.toString(),
      timeId: doc.time_slot_id?._id?.toString(),
      venueLabel: doc.venue_id?.name || venueLabel || "",
      timeLabel: doc.time_slot_id ? `${doc.time_slot_id.startTime} – ${doc.time_slot_id.endTime}` : timeLabel || "",
      status: doc.status || "Active",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Leave types ———
exports.getLeaveTypes = async (req, res) => {
  try {
    const list = await LeaveType.find().lean();
    res.json(list.map((l) => ({ id: l._id.toString(), type: l.type, code: l.code, status: l.status || "Active" })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLeaveType = async (req, res) => {
  try {
    const status = req.body.status === "Inactive" ? "Inactive" : "Active";
    const doc = await LeaveType.create({ type: req.body.type || "", code: req.body.code || "", status });
    res.status(201).json({ id: doc._id.toString(), type: doc.type, code: doc.code, status: doc.status || "Active" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLeaveType = async (req, res) => {
  try {
    const update = { type: req.body.type, code: req.body.code };
    if (req.body.status !== undefined) update.status = req.body.status === "Inactive" ? "Inactive" : "Active";
    const doc = await LeaveType.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });
    if (!doc) return res.status(404).json({ message: "Leave type not found" });
    res.json({ id: doc._id.toString(), type: doc.type, code: doc.code, status: doc.status || "Active" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Leave workflows ———
exports.getLeaveWorkflows = async (req, res) => {
  try {
    const list = await LeaveWorkflow.find().lean();
    res.json(list.map((w) => ({ id: w._id.toString(), leaveType: w.leaveType, workflow: w.workflow })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLeaveWorkflow = async (req, res) => {
  try {
    const doc = await LeaveWorkflow.create({ leaveType: req.body.leaveType || "", workflow: req.body.workflow || "" });
    res.status(201).json({ id: doc._id.toString(), leaveType: doc.leaveType, workflow: doc.workflow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLeaveWorkflow = async (req, res) => {
  try {
    const doc = await LeaveWorkflow.findByIdAndUpdate(req.params.id, { leaveType: req.body.leaveType, workflow: req.body.workflow }, { returnDocument: 'after' });
    if (!doc) return res.status(404).json({ message: "Leave workflow not found" });
    res.json({ id: doc._id.toString(), leaveType: doc.leaveType, workflow: doc.workflow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Settings ———
exports.getSettings = async (req, res) => {
  try {
    const list = await AdminSettings.find().lean();
    const obj = {};
    list.forEach((s) => (obj[s.key] = s.value));
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { leaveApprovalSteps, coursePoints } = req.body;
    if (leaveApprovalSteps !== undefined) {
      await AdminSettings.findOneAndUpdate({ key: "leaveApprovalSteps" }, { key: "leaveApprovalSteps", value: leaveApprovalSteps }, { upsert: true });
    }
    if (coursePoints !== undefined) {
      await AdminSettings.findOneAndUpdate({ key: "coursePoints" }, { key: "coursePoints", value: coursePoints }, { upsert: true });
    }
    const list = await AdminSettings.find().lean();
    const obj = {};
    list.forEach((s) => (obj[s.key] = s.value));
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Faculty course assignments (admin assigns courses to technical faculty) ———
exports.getFacultyAssignments = async (req, res) => {
  try {
    const { user_id } = req.query;
    const filter = user_id ? { user_id } : {};
    const list = await FacultyCourseAssignment.find(filter).populate("course_id", "name status").populate("user_id", "email name").lean();
    res.json(list.map((a) => ({
      id: a._id.toString(),
      user_id: a.user_id?._id?.toString(),
      user_email: a.user_id?.email,
      user_name: a.user_id?.name,
      course_id: a.course_id?._id?.toString(),
      course_name: a.course_id?.name,
      course_status: a.course_id?.status,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignFacultyToCourse = async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    if (!user_id || !course_id) return res.status(400).json({ message: "user_id and course_id required" });
    const doc = await FacultyCourseAssignment.findOneAndUpdate(
      { user_id, course_id },
      { user_id, course_id },
      { returnDocument: 'after', upsert: true }
    );
    const populated = await FacultyCourseAssignment.findById(doc._id).populate("course_id", "name").populate("user_id", "email name").lean();
    res.status(201).json({
      id: populated._id.toString(),
      user_id: populated.user_id?._id?.toString(),
      course_id: populated.course_id?._id?.toString(),
      course_name: populated.course_id?.name,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Assignment already exists" });
    res.status(500).json({ message: err.message });
  }
};

exports.unassignFacultyFromCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await FacultyCourseAssignment.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Unassigned" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Question bank submissions (admin view & review) ———
exports.getQuestionBankSubmissions = async (req, res) => {
  try {
    const { course_id } = req.query;
    const filter = course_id ? { course_id } : {};
    const list = await QuestionBankSubmission.find(filter)
      .populate("course_id", "name status")
      .populate("user_id", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    res.json(
      list.map((s) => ({
        id: s._id.toString(),
        course_id: s.course_id?._id?.toString(),
        course_name: s.course_id?.name,
        faculty_name: s.user_id?.name,
        faculty_email: s.user_id?.email,
        user_id: s.user_id?._id?.toString(),
        status: s.status,
        title: s.title,
        content: s.content,
        file_url: s.file_url,
        submitted_at: s.submitted_at,
        reviewed_at: s.reviewed_at,
        review_remarks: s.review_remarks,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reviewQuestionBankSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_remarks } = req.body;
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected" });
    }
    const doc = await QuestionBankSubmission.findByIdAndUpdate(
      id,
      {
        status,
        reviewed_at: new Date(),
        review_remarks: review_remarks || "",
      },
      { returnDocument: 'after' }
    )
      .populate("course_id", "name")
      .populate("user_id", "name email")
      .lean();
    if (!doc) return res.status(404).json({ message: "Submission not found" });
    res.json({
      id: doc._id.toString(),
      course_name: doc.course_id?.name,
      status: doc.status,
      reviewed_at: doc.reviewed_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ——— Students (Admin assignment of Mentor/Warden) ———
exports.getStudents = async (req, res) => {
  try {
    const list = await Student.find()
      .populate("user_id", "email name")
      .populate("mentor_id", "email name")
      .populate("warden_id", "email name")
      .lean();

    res.json(list.map((s) => ({
      id: s._id.toString(),
      user_id: s.user_id?._id?.toString(),
      email: s.user_id?.email,
      name: s.name,
      register_no: s.register_no,
      department: s.department,
      type: s.type,
      mentor_id: s.mentor_id?._id?.toString(),
      mentor_name: s.mentor_id?.name || s.mentor_id?.email || "",
      warden_id: s.warden_id?._id?.toString(),
      warden_name: s.warden_id?.name || s.warden_id?.email || "",
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignStudentStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { mentor_id, warden_id } = req.body;

    const update = {};
    if (mentor_id !== undefined) update.mentor_id = mentor_id || null;
    if (warden_id !== undefined) update.warden_id = warden_id || null;

    const doc = await Student.findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .populate("user_id", "email name")
      .populate("mentor_id", "email name")
      .populate("warden_id", "email name")
      .lean();

    if (!doc) return res.status(404).json({ message: "Student not found" });

    res.json({
      id: doc._id.toString(),
      user_id: doc.user_id?._id?.toString(),
      email: doc.user_id?.email,
      name: doc.name,
      register_no: doc.register_no,
      department: doc.department,
      type: doc.type,
      mentor_id: doc.mentor_id?._id?.toString(),
      mentor_name: doc.mentor_id?.name || doc.mentor_id?.email || "",
      warden_id: doc.warden_id?._id?.toString(),
      warden_name: doc.warden_id?.name || doc.warden_id?.email || "",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
