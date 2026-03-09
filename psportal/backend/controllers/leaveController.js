const Leave = require("../models/Leave");
const LeaveType = require("../models/LeaveType");
const Student = require("../models/Student");
const LeaveWorkflow = require("../models/LeaveWorkflow");

function datesOverlap(from1, to1, from2, to2) {
  const a = new Date(from1).getTime();
  const b = new Date(to1).getTime();
  const c = new Date(from2).getTime();
  const d = new Date(to2).getTime();
  return a <= d && c <= b;
}

function normalizeRoleToken(token) {
  const t = String(token || "").trim().toLowerCase();
  if (!t) return null;
  if (t.startsWith("mentor")) return "mentor";
  if (t.startsWith("warden")) return "warden";
  if (t.startsWith("hostel")) return "hostel_manager";
  if (t.startsWith("parent")) return "parent";
  return null;
}

async function ensureWorkflowOrder(leaveDoc, targetRoleKey) {
  const leaveType = leaveDoc?.leaveType;
  if (!leaveType) return { ok: true };

  const wf = await LeaveWorkflow.findOne({ leaveType }).lean();
  if (!wf || !wf.workflow) {
    // No explicit workflow configured for this leave type – allow as before.
    return { ok: true };
  }

  const tokens = wf.workflow
    .split(/[,→>-]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
  const roles = tokens.map(normalizeRoleToken).filter(Boolean);
  if (!roles.length) return { ok: true };

  const idx = roles.indexOf(targetRoleKey);
  if (idx === -1) {
    // This role is not in the flow – block to avoid wrong approver.
    const roleLabel = targetRoleKey === "mentor" ? "Mentor" : targetRoleKey === "warden" ? "Warden" : targetRoleKey;
    return {
      ok: false,
      message: `${roleLabel} is not part of the approval flow for this leave type. Please contact admin to update the workflow.`,
    };
  }

  const unmet = [];
  for (let i = 0; i < idx; i += 1) {
    const r = roles[i];
    let st = "Pending";
    let roleName = r;
    if (r === "parent") {
      st = leaveDoc.parentStatus || "Pending";
      roleName = "Parent";
    } else if (r === "mentor") {
      st = leaveDoc.mentorApproval ? leaveDoc.mentorApproval.status : "Pending";
      roleName = "Mentor";
    } else if (r === "warden") {
      st = leaveDoc.wardenApproval ? leaveDoc.wardenApproval.status : "Pending";
      roleName = "Warden";
    } else if (r === "hostel_manager") {
      st = leaveDoc.hostelManagerApproval ? leaveDoc.hostelManagerApproval.status : "Pending";
      roleName = "Hostel Manager";
    }

    if (st === "Rejected") {
      return { ok: false, message: `Leave was already rejected by ${roleName}. No further action can be taken.` };
    } else if (st !== "Approved") {
      unmet.push(roleName);
    }
  }

  if (unmet.length) {
    return {
      ok: false,
      message: `Previous role(s) in the approval flow must approve first: ${unmet.join(
        ", "
      )}. You cannot approve this leave yet.`,
    };
  }

  return { ok: true };
}

/** True if this leave type's workflow includes the role (mentor, warden, etc.). */
async function workflowIncludesRole(leaveType, roleKey) {
  if (!leaveType || !roleKey) return false;
  const wf = await LeaveWorkflow.findOne({ leaveType }).lean();
  if (!wf || !wf.workflow) return false;
  return (wf.workflow || "").toLowerCase().includes(roleKey.toLowerCase());
}

/** List only leave types created by admin with status Active. For student Apply Leave dropdown. GET /api/leaves/leave-types */
exports.getActiveLeaveTypes = async (req, res) => {
  try {
    const list = await LeaveType.find({ status: "Active" }).sort({ type: 1 }).lean();
    res.json(list.map((l) => ({ id: l._id.toString(), type: l.type || l.code, code: l.code })));
  } catch (err) {
    console.error("getActiveLeaveTypes error:", err);
    res.status(500).json({ message: "Failed to load leave types" });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const { register_no } = req.query;
    if (!register_no) return res.status(400).json({ message: "register_no required" });
    const list = await Leave.find({ register_no }).sort({ fromDate: -1 }).lean();
    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
    const formatDateTime = (d) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "");
    const getDuration = (from, to) => {
      const diff = Math.max(0, new Date(to) - new Date(from));
      const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
      return days <= 1 ? "1 day" : `${days} days`;
    };
    res.json(
      list.map((l) => ({
        id: l._id.toString(),
        leaveType: l.leaveType,
        type: l.type,
        fromDate: formatDate(l.fromDate),
        toDate: formatDate(l.toDate),
        fromDateFull: formatDateTime(l.fromDate),
        toDateFull: formatDateTime(l.toDate),
        gateOut: l.gateOut || "-",
        gateIn: l.gateIn || "-",
        duration: getDuration(l.fromDate, l.toDate),
        remarks: l.remarks || "-",
        parentStatus: l.parentStatus || "Pending",
        status: l.status || "Pending",
        wardenApproval: l.wardenApproval || null,
        mentorApproval: l.mentorApproval || null,
      }))
    );
  } catch (err) {
    console.error("getMyLeaves error:", err);
    res.status(500).json({ message: "Failed to load leaves" });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { register_no, student_name, leaveType, fromDateTime, toDateTime, remarks } = req.body;
    if (!register_no || !fromDateTime || !toDateTime) {
      return res.status(400).json({ message: "register_no, fromDateTime and toDateTime required" });
    }
    const leaveTypeStr = (leaveType || "").trim();
    if (leaveTypeStr) {
      const allowed = await LeaveType.findOne({ status: "Active", $or: [{ type: leaveTypeStr }, { code: leaveTypeStr }] }).lean();
      if (!allowed) {
        return res.status(400).json({ message: "Invalid or inactive leave type. Only active leave types created by admin can be used." });
      }
    }
    const fromDate = new Date(fromDateTime);
    const toDate = new Date(toDateTime);
    if (toDate < fromDate) {
      return res.status(400).json({ message: "To date & time must be on or after from date & time." });
    }

    const existing = await Leave.find({
      register_no,
      status: { $nin: ["Rejected", "Cancelled"] },
    }).lean();

    for (const ex of existing) {
      if (datesOverlap(fromDate, toDate, ex.fromDate, ex.toDate)) {
        return res.status(400).json({
          message: "You already have a leave applied for this time period. You cannot apply another leave for the same or overlapping dates.",
        });
      }
    }

    const student = await Student.findOne({ register_no }).lean();
    const mentor_id = student?.mentor_id || null;
    const warden_id = student?.warden_id || null;

    const isOnDuty = leaveType && String(leaveType).startsWith("OnDuty");
    const doc = await Leave.create({
      register_no,
      student_name: student_name || (student?.name || ""),
      leaveType: leaveType || "Leave",
      type: isOnDuty ? "OD" : "Leave",
      fromDate,
      toDate,
      remarks: remarks || "",
      parentStatus: "Pending",
      status: "Pending",
      mentor_id,
      warden_id,
    });

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
    const formatDateTime = (d) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "");
    const getDuration = (from, to) => {
      const diff = Math.max(0, new Date(to) - new Date(from));
      const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
      return days <= 1 ? "1 day" : `${days} days`;
    };

    res.status(201).json({
      id: doc._id.toString(),
      leaveType: doc.leaveType,
      type: doc.type,
      fromDate: formatDate(doc.fromDate),
      toDate: formatDate(doc.toDate),
      fromDateFull: formatDateTime(doc.fromDate),
      toDateFull: formatDateTime(doc.toDate),
      gateOut: doc.gateOut || "-",
      gateIn: doc.gateIn || "-",
      duration: getDuration(doc.fromDate, doc.toDate),
      remarks: doc.remarks || "-",
      parentStatus: doc.parentStatus,
      status: doc.status,
    });
  } catch (err) {
    console.error("applyLeave error:", err);
    res.status(500).json({ message: err.message || "Failed to apply leave" });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Leave.findById(id);
    if (!doc) return res.status(404).json({ message: "Leave not found" });

    // Prevent deletion if an approval action was already taken
    const hasMentorAction = doc.mentorApproval && doc.mentorApproval.status && doc.mentorApproval.status !== "Pending";
    const hasWardenAction = doc.wardenApproval && doc.wardenApproval.status && doc.wardenApproval.status !== "Pending";
    const hasHostelManagerAction = doc.hostelManagerApproval && doc.hostelManagerApproval.status && doc.hostelManagerApproval.status !== "Pending";

    if (hasMentorAction || hasWardenAction || hasHostelManagerAction || doc.status !== "Pending") {
      return res.status(403).json({ message: "Leave cannot be deleted because it is already being processed or has been processed by staff." });
    }

    await doc.deleteOne();
    res.json({ message: "Leave deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete leave" });
  }
};

/** Mentor approval: only for Leave / OD types. PATCH /api/leaves/:id/mentor-approval body: { action: "Approved" | "Rejected" } */
exports.mentorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const userName = req.user?.name || req.user?.email || "Mentor";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!action || !["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({ message: "action must be Approved or Rejected" });
    }
    const doc = await Leave.findById(id);
    if (!doc) return res.status(404).json({ message: "Leave not found" });
    const mentorInWorkflow = await workflowIncludesRole(doc.leaveType, "mentor");
    if (!mentorInWorkflow) {
      return res.status(403).json({ message: "This leave type's workflow does not include mentor approval." });
    }
    const orderCheck = await ensureWorkflowOrder(doc, "mentor");
    if (!orderCheck.ok) {
      return res.status(400).json({ message: orderCheck.message });
    }
    if (doc.mentor_id && doc.mentor_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the assigned mentor for this leave" });
    }
    doc.mentorApproval = { status: action, by: userName };
    if (action === "Rejected") {
      doc.status = "Rejected";
    } else {
      // For now we'll inline a simple check
      const wf = await LeaveWorkflow.findOne({ leaveType: doc.leaveType }).lean();
      if (wf && wf.workflow) {
        const roles = wf.workflow.split(/[,>→-]+/).map(t => normalizeRoleToken(t.trim())).filter(Boolean);
        let allApproved = true;
        for (const r of roles) {
          if (r === "mentor" && (!doc.mentorApproval || doc.mentorApproval.status !== "Approved")) allApproved = false;
          if (r === "warden" && (!doc.wardenApproval || doc.wardenApproval.status !== "Approved")) allApproved = false;
          if (r === "hostel_manager" && (!doc.hostelManagerApproval || doc.hostelManagerApproval.status !== "Approved")) allApproved = false;
        }
        if (allApproved) doc.status = "Approved";
      }
    }
    await doc.save();
    res.json({ message: "Leave " + action.toLowerCase(), leave: doc });
  } catch (err) {
    console.error("mentorApproval error:", err);
    res.status(500).json({ message: err.message || "Failed to update leave" });
  }
};

/** Warden approval: only for Sick Leave, Emergency Leave, GP. PATCH /api/leaves/:id/warden-approval body: { action: "Approved" | "Rejected" } */
exports.wardenApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const userName = req.user?.name || req.user?.email || "Warden";
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!action || !["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({ message: "action must be Approved or Rejected" });
    }
    const doc = await Leave.findById(id);
    if (!doc) return res.status(404).json({ message: "Leave not found" });
    const wardenInWorkflow = await workflowIncludesRole(doc.leaveType, "warden");
    if (!wardenInWorkflow) {
      return res.status(403).json({ message: "This leave type's workflow does not include warden approval." });
    }
    const orderCheck = await ensureWorkflowOrder(doc, "warden");
    if (!orderCheck.ok) {
      return res.status(400).json({ message: orderCheck.message });
    }
    if (doc.warden_id && doc.warden_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the assigned warden for this leave" });
    }
    doc.wardenApproval = { status: action, by: userName };
    if (action === "Rejected") {
      doc.status = "Rejected";
    } else {
      const wf = await LeaveWorkflow.findOne({ leaveType: doc.leaveType }).lean();
      if (wf && wf.workflow) {
        const roles = wf.workflow.split(/[,>→-]+/).map(t => normalizeRoleToken(t.trim())).filter(Boolean);
        let allApproved = true;
        for (const r of roles) {
          if (r === "mentor" && (!doc.mentorApproval || doc.mentorApproval.status !== "Approved")) allApproved = false;
          if (r === "warden" && (!doc.wardenApproval || doc.wardenApproval.status !== "Approved")) allApproved = false;
          if (r === "hostel_manager" && (!doc.hostelManagerApproval || doc.hostelManagerApproval.status !== "Approved")) allApproved = false;
        }
        if (allApproved) doc.status = "Approved";
      }
    }
    await doc.save();
    res.json({ message: "Leave " + action.toLowerCase(), leave: doc });
  } catch (err) {
    console.error("wardenApproval error:", err);
    res.status(500).json({ message: err.message || "Failed to update leave" });
  }
};
