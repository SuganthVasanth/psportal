const AdminCourse = require("../models/AdminCourse");
const StudentLevelProgress = require("../models/StudentLevelProgress");

// Group by course name so same name = one course with combined levels (one card per name)
function groupCoursesByName(list) {
  const byName = new Map();
  for (const c of list) {
    const name = (c.name || "").trim();
    if (!name) continue;
    const id = c._id.toString();
    const levelsCount = Array.isArray(c.levels) ? c.levels.length : 0;
    if (!byName.has(name)) {
      byName.set(name, { id, name, type: c.type || "", course_logo: c.course_logo || "", levelsCount: 0 });
    }
    const entry = byName.get(name);
    entry.levelsCount += levelsCount;
    if (c.type) entry.type = c.type;
    if (c.course_logo) entry.course_logo = c.course_logo;
  }
  return Array.from(byName.values()).map(({ id, name, type, course_logo, levelsCount }) => ({
    id,
    name,
    type,
    course_logo,
    levelsCount,
  }));
}

exports.getAvailableCourses = async (req, res) => {
  try {
    const list = await AdminCourse.find({ status: "Active" }).sort({ _id: 1 }).lean();
    const grouped = groupCoursesByName(list);
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Merge levels from all docs with the same course name; remap prerequisiteLevelIndex by offset.
// Returns { levels, mergedToSource } where mergedToSource[i] = { course_id, level_index } for the i-th merged level.
function mergeLevelsFromDocs(docs) {
  const merged = [];
  const mergedToSource = [];
  let offset = 0;
  for (const doc of docs) {
    const levels = Array.isArray(doc.levels) ? doc.levels : [];
    const docId = doc._id.toString();
    for (let i = 0; i < levels.length; i++) {
      const l = levels[i];
      const arr = Array.isArray(l.prerequisiteLevelIndices) && l.prerequisiteLevelIndices.length > 0
        ? l.prerequisiteLevelIndices
        : (l.prerequisiteLevelIndex != null && l.prerequisiteLevelIndex >= 0 ? [l.prerequisiteLevelIndex] : []);
      const remapped = arr.map((p) => p + offset).filter((p) => p >= 0);
      merged.push({
        name: l.name || "",
        rewardPoints: l.rewardPoints ?? 0,
        prerequisiteLevelIndex: remapped[0] ?? -1,
        prerequisiteLevelIndices: remapped,
        assessmentType: l.assessmentType || "MCQ",
        topics: Array.isArray(l.topics) ? l.topics : [],
      });
      mergedToSource.push({ course_id: docId, level_index: i });
    }
    offset += levels.length;
  }
  return { levels: merged, mergedToSource };
}

async function getSameNameCourseData(course_id) {
  const course = await AdminCourse.findById(course_id).lean();
  if (!course) return null;
  const courseName = (course.name || "").trim();
  const sameNameDocs = await AdminCourse.find({ status: "Active", name: courseName }).sort({ _id: 1 }).lean();
  const { levels, mergedToSource } = mergeLevelsFromDocs(sameNameDocs);
  return { course, sameNameDocs, levels, mergedToSource };
}

exports.getCourseById = async (req, res) => {
  try {
    const data = await getSameNameCourseData(req.params.id);
    if (!data) return res.status(404).json({ message: "Course not found" });
    const { sameNameDocs, levels } = data;
    const first = sameNameDocs[0];
    res.json({
      id: first._id.toString(),
      name: first.name,
      description: first.description || "",
      type: first.type || "",
      course_logo: first.course_logo || "",
      levels,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentLevelProgress = async (req, res) => {
  try {
    const course_id = req.params.id;
    const { register_no } = req.query;
    if (!register_no) {
      return res.status(400).json({ message: "register_no required" });
    }
    const data = await getSameNameCourseData(course_id);
    if (!data) return res.status(404).json({ message: "Course not found" });
    const { sameNameDocs, mergedToSource } = data;
    const courseIds = sameNameDocs.map((d) => d._id.toString());
    const list = await StudentLevelProgress.find({ register_no, course_id: { $in: courseIds } }).lean();
    const sourceToMerged = new Map();
    mergedToSource.forEach((src, mergedIdx) => {
      const key = `${src.course_id}:${src.level_index}`;
      sourceToMerged.set(key, mergedIdx);
    });
    const out = list.map((p) => {
      const key = `${p.course_id}:${p.level_index}`;
      const mergedIndex = sourceToMerged.get(key);
      if (mergedIndex == null) return null;
      return { level_index: mergedIndex, status: p.status, completed_at: p.completed_at };
    }).filter(Boolean);
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.registerLevel = async (req, res) => {
  try {
    const { id: course_id } = req.params;
    const { register_no, level_index } = req.body;
    if (register_no == null || level_index == null) {
      return res.status(400).json({ message: "register_no and level_index required" });
    }
    const mergedIdx = Number(level_index);
    if (Number.isNaN(mergedIdx) || mergedIdx < 0) {
      return res.status(400).json({ message: "Invalid level_index" });
    }

    const data = await getSameNameCourseData(course_id);
    if (!data) return res.status(404).json({ message: "Course not found" });
    const { levels, mergedToSource } = data;
    if (mergedIdx >= levels.length) {
      return res.status(400).json({ message: "Level index out of range" });
    }

    const prereqIndices = levels[mergedIdx].prerequisiteLevelIndices ?? (
      (levels[mergedIdx].prerequisiteLevelIndex != null && levels[mergedIdx].prerequisiteLevelIndex >= 0)
        ? [levels[mergedIdx].prerequisiteLevelIndex] : []);
    for (const prereqIndex of prereqIndices) {
      if (prereqIndex < 0 || prereqIndex >= mergedToSource.length) continue;
      const prereqSrc = mergedToSource[prereqIndex];
      const prereqCompleted = await StudentLevelProgress.findOne({
        register_no,
        course_id: prereqSrc.course_id,
        level_index: prereqSrc.level_index,
        status: "completed",
      });
      if (!prereqCompleted) {
        return res.status(403).json({
          message: "All prerequisite levels must be completed before registering for this level",
        });
      }
    }

    const src = mergedToSource[mergedIdx];
    const existing = await StudentLevelProgress.findOne({
      register_no,
      course_id: src.course_id,
      level_index: src.level_index,
    });
    if (existing) {
      return res.status(200).json({
        message: "Already enrolled",
        progress: { level_index: mergedIdx, status: existing.status },
      });
    }

    await StudentLevelProgress.create({
      register_no,
      course_id: src.course_id,
      level_index: src.level_index,
      status: "enrolled",
    });
    res.status(201).json({ level_index: mergedIdx, status: "enrolled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.completeLevel = async (req, res) => {
  try {
    const { id: course_id } = req.params;
    const { register_no, level_index } = req.body;
    if (register_no == null || level_index == null) {
      return res.status(400).json({ message: "register_no and level_index required" });
    }
    const mergedIdx = Number(level_index);
    const data = await getSameNameCourseData(course_id);
    if (!data) return res.status(404).json({ message: "Course not found" });
    const { mergedToSource } = data;
    if (mergedIdx >= mergedToSource.length) return res.status(400).json({ message: "Level index out of range" });
    const src = mergedToSource[mergedIdx];
    const doc = await StudentLevelProgress.findOneAndUpdate(
      { register_no, course_id: src.course_id, level_index: src.level_index },
      { status: "completed", completed_at: new Date() },
      { returnDocument: 'after' }
    );
    if (!doc) return res.status(404).json({ message: "Enrollment not found" });
    res.json({ level_index: mergedIdx, status: doc.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
