const PSCourse = require("../models/PSCourse");

exports.getCourses = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search && search.trim()) {
      filter.$or = [
        { name: new RegExp(search.trim(), "i") },
        { parentCourse: new RegExp(search.trim(), "i") },
        { description: new RegExp(search.trim(), "i") },
      ];
    }
    const list = await PSCourse.find(filter).sort({ name: 1 }).lean();
    res.json(
      list.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.description || "",
        status: c.status || "Active",
        level: !!c.level,
        parentCourse: c.parentCourse || "",
        prereq: Array.isArray(c.prereq) ? c.prereq : [],
        levels: Array.isArray(c.levels) ? c.levels : [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
    );
  } catch (err) {
    console.error("getCourses (PSCourse) error:", err);
    res.status(500).json({ message: err.message || "Failed to load courses" });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, description, status, level, parentCourse, prereq, levels } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "name is required" });
    const doc = await PSCourse.create({
      name: name.trim(),
      description: (description || "").trim(),
      status: status || "Active",
      level: !!level,
      parentCourse: (parentCourse || "").trim(),
      prereq: Array.isArray(prereq) ? prereq : [],
      levels: Array.isArray(levels) ? levels : [],
    });
    res.status(201).json({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      status: doc.status,
      level: doc.level,
      parentCourse: doc.parentCourse,
      prereq: doc.prereq || [],
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Course with this name already exists" });
    console.error("createCourse (PSCourse) error:", err);
    res.status(500).json({ message: err.message || "Failed to create course" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { name, description, status, level, parentCourse, prereq } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description.trim();
    if (status !== undefined) update.status = status;
    if (level !== undefined) update.level = !!level;
    if (parentCourse !== undefined) update.parentCourse = parentCourse.trim();
    if (prereq !== undefined) update.prereq = Array.isArray(prereq) ? prereq : [];
    const doc = await PSCourse.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ message: "Course not found" });
    res.json({
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      status: doc.status,
      level: doc.level,
      parentCourse: doc.parentCourse,
      prereq: doc.prereq || [],
    });
  } catch (err) {
    console.error("updateCourse (PSCourse) error:", err);
    res.status(500).json({ message: err.message || "Failed to update course" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const doc = await PSCourse.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteCourse (PSCourse) error:", err);
    res.status(500).json({ message: err.message || "Failed to delete" });
  }
};

exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ message: "ids array and status are required" });
    }
    const result = await PSCourse.updateMany(
      { _id: { $in: ids } },
      { $set: { status } }
    );
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    console.error("bulkUpdateStatus error:", err);
    res.status(500).json({ message: err.message || "Failed to update" });
  }
};
