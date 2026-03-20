const CodingProblem = require("../models/CodingProblem");
const CodingSubmission = require("../models/CodingSubmission");
const CodingStreak = require("../models/CodingStreak");
const DailyCodingTask = require("../models/DailyCodingTask");
const PracticeCourse = require("../models/PracticeCourse");
const AdminCourse = require("../models/AdminCourse");
const PracticeLevel = require("../models/PracticeLevel");
const StudentLevelProgress = require("../models/StudentLevelProgress");

const startOfDayUTC = (d) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

/** GET /api/practice/courses - list practice courses (from MongoDB)
 *  1. Prefer dedicated PracticeCourse docs (code + name).
 *  2. If none exist, fall back to AdminCourse (status Active) and
 *     optionally filter by student's \"My Courses\" (StudentLevelProgress).
 */
exports.getCourses = async (req, res) => {
  try {
    const register_no = (req.query.register_no || "").trim();
    let list = await PracticeCourse.find({ isActive: true }).sort({ order: 1, code: 1 }).lean();

    if (!list.length) {
      let courseFilter = { status: "Active" };
      if (register_no) {
        const slp = await StudentLevelProgress.find({ register_no }).lean();
        const ids = [...new Set(slp.map((p) => p.course_id))];
        if (ids.length) {
          courseFilter = { status: "Active", _id: { $in: ids } };
        }
      }
      const adminCourses = await AdminCourse.find(courseFilter).sort({ name: 1 }).lean();
      list = adminCourses.map((c) => ({
        _id: c._id,
        name: c.name,
        code: c._id.toString(),
        description: c.description || "",
        order: 0,
        isActive: true,
      }));
    }

    res.json(list.map((c) => ({ id: c._id.toString(), name: c.name, code: c.code, description: c.description || "" })));
  } catch (err) {
    console.error("getCourses error:", err);
    res.status(500).json({ message: "Failed to load courses" });
  }
};

/** GET /api/practice/courses/:courseId/levels - levels for a course */
exports.getLevels = async (req, res) => {
  try {
    const { courseId } = req.params;
    const register_no = (req.query.register_no || "").trim();

    // Prefer dedicated PracticeLevel definitions if present
    let levels = await PracticeLevel.find({ courseId }).sort({ levelIndex: 1 }).lean();

    if (!levels.length) {
      // Fall back to AdminCourse.levels array and student's \"My Courses\" progress
      const course = await AdminCourse.findById(courseId).lean();
      if (!course || !Array.isArray(course.levels)) {
        return res.json([]);
      }

      let allowedIndices = null;
      if (register_no) {
        const slp = await StudentLevelProgress.find({ register_no, course_id: courseId }).lean();
        if (slp.length) {
          allowedIndices = new Set(slp.map((p) => p.level_index));
        }
      }

      levels = course.levels.map((lvl, idx) => ({
        id: `${courseId}-${idx}`,
        courseId,
        levelIndex: idx,
        name: lvl.name || `Level ${idx + 1}`,
      }));

      if (allowedIndices) {
        levels = levels.filter((l) => allowedIndices.has(l.levelIndex));
      }
    } else {
      levels = levels.map((l) => ({ id: l._id.toString(), ...l }));
    }

    res.json(levels);
  } catch (err) {
    console.error("getLevels error:", err);
    res.status(500).json({ message: "Failed to load levels" });
  }
};

/** GET /api/practice/problems - list problems (filter by courseId, levelIndex, topic) */
exports.getProblems = async (req, res) => {
  try {
    const { courseId, levelIndex, topic } = req.query;
    const filter = { isActive: true };
    if (courseId) filter.courseId = courseId;
    if (levelIndex !== undefined && levelIndex !== "") filter.levelIndex = Number(levelIndex);
    if (topic && topic.trim()) filter.topic = new RegExp(topic.trim(), "i");

    const problems = await CodingProblem.find(filter).sort({ courseId: 1, levelIndex: 1, topic: 1 }).lean();

    const problemIds = problems.map((p) => p.problemId);
    const acceptedCounts = await CodingSubmission.aggregate([
      { $match: { problemId: { $in: problemIds }, result: { $in: ["accepted", "Accepted"] } } },
      { $group: { _id: "$problemId", count: { $sum: 1 } } },
    ]);
    const totalAttempts = await CodingSubmission.aggregate([
      { $match: { problemId: { $in: problemIds } } },
      { $group: { _id: "$problemId", count: { $sum: 1 } } },
    ]);
    const acceptedMap = new Map(acceptedCounts.map((a) => [a._id, a.count]));
    const totalMap = new Map(totalAttempts.map((a) => [a._id, a.count]));

    const out = problems.map((p) => {
      const total = totalMap.get(p.problemId) || 0;
      const accepted = acceptedMap.get(p.problemId) || 0;
      const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : null;
      return {
        id: p._id.toString(),
        problemId: p.problemId,
        title: p.title,
        courseId: p.courseId,
        levelIndex: p.levelIndex,
        topic: p.topic,
        sourcePlatform: p.sourcePlatform,
        acceptanceRate,
        totalAttempts: total,
      };
    });
    res.json(out);
  } catch (err) {
    console.error("getProblems error:", err);
    res.status(500).json({ message: "Failed to load problems" });
  }
};

/** GET /api/practice/problems/:problemId - single problem for coding page */
exports.getProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const problem = await CodingProblem.findOne({ problemId, isActive: true }).lean();
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json({
      id: problem._id.toString(),
      problemId: problem.problemId,
      title: problem.title,
      description: problem.description || "",
      courseId: problem.courseId,
      levelIndex: problem.levelIndex,
      topic: problem.topic,
      constraints: problem.constraints || "",
      hints: problem.hints || "",
      exampleInputs: problem.exampleInputs || "",
      exampleOutputs: problem.exampleOutputs || "",
      sourcePlatform: problem.sourcePlatform || "",
      linkToOriginalProblem: problem.linkToOriginalProblem || "",
    });
  } catch (err) {
    console.error("getProblem error:", err);
    res.status(500).json({ message: "Failed to load problem" });
  }
};

/** GET /api/practice/daily-task - today's daily coding task */
exports.getDailyTask = async (req, res) => {
  try {
    const today = startOfDayUTC(new Date());
    const task = await DailyCodingTask.findOne({ date: today }).lean();
    if (!task) {
      return res.json({ task: null, problem: null });
    }
    const problem = await CodingProblem.findOne({ problemId: task.problemId, isActive: true }).lean();
    res.json({
      task: { taskId: task.taskId, problemId: task.problemId, date: task.date, points: task.points },
      problem: problem
        ? {
            problemId: problem.problemId,
            title: problem.title,
            topic: problem.topic,
            courseId: problem.courseId,
            levelIndex: problem.levelIndex,
          }
        : null,
    });
  } catch (err) {
    console.error("getDailyTask error:", err);
    res.status(500).json({ message: "Failed to load daily task" });
  }
};

/** GET /api/practice/streak - streak for register_no */
exports.getStreak = async (req, res) => {
  try {
    const register_no = (req.query.register_no || "").trim() || (req.user && req.user.register_no);
    if (!register_no) return res.status(400).json({ message: "register_no required" });
    let streak = await CodingStreak.findOne({ register_no }).lean();
    if (!streak) streak = { register_no, currentStreak: 0, lastActivityDate: null };
    res.json({
      register_no: streak.register_no,
      currentStreak: streak.currentStreak || 0,
      lastActivityDate: streak.lastActivityDate || null,
    });
  } catch (err) {
    console.error("getStreak error:", err);
    res.status(500).json({ message: "Failed to load streak" });
  }
};

/** GET /api/practice/submissions - list submissions for register_no */
exports.getSubmissions = async (req, res) => {
  try {
    const register_no = (req.query.register_no || "").trim() || (req.user && req.user.register_no);
    if (!register_no) return res.status(400).json({ message: "register_no required" });
    const list = await CodingSubmission.find({ register_no }).sort({ submittedAt: -1 }).limit(100).lean();
    res.json(list.map((s) => ({ id: s._id.toString(), ...s })));
  } catch (err) {
    console.error("getSubmissions error:", err);
    res.status(500).json({ message: "Failed to load submissions" });
  }
};

/** POST /api/practice/submit - submit code (store in MongoDB) */
exports.submit = async (req, res) => {
  try {
    const { problemId, courseId, language, code, result, executionTime } = req.body;
    const register_no = (req.body.register_no || "").trim() || (req.user && req.user.register_no);
    const userId = req.user && (req.user.userId || req.user.id);

    if (!problemId || !courseId || !language) {
      return res.status(400).json({ message: "problemId, courseId and language required" });
    }

    const doc = await CodingSubmission.create({
      userId: userId || null,
      register_no: register_no || "guest",
      problemId,
      courseId,
      language,
      code: code || "",
      result: result || "pending",
      executionTime: executionTime ?? null,
      submittedAt: new Date(),
    });

    if ((result || "").toLowerCase() === "accepted" && register_no) {
      const today = startOfDayUTC(new Date());
      let streakDoc = await CodingStreak.findOne({ register_no });
      if (!streakDoc) {
        streakDoc = await CodingStreak.create({ register_no, currentStreak: 0, lastActivityDate: null });
      }
      const last = streakDoc.lastActivityDate ? startOfDayUTC(streakDoc.lastActivityDate) : null;
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      if (!last || last.getTime() === yesterday.getTime()) {
        streakDoc.currentStreak = (streakDoc.currentStreak || 0) + 1;
      } else if (last.getTime() !== today.getTime()) {
        streakDoc.currentStreak = 1;
      }
      streakDoc.lastActivityDate = new Date();
      await streakDoc.save();
    }

    res.status(201).json({
      id: doc._id.toString(),
      problemId: doc.problemId,
      result: doc.result,
      submittedAt: doc.submittedAt,
    });
  } catch (err) {
    console.error("submit error:", err);
    res.status(500).json({ message: err.message || "Failed to submit" });
  }
};

/** GET /api/practice/leaderboard - rank by problems solved, then streak, then points */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const solvedCounts = await CodingSubmission.aggregate([
      { $match: { result: { $in: ["accepted", "Accepted"] } } },
      { $group: { _id: "$register_no", solved: { $sum: 1 }, distinctProblems: { $addToSet: "$problemId" } } },
      { $project: { register_no: "$_id", solved: { $size: "$distinctProblems" } } },
    ]);

    const streaks = await CodingStreak.find({}).lean();
    const streakMap = new Map(streaks.map((s) => [s.register_no, s.currentStreak || 0]));
    const solvedMap = new Map(solvedCounts.map((s) => [s.register_no, s.solved]));

    const registerNos = [...new Set([...solvedMap.keys(), ...streakMap.keys()])];
    const rows = registerNos.map((register_no) => ({
      register_no,
      problemsSolved: solvedMap.get(register_no) || 0,
      streak: streakMap.get(register_no) || 0,
    }));
    rows.sort((a, b) => {
      if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
      return (b.streak || 0) - (a.streak || 0);
    });

    const leaderboard = rows.slice(0, limit).map((r, i) => ({
      rank: i + 1,
      register_no: r.register_no,
      problemsSolved: r.problemsSolved,
      streak: r.streak,
      points: r.problemsSolved * 10 + r.streak * 5,
    }));
    res.json(leaderboard);
  } catch (err) {
    console.error("getLeaderboard error:", err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
};

/** GET /api/practice/dashboard - data for dashboard (daily task, streak, recent activity, recommended, achievements) */
exports.getDashboard = async (req, res) => {
  try {
    const register_no = (req.query.register_no || "").trim() || (req.user && req.user.register_no);
    const today = startOfDayUTC(new Date());

    const [dailyTaskDoc, streakDoc, recentSubmissions, dailyTaskProblem, recommendedProblems] = await Promise.all([
      DailyCodingTask.findOne({ date: today }).lean(),
      register_no ? CodingStreak.findOne({ register_no }).lean() : null,
      register_no ? CodingSubmission.find({ register_no }).sort({ submittedAt: -1 }).limit(10).lean() : [],
      null,
      CodingProblem.find({ isActive: true }).sort({ _id: -1 }).limit(6).lean(),
    ]);

    let dailyTask = null;
    let dailyProblem = null;
    if (dailyTaskDoc) {
      dailyProblem = await CodingProblem.findOne({ problemId: dailyTaskDoc.problemId, isActive: true }).lean();
      dailyTask = {
        taskId: dailyTaskDoc.taskId,
        problemId: dailyTaskDoc.problemId,
        date: dailyTaskDoc.date,
        points: dailyTaskDoc.points,
        title: dailyProblem ? dailyProblem.title : null,
        topic: dailyProblem ? dailyProblem.topic : null,
      };
    }

    const recentActivity = recentSubmissions.map((s) => ({
      id: s._id.toString(),
      problemId: s.problemId,
      result: s.result,
      submittedAt: s.submittedAt,
    }));

    const recommended = recommendedProblems.map((p) => ({
      problemId: p.problemId,
      title: p.title,
      topic: p.topic,
      courseId: p.courseId,
    }));

    const acceptedCount = register_no
      ? await CodingSubmission.countDocuments({ register_no, result: { $in: ["accepted", "Accepted"] } })
      : 0;
    const achievements = [
      { id: "first_solve", name: "First Solve", unlocked: acceptedCount >= 1 },
      { id: "streak_5", name: "5 Day Streak", unlocked: (streakDoc && streakDoc.currentStreak >= 5) || false },
      { id: "streak_15", name: "15 Day Streak", unlocked: (streakDoc && streakDoc.currentStreak >= 15) || false },
    ];

    res.json({
      dailyTask,
      streak: streakDoc ? { currentStreak: streakDoc.currentStreak || 0, lastActivityDate: streakDoc.lastActivityDate } : { currentStreak: 0, lastActivityDate: null },
      recentActivity,
      recommended,
      achievements,
    });
  } catch (err) {
    console.error("getDashboard practice error:", err);
    res.status(500).json({ message: "Failed to load practice dashboard" });
  }
};
