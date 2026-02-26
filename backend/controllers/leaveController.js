const Leave = require("../models/Leave");

function datesOverlap(from1, to1, from2, to2) {
  const a = new Date(from1).getTime();
  const b = new Date(to1).getTime();
  const c = new Date(from2).getTime();
  const d = new Date(to2).getTime();
  return a <= d && c <= b;
}

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

    const isOnDuty = leaveType && String(leaveType).startsWith("OnDuty");
    const doc = await Leave.create({
      register_no,
      student_name: student_name || "",
      leaveType: leaveType || "Leave",
      type: isOnDuty ? "OD" : "Leave",
      fromDate,
      toDate,
      remarks: remarks || "",
      parentStatus: "Pending",
      status: "Pending",
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
    const doc = await Leave.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Leave not found" });
    res.json({ message: "Leave deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete leave" });
  }
};
