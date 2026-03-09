const Student = require("../models/Student");
const User = require("../models/User");
const Role = require("../models/Role");
const PointTransaction = require("../models/PointTransaction");
const StudentProgress = require("../models/StudentProgress");
const StudentCourse = require("../models/StudentCourse");
const StudentLevelProgress = require("../models/StudentLevelProgress");
const StudentSlotRegistration = require("../models/StudentSlotRegistration");
const AdminCourse = require("../models/AdminCourse");
const Leave = require("../models/Leave");
const LeaveWorkflow = require("../models/LeaveWorkflow");
const FacultyCourseAssignment = require("../models/FacultyCourseAssignment");

exports.getStudentDashboardData = async (req, res) => {
  try {
    // For testing without auth middleware, we'll accept a register_no or just return the first student
    const register_no = req.query.register_no || "7376231CS323";

    // Find student
    const student = await Student.findOne({ register_no }).populate("user_id");

    if (!student) {
      // Return mock data so the dashboard still loads (e.g. before running dashboard seed)
      const mockPayload = {
        profile: {
          name: "Student",
          register_no: register_no,
          avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png/svg?seed=" + encodeURIComponent(register_no),
          department: "Computer Science and Engineering"
        },
        points: {
          total: 0,
          breakdown: [],
          recentTransactions: []
        },
        skills: {
          tags: [],
          progress: { cleared: 0, ongoing: 0 }
        }
      };
      return res.status(200).json(mockPayload);
    }

    // Fetch ALL Point Transactions
    const allTransactions = await PointTransaction.find({ student_id: student._id })
      .sort({ date_earned: -1 });

    // Build generic breakdown matching UI layout dynamically from the DB transactions
    const breakdownMap = {};

    allTransactions.forEach(tx => {
      if (!breakdownMap[tx.activity_category]) {
        breakdownMap[tx.activity_category] = {
          category: tx.activity_category,
          pointsEarned: 0,
          eligibleBonus: 0,
          sourceMap: {}
        };
      }

      breakdownMap[tx.activity_category].pointsEarned += tx.points_earned;

      if (!breakdownMap[tx.activity_category].sourceMap[tx.activity_title]) {
        breakdownMap[tx.activity_category].sourceMap[tx.activity_title] = 0;
      }
      breakdownMap[tx.activity_category].sourceMap[tx.activity_title] += tx.points_earned;
    });

    // Convert Breakdown map cleanly
    const pointsBreakdown = Object.values(breakdownMap).map(catData => ({
      category: catData.category,
      pointsEarned: catData.pointsEarned,
      eligibleBonus: catData.eligibleBonus,
      transactions: Object.entries(catData.sourceMap).map(([title, pts]) => ({
        source: title,
        points: pts,
        bonus: "-"
      })).sort((a, b) => a.source.localeCompare(b.source)) // alphabetcal descending sources
    })).sort((a, b) => a.category.localeCompare(b.category)); // alphabetical categories

    // Get Skills Progress (Aggregating based on generic completed status for the mock UI)
    const progressRecords = await StudentProgress.find({ student_id: student._id });
    const clearedSkills = progressRecords.filter(p => p.completed).length;
    const ongoingSkills = progressRecords.filter(p => !p.completed).length;

    // Dynamically extract Skill Tags from "Personalized Skills" point transactions
    const skillTagsMap = {};
    allTransactions.forEach(tx => {
      if (tx.activity_category.startsWith("Personalized Skills")) {
        // E.g. "C Programming Level - 5" or "Aptitude Level - 1H"
        let title = tx.activity_title || "";

        // Heuristic parsing: split by " Level" or "-"
        let skillName = title;
        let levelMatch = title.match(/Level\s*-\s*([0-9A-Z]+)/i) || title.match(/-\s*Level\s*([0-9A-Z]+)/i);

        if (levelMatch) {
          skillName = title.substring(0, levelMatch.index).trim();
        }

        // Clean up trailing hyphens
        if (skillName.endsWith("-")) skillName = skillName.slice(0, -1).trim();

        // Group by skillName and count the occurrences to represent level progress 
        // (e.g., 5 levels of C Programming completed = Level 5)
        if (!skillTagsMap[skillName]) {
          skillTagsMap[skillName] = 0;
        }
        skillTagsMap[skillName] += 1;
      }
    });

    // Convert to array of { name: '...', level: N } and sort by highest level first
    const skillTags = Object.entries(skillTagsMap)
      .map(([name, count]) => ({ name, level: count }))
      .sort((a, b) => b.level - a.level);

    // Map realistic cleared/ongoing counts based on this raw data natively
    const dynamicClearedSkills = allTransactions.filter(tx => tx.activity_category.startsWith("Personalized Skills")).length;
    const dynamicOngoingSkills = 6; // Mock buffer for visually appealing UI layout

    // Payload Assembly
    const payload = {
      profile: {
        name: student.name,
        register_no: student.register_no,
        avatarUrl: student.profile_pic || "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
        department: student.department
      },
      points: {
        total: student.activity_points,
        breakdown: pointsBreakdown, // Using mock for now until we fully model points ledger
        recentTransactions: allTransactions.slice(0, 20).map(pt => ({
          title: pt.activity_title,
          category: pt.activity_category,
          status: pt.activity_status,
          points: pt.points_earned,
          date: pt.date_earned
        }))
      },
      skills: {
        tags: skillTags, // Fully Dynamic now!
        progress: {
          cleared: dynamicClearedSkills,
          ongoing: dynamicOngoingSkills
        }
      }
    };

    res.json(payload);

  } catch (error) {
    console.error("Dashboard Aggregation Error:", error);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const register_no = req.query.register_no;
    if (!register_no) {
      return res.status(400).json({ message: "register_no required" });
    }
    // Each entry in this list represents a level the student has interacted with.
    // We only keep levels that are not completed, so completed ones disappear from My Courses.
    const progress = await StudentLevelProgress.find({ register_no, status: { $ne: "completed" } }).lean();
    if (!progress.length) {
      return res.json([]);
    }

    const courseIds = [...new Set(progress.map((p) => p.course_id))];
    const adminCourses = await AdminCourse.find({ _id: { $in: courseIds }, status: "Active" }).lean();
    if (!adminCourses.length) {
      return res.json([]);
    }
    const courseMap = new Map(adminCourses.map((c) => [c._id.toString(), c]));

    const cards = [];
    for (const p of progress) {
      const c = courseMap.get(p.course_id);
      if (!c) continue; // skip inactive / missing courses
      const levels = Array.isArray(c.levels) ? c.levels : [];
      const lvl = levels[p.level_index] || null;
      if (!lvl) continue;
      const courseName = (c.name || "").trim() || "Course";
      const levelName = lvl.name || `Level ${p.level_index + 1}`;
      cards.push({
        id: c._id.toString(),
        title: `${courseName} - ${levelName}`,
        image: c.course_logo || "",
        completed: p.status === "completed",
        levelName,
      });
    }

    res.json(cards);
  } catch (err) {
    console.error("getMyCourses error:", err);
    res.status(500).json({ message: "Failed to load my courses" });
  }
};

// ——— User dashboard by role and accesses (mentor, warden, technical faculty) ———
function parseAccesses(accessesStr) {
  if (!accessesStr || typeof accessesStr !== "string") return [];
  return accessesStr.split(",").map((s) => s.trim()).filter(Boolean);
}

exports.getDashboardMe = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).populate("roles").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const roleNames = (user.roles || []).map((r) => (r && r.role_name) || r).filter(Boolean);
    const accessesSet = new Set();
    (user.roles || []).forEach((r) => {
      if (r && r.accesses) parseAccesses(r.accesses).forEach((a) => accessesSet.add(a));
    });
    const accesses = Array.from(accessesSet);

    const payload = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || "",
        roles: roleNames,
        accesses,
      },
      mentees: [],
      ward_students: [],
      leave_requests_to_approve: [],
      leave_history_mentor: [],
      leave_history_warden: [],
      assigned_courses: [],
    };

    const has = (key) => accesses.includes(key);

    // Leave types that require mentor/warden (from admin-created workflows)
    const allWorkflows = await LeaveWorkflow.find().lean();
    const leaveTypesWithMentor = allWorkflows
      .filter((w) => (w.workflow || "").toLowerCase().includes("mentor"))
      .map((w) => w.leaveType)
      .filter(Boolean);
    const leaveTypesWithWarden = allWorkflows
      .filter((w) => (w.workflow || "").toLowerCase().includes("warden"))
      .map((w) => w.leaveType)
      .filter(Boolean);

    // Mentees (students where I am mentor)
    const mentees = await Student.find({ mentor_id: userId }).lean();
    if (mentees.length > 0) {
      const menteeIds = mentees.map((m) => m._id.toString());
      const registerNos = mentees.map((m) => m.register_no);

      for (const m of mentees) {
        const row = {
          register_no: m.register_no,
          name: m.name,
          activity_points: m.activity_points ?? 0,
          department: m.department,
        };
        // Always try to get activity points and progress for mentor
        const pts = await PointTransaction.find({ student_id: m._id }).lean();
        row.reward_activity_breakdown = pts;
        row.total_activity = pts.reduce((s, p) => s + (p.points_earned || 0), 0);

        const progress = await StudentLevelProgress.find({ register_no: m.register_no }).lean();
        row.courses_progress = progress;

        // Student._id can be string (e.g. "S_7376231CS320"); StudentSlotRegistration.student_id expects ObjectId
        const idIsObjectId = typeof m._id === "string" && /^[a-fA-F0-9]{24}$/.test(m._id);
        if (idIsObjectId) {
          const regs = await StudentSlotRegistration.find({ student_id: m._id }).lean();
          const attended = regs.filter((r) => r.status === "attended").length;
          const total = regs.length || 1;
          row.attendance_percent = Math.round((attended / total) * 100);
        } else {
          row.attendance_percent = 0;
        }

        payload.mentees.push(row);
      }

      // Leave requests sent to me (assigned mentor): leave types whose workflow includes "mentor"
      const mentorLeavesQuery = {
        $and: [
          {
            $or: [
              { mentor_id: userId },
              ...(registerNos.length
                ? [{ $or: [{ mentor_id: null }, { mentor_id: { $exists: false } }], register_no: { $in: registerNos } }]
                : []),
            ],
          },
          { leaveType: { $in: leaveTypesWithMentor } },
          { status: { $nin: ["Rejected", "Cancelled"] } },
          {
            $or: [
              { "mentorApproval.status": { $nin: ["Approved", "Rejected"] } },
              { mentorApproval: { $exists: false } },
              { "mentorApproval.status": null },
            ],
          },
        ],
      };
      const leaves = await Leave.find(mentorLeavesQuery).sort({ createdAt: -1 }).lean();
      payload.leave_requests_to_approve.push(...leaves.map((l) => ({ ...l, id: l._id.toString(), approval_type: "mentor" })));

      // Leaves history: same mentor's leaves (workflow includes mentor) already approved/rejected by mentor OR overall rejected
      const historyQuery = {
        $and: [
          { $or: [{ mentor_id: userId }, ...(registerNos.length ? [{ mentor_id: { $in: [null, undefined] }, register_no: { $in: registerNos } }] : [])] },
          { leaveType: { $in: leaveTypesWithMentor } },
          {
            $or: [
              { "mentorApproval.status": { $in: ["Approved", "Rejected"] } },
              { status: { $in: ["Rejected", "Cancelled"] } }
            ]
          },
        ],
      };
      const historyLeaves = await Leave.find(historyQuery).sort({ createdAt: -1 }).limit(200).lean();
      payload.leave_history_mentor = historyLeaves.map((l) => ({ ...l, id: l._id.toString(), approval_type: "mentor" }));
    }

    // Ward students (students where I am warden)
    const wards = await Student.find({ warden_id: userId }).lean();
    if (wards.length > 0) {
      const wardRegisterNos = wards.map((w) => w.register_no);

      for (const w of wards) {
        const row = {
          register_no: w.register_no,
          name: w.name,
          department: w.department,
          room_number: w.room_number || "-",
          biometric_details: w.biometric_details || "-"
        };
        payload.ward_students.push(row);
      }

      // Warden leave requests: leave types whose workflow includes "warden"
      if (wardRegisterNos.length) {
        const wardenLeavesQuery = {
          $and: [
            { register_no: { $in: wardRegisterNos } },
            { leaveType: { $in: leaveTypesWithWarden } },
            { status: { $nin: ["Rejected", "Cancelled"] } },
            {
              $or: [
                { "wardenApproval.status": { $nin: ["Approved", "Rejected"] } },
                { wardenApproval: { $exists: false } },
                { "wardenApproval.status": null },
              ],
            },
          ],
        };
        const leaves = await Leave.find(wardenLeavesQuery).sort({ createdAt: -1 }).lean();
        payload.leave_requests_to_approve.push(...leaves.map((l) => ({ ...l, id: l._id.toString(), approval_type: "warden" })));

        // Warden leave history: workflow includes warden, already approved/rejected by warden OR overall rejected
        const wardenHistoryQuery = {
          $and: [
            { register_no: { $in: wardRegisterNos } },
            { leaveType: { $in: leaveTypesWithWarden } },
            {
              $or: [
                { "wardenApproval.status": { $in: ["Approved", "Rejected"] } },
                { status: { $in: ["Rejected", "Cancelled"] } }
              ]
            },
          ],
        };
        const wardenHistoryLeaves = await Leave.find(wardenHistoryQuery).sort({ createdAt: -1 }).limit(200).lean();
        payload.leave_history_warden = wardenHistoryLeaves.map((l) => ({ ...l, id: l._id.toString(), approval_type: "warden" }));
      }
    }

    // Dedupe leave_requests_to_approve by _id + approval_type
    const seen = new Set();
    payload.leave_requests_to_approve = payload.leave_requests_to_approve.filter((l) => {
      const id = l._id?.toString?.() || l.id;
      const key = `${id}_${l.approval_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Assigned courses (technical faculty): from FacultyCourseAssignment OR from Course details Faculty field (name match)
    if (has("faculty.courses_assigned")) {
      const userName = (user.name || "").trim();
      const assignments = await FacultyCourseAssignment.find({ user_id: userId }).populate("course_id", "name status description").lean();
      const fromAssignments = assignments.map((a) => ({
        id: a.course_id?._id?.toString(),
        name: a.course_id?.name,
        status: a.course_id?.status,
        description: a.course_id?.description || "",
      })).filter((c) => c.id);
      const seenIds = new Set(fromAssignments.map((c) => c.id));
      if (userName) {
        const coursesByFacultyName = await AdminCourse.find({
          faculty: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
          status: "Active",
        }).lean();
        coursesByFacultyName.forEach((c) => {
          const id = c._id.toString();
          if (!seenIds.has(id)) {
            seenIds.add(id);
            fromAssignments.push({
              id,
              name: c.name,
              status: c.status || "Active",
              description: c.description || "",
            });
          }
        });
      }
      payload.assigned_courses = fromAssignments;
    }

    res.json(payload);
  } catch (err) {
    console.error("getDashboardMe error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
