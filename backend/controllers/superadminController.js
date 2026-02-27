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
    res.json(list.map((c) => ({ id: c._id.toString(), name: c.name, description: c.description || "", status: c.status || "Active" })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const doc = await AdminCourse.create({ name: name || "New Course", description: description || "", status: status || "Active" });
    res.status(201).json({ id: doc._id.toString(), name: doc.name, description: doc.description, status: doc.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const doc = await AdminCourse.findByIdAndUpdate(req.params.id, { name, description, status }, { new: true });
    if (!doc) return res.status(404).json({ message: "Course not found" });
    res.json({ id: doc._id.toString(), name: doc.name, description: doc.description, status: doc.status });
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
