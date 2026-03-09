const QuestionBankSubmission = require("../models/QuestionBankSubmission");
const FacultyCourseAssignment = require("../models/FacultyCourseAssignment");
const AdminCourse = require("../models/AdminCourse");
const User = require("../models/User");

const API_BASE = process.env.API_BASE || "";

// ——— Faculty: get my question bank tasks (assigned via FacultyCourseAssignment OR Course details Faculty name) ———

exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const currentUser = await User.findById(userId).lean();
    const userName = (currentUser?.name || "").trim();

    const assignments = await FacultyCourseAssignment.find({ user_id: userId })
      .populate("course_id", "name status")
      .lean();
    const courseMap = new Map();
    assignments.forEach((a) => {
      const cid = a.course_id?._id?.toString();
      if (cid) courseMap.set(cid, { name: a.course_id?.name, status: a.course_id?.status });
    });

    if (userName) {
      const coursesByFaculty = await AdminCourse.find({
        faculty: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        status: "Active",
      }).lean();
      coursesByFaculty.forEach((c) => {
        const cid = c._id.toString();
        if (!courseMap.has(cid)) courseMap.set(cid, { name: c.name, status: c.status || "Active" });
      });
    }

    const courseIds = Array.from(courseMap.keys());

    const submissions = await QuestionBankSubmission.find({
      user_id: userId,
      course_id: { $in: courseIds },
    })
      .populate("course_id", "name status")
      .lean();

    const submissionByCourse = new Map();
    submissions.forEach((s) => submissionByCourse.set(s.course_id?._id?.toString(), s));

    const tasks = courseIds.map((cid) => {
      const meta = courseMap.get(cid);
      const sub = submissionByCourse.get(cid);
      return {
        id: sub?._id?.toString(),
        course_id: cid,
        course_name: meta?.name,
        course_status: meta?.status,
        status: sub?.status || "not_started",
        title: sub?.title || "",
        content: sub?.content || "",
        file_url: sub?.file_url || "",
        submitted_at: sub?.submitted_at,
        reviewed_at: sub?.reviewed_at,
        review_remarks: sub?.review_remarks || "",
      };
    });

    res.json({ tasks });
  } catch (err) {
    console.error("getMyTasks error:", err);
    res.status(500).json({ message: "Failed to load tasks" });
  }
};

// ——— Faculty: create or update submission (draft / submit) ———
exports.upsertSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { course_id, title, content, file_url, file_name, action } = req.body;
    if (!course_id) return res.status(400).json({ message: "course_id required" });

    const assigned = await FacultyCourseAssignment.findOne({ user_id: userId, course_id });
    const currentUser = await User.findById(userId).lean();
    const userName = (currentUser?.name || "").trim();
    const courseByFaculty = userName
      ? await AdminCourse.findOne({ _id: course_id, faculty: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).lean()
      : null;
    if (!assigned && !courseByFaculty) return res.status(403).json({ message: "You are not assigned to this course" });

    const isSubmit = action === "submit";
    const doc = await QuestionBankSubmission.findOneAndUpdate(
      { course_id, user_id: userId },
      {
        title: title ?? "",
        content: content ?? "",
        file_url: file_url ?? "",
        file_name: file_name ?? "",
        ...(isSubmit
          ? { status: "submitted", submitted_at: new Date() }
          : { status: "draft" }),
      },
      { returnDocument: 'after', upsert: true }
    )
      .populate("course_id", "name")
      .lean();

    res.json({
      id: doc._id.toString(),
      course_id: doc.course_id?._id?.toString(),
      course_name: doc.course_id?.name,
      status: doc.status,
      title: doc.title,
      content: doc.content,
      file_url: doc.file_url,
      submitted_at: doc.submitted_at,
    });
  } catch (err) {
    console.error("upsertSubmission error:", err);
    res.status(500).json({ message: "Failed to save" });
  }
};

// ——— Admin: list all submissions (optionally by course_id) ———
exports.listSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).populate("roles").lean();
    const roleNames = (user?.roles || []).map((r) => (r && r.role_name) || r).filter(Boolean);
    const isAdmin = roleNames.some((r) => (r || "").toLowerCase() === "admin" || (r || "").toLowerCase() === "super_admin");
    if (!isAdmin) return res.status(403).json({ message: "Admin only" });

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
        submitted_at: s.submitted_at,
        reviewed_at: s.reviewed_at,
        review_remarks: s.review_remarks,
      }))
    );
  } catch (err) {
    console.error("listSubmissions error:", err);
    res.status(500).json({ message: "Failed to list" });
  }
};

// ——— Admin: approve or reject ———
exports.reviewSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).populate("roles").lean();
    const roleNames = (user?.roles || []).map((r) => (r && r.role_name) || r).filter(Boolean);
    const isAdmin = roleNames.some((r) => (r || "").toLowerCase() === "admin" || (r || "").toLowerCase() === "super_admin");
    if (!isAdmin) return res.status(403).json({ message: "Admin only" });

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
        reviewed_by: userId,
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
    console.error("reviewSubmission error:", err);
    res.status(500).json({ message: "Failed to update" });
  }
};
