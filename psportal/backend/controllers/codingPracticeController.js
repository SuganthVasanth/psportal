const codeforcesService = require("../services/codeforcesService");
const judge0Service = require("../services/judge0Service");
const testCaseGenerator = require("../services/testCaseGenerator");
const WeeklyCodingSet = require("../models/WeeklyCodingSet");
const WebCodingSubmission = require("../models/WebCodingSubmission");

function getISOWeekKeyUTC(d) {
  // ISO week key: YYYY-Www using UTC date to avoid timezone drift.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday decides the year.
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * GET /api/problems/:level
 * Fetch Codeforces problems filtered by level (1, 2, 3). No DB.
 */
exports.getProblems = async (req, res) => {
  try {
    const { level } = req.params;
    const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
    const weekKey = getISOWeekKeyUTC(new Date());

    // Keep the same problem set for the whole week to prevent “refresh changes questions”.
    const existing = await WeeklyCodingSet.findOne({ weekKey, level: levelNum }).lean();
    if (existing?.problems?.length) {
      return res.json(existing.problems);
    }

    const list = await codeforcesService.getProblemsForLevel(levelNum);
    await WeeklyCodingSet.updateOne(
      { weekKey, level: levelNum },
      { $set: { problems: list } },
      { upsert: true }
    );
    return res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch problems" });
  }
};

/**
 * GET /api/coding/problem/:problemId
 * Fetch dynamic Codeforces statement/details for a problem.
 */
exports.getProblemDetails = async (req, res) => {
  try {
    const { problemId } = req.params || {};
    if (!problemId) return res.status(400).json({ message: "problemId is required" });
    const details = await codeforcesService.getProblemStatement(problemId);
    res.json(details);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch problem details" });
  }
};

/**
 * GET /api/coding/testcases/:level/:problemId
 * Generate and return dynamic test cases for a level + problemId (no DB).
 */
exports.getTestCases = async (req, res) => {
  try {
    const { level, problemId } = req.params || {};
    const levelNum = String(level || "1");
    
    // Try to get real examples from Codeforces first
    try {
      const details = await codeforcesService.getProblemStatement(problemId);
      if (details && Array.isArray(details.examples) && details.examples.length > 0) {
        return res.json(
          details.examples.map((tc, idx) => ({
            index: idx + 1,
            input: tc.input,
            expectedOutput: tc.output,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch real examples, falling back to generator:", e.message);
    }

    // Fallback to synthetic cases if real ones can't be fetched
    const cases = testCaseGenerator.generateTestCases(levelNum, problemId);
    res.json(
      (cases || []).map((tc, idx) => ({
        index: idx + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput || tc.expected,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to generate test cases" });
  }
};

/**
 * POST /api/run
 * Body: { code: string, stdin?: string }
 * Execute via Judge0, return stdout, stderr, time, memory.
 */
exports.run = async (req, res) => {
  try {
    const { source_code, code, stdin, language_id } = req.body || {};
    const src = typeof source_code === "string" ? source_code : code;
    if (typeof src !== "string") {
      return res.status(400).json({ success: false, error: "Missing or invalid 'source_code'" });
    }
    const result = await judge0Service.runCode({
      source_code: src,
      stdin: stdin || "",
      language_id: Number.isFinite(Number(language_id)) ? Number(language_id) : undefined,
    });
    res.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
      time: result.time,
      memory: result.memory,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Code execution failed. Try again.",
    });
  }
};

/**
 * POST /api/submit
 * Body: { code: string, level: string|number, problemId?: string }
 * Generate test cases for level, run each via Judge0, compare output.
 */
exports.submit = async (req, res) => {
  try {
    const { source_code, code, stdin, language_id, language, level, problemId, register_no } = req.body || {};
    const src = typeof source_code === "string" ? source_code : code;
    if (typeof src !== "string") {
      return res.status(400).json({ success: false, error: "Missing or invalid 'source_code'" });
    }
    const levelNum = String(level || "1");
    
    // Use real examples for submission if possible
    let cases = [];
    try {
      const details = await codeforcesService.getProblemStatement(problemId);
      if (details && Array.isArray(details.examples) && details.examples.length > 0) {
        cases = details.examples.map((ex) => ({
          input: ex.input,
          expected: ex.output,
        }));
      }
    } catch (e) {
      console.error("Submission: Failed to fetch real examples, falling back:", e.message);
    }

    if (!cases.length) {
      cases = testCaseGenerator.generateTestCases(levelNum, problemId);
    }

    const results = [];
    let passed = 0;
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      try {
        const runResult = await judge0Service.runCode({
          source_code: src,
          stdin: tc.input ?? stdin ?? "",
          language_id: Number.isFinite(Number(language_id)) ? Number(language_id) : undefined,
        });
        const ok =
          runResult.success &&
          testCaseGenerator.compareOutput(runResult.stdout, tc.expected);
        results.push({
          index: i + 1,
          passed: ok,
          expected: tc.expected,
          actual: (runResult.stdout || "").trim(),
          stderr: runResult.stderr || undefined,
          time: runResult.time,
          memory: runResult.memory,
          status: runResult.status,
        });
        if (ok) passed++;
      } catch (e) {
        results.push({
          index: i + 1,
          passed: false,
          expected: tc.expected,
          actual: null,
          error: "Code execution failed. Try again.",
        });
      }
    }

    // Persist user code & completion state for “visit anytime”.
    const rn = (register_no || "").toString().trim() || "guest";
    const lang = (language || "c").toString().trim() || "c";
    const verdict = passed === cases.length ? "Accepted" : "Failed";
    const isAccepted = verdict === "Accepted";

    const query = { register_no: rn, level: Number(levelNum), problemId: problemId };
    const existing = await WebCodingSubmission.findOne(query);
    if (!existing) {
      await WebCodingSubmission.create({
        ...query,
        language: lang,
        stdin: typeof stdin === "string" ? stdin : "",
        code: src,
        isAccepted,
        lastVerdict: verdict,
        lastPassed: passed,
        lastTotal: cases.length,
        lastSubmittedAt: new Date(),
      });
    } else {
      existing.language = lang;
      existing.stdin = typeof stdin === "string" ? stdin : "";
      existing.code = src;
      existing.lastVerdict = verdict;
      existing.lastPassed = passed;
      existing.lastTotal = cases.length;
      existing.lastSubmittedAt = new Date();
      // Once accepted, never downgrade.
      if (isAccepted) existing.isAccepted = true;
      await existing.save();
    }

    res.json({
      success: passed === cases.length,
      passed,
      total: cases.length,
      verdict,
      submissionSaved: true,
      results,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Code execution failed. Try again.",
      passed: 0,
      total: 0,
      verdict: "Failed",
      results: [],
    });
  }
};

/**
 * GET /api/coding/submission?level=1&problemId=...&register_no=...
 * Return last saved code/stdin/language for a user problem (any week).
 */
exports.getSubmission = async (req, res) => {
  try {
    const { level, problemId } = req.query || {};
    const register_no = (req.query.register_no || "").toString().trim() || (req.user && req.user.register_no) || "guest";
    const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
    if (!problemId) return res.status(400).json({ message: "problemId required" });

    const doc = await WebCodingSubmission.findOne({ register_no, level: levelNum, problemId }).lean();
    if (!doc) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      register_no: doc.register_no,
      level: doc.level,
      problemId: doc.problemId,
      language: doc.language || "c",
      stdin: doc.stdin || "",
      code: doc.code || "",
      isAccepted: !!doc.isAccepted,
      lastVerdict: doc.lastVerdict || (doc.isAccepted ? "Accepted" : "Failed"),
      lastPassed: doc.lastPassed ?? 0,
      lastTotal: doc.lastTotal ?? 0,
      lastSubmittedAt: doc.lastSubmittedAt || null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load submission" });
  }
};

/**
 * GET /api/coding/submissions/status?level=1&register_no=...
 * Status is returned only for the current weekly set problems.
 */
exports.getSubmissionStatus = async (req, res) => {
  try {
    const { level } = req.query || {};
    const register_no = (req.query.register_no || "").toString().trim() || (req.user && req.user.register_no) || "guest";
    const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
    const weekKey = getISOWeekKeyUTC(new Date());

    let weekSet = await WeeklyCodingSet.findOne({ weekKey, level: levelNum }).lean();
    let problemIds = Array.isArray(weekSet?.problems) ? weekSet.problems.map((p) => p.problemId) : [];
    if (!problemIds.length) {
      // Ensure status endpoint works even if called before /problems (both run concurrently on mount).
      const list = await codeforcesService.getProblemsForLevel(levelNum);
      await WeeklyCodingSet.updateOne(
        { weekKey, level: levelNum },
        { $set: { problems: list } },
        { upsert: true }
      );
      problemIds = list.map((p) => p.problemId);
    }
    if (!problemIds.length) {
      return res.json({ statuses: [] });
    }

    const subs = await WebCodingSubmission.find({ register_no, level: levelNum, problemId: { $in: problemIds } }).lean();

    return res.json({
      statuses: subs.map((s) => ({
        problemId: s.problemId,
        isAccepted: !!s.isAccepted,
        lastVerdict: s.lastVerdict || (s.isAccepted ? "Accepted" : "Failed"),
        lastSubmittedAt: s.lastSubmittedAt || null,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load submission status" });
  }
};
