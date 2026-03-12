const QuestionTypeLayout = require("../models/QuestionTypeLayout");
const User = require("../models/User");

const isAdmin = async (userId) => {
  const user = await User.findById(userId).populate("roles").lean();
  const roleNames = (user?.roles || []).map((r) => (r && r.role_name) || r).filter(Boolean);
  return roleNames.some((r) => (r || "").toLowerCase() === "admin" || (r || "").toLowerCase() === "super_admin");
};

exports.list = async (req, res) => {
  try {
    const list = await QuestionTypeLayout.find().sort({ questionType: 1 }).lean();
    res.json(
      list.map((doc) => ({
        id: doc._id.toString(),
        questionType: doc.questionType,
        displayName: doc.displayName || doc.questionType,
        layout: doc.layout,
        updatedAt: doc.updatedAt,
      }))
    );
  } catch (err) {
    console.error("questionTypeLayout list error:", err);
    res.status(500).json({ message: "Failed to list question type layouts" });
  }
};

exports.getByType = async (req, res) => {
  try {
    const { questionType } = req.params;
    const doc = await QuestionTypeLayout.findOne({ questionType }).lean();
    if (!doc) return res.status(404).json({ message: "Question type layout not found" });
    res.json({
      id: doc._id.toString(),
      questionType: doc.questionType,
      displayName: doc.displayName || doc.questionType,
      layout: doc.layout,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("questionTypeLayout getByType error:", err);
    res.status(500).json({ message: "Failed to get layout" });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!(await isAdmin(userId))) return res.status(403).json({ message: "Admin only" });

    const { questionType, displayName, layout } = req.body;
    if (!questionType || !layout) return res.status(400).json({ message: "questionType and layout required" });

    const existing = await QuestionTypeLayout.findOne({ questionType });
    if (existing) return res.status(400).json({ message: "Question type already exists; use update" });

    const doc = await QuestionTypeLayout.create({
      questionType: String(questionType).trim(),
      displayName: displayName != null ? String(displayName) : questionType,
      layout,
    });
    res.status(201).json({
      id: doc._id.toString(),
      questionType: doc.questionType,
      displayName: doc.displayName,
      layout: doc.layout,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("questionTypeLayout create error:", err);
    res.status(500).json({ message: "Failed to create" });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!(await isAdmin(userId))) return res.status(403).json({ message: "Admin only" });

    const { id } = req.params;
    const { questionType, displayName, layout } = req.body;

    const doc = await QuestionTypeLayout.findByIdAndUpdate(
      id,
      {
        ...(questionType != null && { questionType: String(questionType).trim() }),
        ...(displayName != null && { displayName: String(displayName) }),
        ...(layout != null && { layout }),
      },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({
      id: doc._id.toString(),
      questionType: doc.questionType,
      displayName: doc.displayName,
      layout: doc.layout,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error("questionTypeLayout update error:", err);
    res.status(500).json({ message: "Failed to update" });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!(await isAdmin(userId))) return res.status(403).json({ message: "Admin only" });

    const { id } = req.params;
    const doc = await QuestionTypeLayout.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("questionTypeLayout remove error:", err);
    res.status(500).json({ message: "Failed to delete" });
  }
};
