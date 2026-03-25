const Task = require("../models/Task");
const TaskRegistration = require("../models/TaskRegistration");
const Student = require("../models/Student");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

exports.createTask = async (req, res) => {
  try {
    const { topic, facultyName, date, googleClassroomLink, createdByUserId } = req.body || {};
    if (!topic || !facultyName || !date || !googleClassroomLink) {
      return res.status(400).json({ message: "topic, facultyName, date and googleClassroomLink are required" });
    }

    const task = await Task.create({
      topic: String(topic).trim(),
      facultyName: String(facultyName).trim(),
      createdByUserId: String(createdByUserId || "").trim() || undefined,
      date: new Date(date),
      googleClassroomLink: String(googleClassroomLink).trim(),
    });

    return res.status(201).json({
      id: task._id.toString(),
      topic: task.topic,
      facultyName: task.facultyName,
      createdByUserId: task.createdByUserId || "",
      date: task.date,
      googleClassroomLink: task.googleClassroomLink,
      createdAt: task.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to create task" });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const todayOnly = String(req.query.today || "").toLowerCase() === "true";
    const facultyName = String(req.query.facultyName || "").trim();
    const registerNo = String(req.query.register_no || "").trim();
    const createdByUserId = String(req.query.createdByUserId || "").trim();
    const filter = {};

    if (todayOnly) {
      const now = new Date();
      filter.date = { $gte: startOfDay(now), $lte: endOfDay(now) };
    }
    if (createdByUserId && facultyName) {
      filter.$or = [
        { createdByUserId },
        { facultyName: new RegExp(`^${facultyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ];
    } else if (createdByUserId) {
      filter.createdByUserId = createdByUserId;
    } else if (facultyName) {
      filter.facultyName = new RegExp(`^${facultyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    const tasks = await Task.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    let registeredTaskIds = new Set();
    if (registerNo && tasks.length) {
      const regs = await TaskRegistration.find({
        register_no: registerNo,
        taskId: { $in: tasks.map((t) => t._id) },
      })
        .select("taskId")
        .lean();
      registeredTaskIds = new Set(regs.map((r) => String(r.taskId)));
    }
    return res.json(
      tasks.map((t) => ({
        id: t._id.toString(),
        topic: t.topic,
        facultyName: t.facultyName,
        createdByUserId: t.createdByUserId || "",
        date: t.date,
        googleClassroomLink: t.googleClassroomLink,
        createdAt: t.createdAt,
        isRegistered: registeredTaskIds.has(String(t._id)),
      }))
    );
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load tasks" });
  }
};

exports.registerForTask = async (req, res) => {
  try {
    const { taskId } = req.params || {};
    const { register_no, studentName } = req.body || {};

    if (!taskId || !register_no) {
      return res.status(400).json({ message: "taskId and register_no are required" });
    }

    const task = await Task.findById(taskId).select("_id").lean();
    if (!task) return res.status(404).json({ message: "Task not found" });

    const regNo = String(register_no).trim();
    const student = await Student.findOne({ register_no: regNo }).select("name register_no").lean();

    const registration = await TaskRegistration.findOneAndUpdate(
      { taskId, register_no: regNo },
      {
        $set: {
          studentName: String(studentName || student?.name || "").trim(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      id: registration._id.toString(),
      taskId: registration.taskId.toString(),
      register_no: registration.register_no,
      studentName: registration.studentName || student?.name || "",
      registeredAt: registration.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to register for task" });
  }
};

exports.getClassroomSummaries = async (_req, res) => {
  try {
    const tasks = await Task.find({}).sort({ date: -1, createdAt: -1 }).lean();
    if (!tasks.length) return res.json([]);

    const counts = await TaskRegistration.aggregate([
      { $group: { _id: "$taskId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    return res.json(
      tasks.map((t) => ({
        id: t._id.toString(),
        topic: t.topic,
        facultyName: t.facultyName,
        date: t.date,
        googleClassroomLink: t.googleClassroomLink,
        studentCount: countMap.get(String(t._id)) || 0,
        createdAt: t.createdAt,
      }))
    );
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load classrooms" });
  }
};

exports.getClassroomStudents = async (req, res) => {
  try {
    const { taskId } = req.params || {};
    if (!taskId) return res.status(400).json({ message: "taskId is required" });

    const task = await Task.findById(taskId).lean();
    if (!task) return res.status(404).json({ message: "Classroom not found" });

    const registrations = await TaskRegistration.find({ taskId }).sort({ createdAt: -1 }).lean();
    const regNos = registrations.map((r) => r.register_no).filter(Boolean);
    const students = regNos.length
      ? await Student.find({ register_no: { $in: regNos } })
          .select("name register_no department year type")
          .lean()
      : [];
    const studentMap = new Map(students.map((s) => [String(s.register_no), s]));

    return res.json({
      classroom: {
        id: task._id.toString(),
        topic: task.topic,
        facultyName: task.facultyName,
        date: task.date,
        googleClassroomLink: task.googleClassroomLink,
      },
      students: registrations.map((r) => {
        const s = studentMap.get(String(r.register_no));
        return {
          id: r._id.toString(),
          register_no: r.register_no,
          name: s?.name || r.studentName || "Student",
          department: s?.department || "—",
          year: s?.year || "—",
          type: s?.type || "—",
          registeredAt: r.createdAt,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load classroom students" });
  }
};

