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
const Slot = require("../models/Slot");
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
    const doc = await Role.findByIdAndUpdate(req.params.id, { role_name: role, description, accesses }, { new: true });
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
      { new: true }
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
        prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
        levels: Array.isArray(c.levels) ? c.levels.map((l) => ({
          name: l.name || "",
          rewardPoints: l.rewardPoints ?? 0,
          prerequisiteLevelIndex: l.prerequisiteLevelIndex ?? -1,
          prerequisiteLevelIndices: Array.isArray(l.prerequisiteLevelIndices) ? l.prerequisiteLevelIndices : (l.prerequisiteLevelIndex != null && l.prerequisiteLevelIndex >= 0 ? [l.prerequisiteLevelIndex] : []),
          assessmentType: l.assessmentType || "MCQ",
          topics: Array.isArray(l.topics) ? l.topics : [],
          studyMaterials: Array.isArray(l.studyMaterials) ? l.studyMaterials.map((m) => ({
            name: m.name || "",
            type: m.type === "file" ? "file" : "link",
            url: m.url || "",
            content: m.content || "",
          })) : [],
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
      prerequisites,
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
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
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
      prerequisites: doc.prerequisites || [],
      levels: doc.levels || [],
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
      prerequisites,
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
    if (prerequisites !== undefined) update.prerequisites = Array.isArray(prerequisites) ? prerequisites : [];
    if (levels !== undefined) update.levels = Array.isArray(levels) ? levels : [];
    const doc = await AdminCourse.findByIdAndUpdate(req.params.id, update, { new: true });
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
      prerequisites: doc.prerequisites || [],
      levels: doc.levels || [],
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
    const doc = await Venue.findByIdAndUpdate(req.params.id, { name: req.body.name, location: req.body.location }, { new: true });
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
    const doc = await TimeSlot.findByIdAndUpdate(req.params.id, { startTime: req.body.startTime, endTime: req.body.endTime }, { new: true });
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
    const doc = await SlotTemplate.findByIdAndUpdate(req.params.id, update, { new: true }).populate("venue_id").populate("time_slot_id");
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
    const doc = await LeaveType.findByIdAndUpdate(req.params.id, update, { new: true });
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
    const doc = await LeaveWorkflow.findByIdAndUpdate(req.params.id, { leaveType: req.body.leaveType, workflow: req.body.workflow }, { new: true });
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
    const list = await FacultyCourseAssignment.find(filter)
      .populate("course_id", "name status")
      .populate("user_id", "email name")
      .populate("template_id", "name key")
      .lean();
    res.json(list.map((a) => ({
      id: a._id.toString(),
      user_id: a.user_id?._id?.toString(),
      user_email: a.user_id?.email,
      user_name: a.user_id?.name,
      course_id: a.course_id?._id?.toString(),
      course_name: a.course_id?.name,
      course_status: a.course_id?.status,
      template_id: a.template_id?._id?.toString() || null,
      template_name: a.template_id?.name || "",
      question_count: a.question_count || 0,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignFacultyToCourse = async (req, res) => {
  try {
    const { user_id, course_id, template_id, question_count } = req.body;
    if (!user_id || !course_id) return res.status(400).json({ message: "user_id and course_id required" });
    const doc = await FacultyCourseAssignment.findOneAndUpdate(
      { user_id, course_id },
      {
        user_id,
        course_id,
        ...(template_id ? { template_id } : {}),
        ...(question_count != null ? { question_count } : {}),
      },
      { new: true, upsert: true }
    );
    const populated = await FacultyCourseAssignment.findById(doc._id)
      .populate("course_id", "name")
      .populate("user_id", "email name")
      .populate("template_id", "name key")
      .lean();
    res.status(201).json({
      id: populated._id.toString(),
      user_id: populated.user_id?._id?.toString(),
      course_id: populated.course_id?._id?.toString(),
      course_name: populated.course_id?.name,
      template_id: populated.template_id?._id?.toString() || null,
      template_name: populated.template_id?.name || "",
      question_count: populated.question_count || 0,
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
exports.getQuestionBankSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await QuestionBankSubmission.findById(id)
      .populate("course_id", "name status")
      .populate("user_id", "name email")
      .populate("questions.template_id", "name key")
      .lean();
    if (!doc) return res.status(404).json({ message: "Submission not found" });
    res.json({
      id: doc._id.toString(),
      course_id: doc.course_id?._id?.toString(),
      course_name: doc.course_id?.name,
      faculty_name: doc.user_id?.name,
      faculty_email: doc.user_id?.email,
      user_id: doc.user_id?._id?.toString(),
      status: doc.status,
      title: doc.title,
      content: doc.content,
      file_url: doc.file_url,
      submitted_at: doc.submitted_at,
      reviewed_at: doc.reviewed_at,
      review_remarks: doc.review_remarks || "",
      questions: (doc.questions || []).map((q) => ({
        questionNumber: q.questionNumber,
        template_id: q.template_id?._id?.toString(),
        template_name: q.template_id?.name,
        value: q.value || {},
        correctAnswerKey: q.correctAnswerKey,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
      { new: true }
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

// ——— Assessment Slots (Instances of SlotTemplate for a specific course/date) ———
exports.getAssessmentSlots = async (req, res) => {
  try {
    const list = await Slot.find()
      .populate("allowed_courses.course_id", "name")
      .populate("venue_id", "name")
      .populate("time_slot_id", "startTime endTime")
      .lean();
    res.json(
      list.map((s) => ({
        id: s._id.toString(),
        allowedCourses: (s.allowed_courses || []).map((ac) => ({
          courseId: ac.course_id?._id?.toString(),
          courseName: ac.course_id?.name || "",
          levelIndices: ac.level_indices || [],
        })),
        venueId: s.venue_id?._id?.toString(),
        venueLabel: s.venue_id?.name || "",
        timeId: s.time_slot_id?._id?.toString(),
        startTime: s.time_slot_id?.startTime,
        timeLabel: s.time_slot_id ? `${s.time_slot_id.startTime} – ${s.time_slot_id.endTime}` : "",
        date: s.date,
        capacity: s.capacity,
        bookedCount: s.booked_count || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.openAssessmentSlots = async (req, res) => {
  try {
    const { date, venue_id, startTime, capacity, allowed_courses, slot_template_ids } = req.body;

    if (venue_id && startTime) {
      if (!date || !allowed_courses || !Array.isArray(allowed_courses)) {
        return res.status(400).json({ message: "date and allowed_courses required" });
      }

      // Find or create TimeSlot for this startTime
      // Default endTime is startTime + 1 hour (though calculated dynamically in frontend)
      let tSlot = await TimeSlot.findOne({ startTime });
      if (!tSlot) {
        const [h, m] = startTime.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        d.setHours(d.getHours() + 1);
        const endTimeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        tSlot = await TimeSlot.create({ startTime, endTime: endTimeStr });
      }

      const newSlot = new Slot({
        allowed_courses,
        venue_id,
        time_slot_id: tSlot._id,
        date: new Date(date),
        capacity: capacity || 30,
        booked_count: 0
      });

      await newSlot.save();
      return res.status(201).json({ message: "Slot opened successfully" });
    }

    if (slot_template_ids && Array.isArray(slot_template_ids) && slot_template_ids.length > 0) {
      const templates = await SlotTemplate.find({ _id: { $in: slot_template_ids } }).lean();
      const newSlots = templates.map((t) => ({
        allowed_courses,
        venue_id: t.venue_id,
        time_slot_id: t.time_slot_id,
        slot_template_id: t._id,
        date: new Date(date),
        capacity: capacity || 30,
        booked_count: 0,
      }));

      const docs = await Slot.insertMany(newSlots);
      return res.status(201).json({ message: `${docs.length} slots opened successfully` });
    }

    res.status(400).json({ message: "Either (venue_id, startTime) or slot_template_ids required" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAssessmentSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await Slot.findById(id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    if (slot.booked_count > 0) {
      return res.status(400).json({ message: "Cannot delete slot with existing bookings" });
    }
    await Slot.findByIdAndDelete(id);
    res.json({ message: "Slot deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
