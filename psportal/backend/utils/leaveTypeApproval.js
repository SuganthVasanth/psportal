/**
 * Which role approves a leave based on leave type.
 * - Mentor: Leave, OD (and any OnDuty variant)
 * - Warden: Sick Leave, Emergency Leave, GP (General Permission)
 */

const WARDEN_LEAVE_TYPES = ["Sick Leave", "Emergency Leave", "GP"];
const MENTOR_LEAVE_TYPE_GENERIC = "Leave";

function normalize(s) {
  return (s || "").trim().toLowerCase();
}

/** True if this leave type is approved by warden */
function isWardenLeaveType(leave) {
  const lt = normalize(leave?.leaveType);
  if (!lt) return false;
  return WARDEN_LEAVE_TYPES.some((w) => normalize(w) === lt);
}

/** True if this leave type is approved by mentor (Leave or OD/OnDuty) */
function isMentorLeaveType(leave) {
  const type = leave?.type;
  const leaveType = (leave?.leaveType || "").trim();
  if (type === "OD") return true;
  if (leaveType && leaveType.toLowerCase().startsWith("onduty")) return true;
  if (normalize(leaveType) === normalize(MENTOR_LEAVE_TYPE_GENERIC)) return true;
  return false;
}

/** MongoDB query condition: leave type is mentor-approved */
function mentorLeaveTypeCondition() {
  return {
    $or: [
      { leaveType: { $regex: /^Leave$/i } },
      { type: "OD" },
      { leaveType: { $regex: /^OnDuty/i } },
    ],
  };
}

/** MongoDB query condition: leave type is warden-approved */
function wardenLeaveTypeCondition() {
  return {
    $or: [
      { leaveType: { $regex: /^Sick Leave$/i } },
      { leaveType: { $regex: /^Emergency Leave$/i } },
      { leaveType: { $regex: /^GP$/i } },
    ],
  };
}

module.exports = {
  isWardenLeaveType,
  isMentorLeaveType,
  mentorLeaveTypeCondition,
  wardenLeaveTypeCondition,
};
