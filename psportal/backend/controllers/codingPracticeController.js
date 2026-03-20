const codeforcesService = require("../services/codeforcesService");
const judge0Service = require("../services/judge0Service");
const testCaseGenerator = require("../services/testCaseGenerator");

/**
 * GET /api/problems/:level
 * Fetch Codeforces problems filtered by level (1, 2, 3). No DB.
 */
exports.getProblems = async (req, res) => {
  try {
    const { level } = req.params;
    const list = await codeforcesService.getProblemsForLevel(level);
    res.json(list);
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
    const cases = testCaseGenerator.generateTestCases(levelNum, problemId);
    res.json(
      (cases || []).map((tc, idx) => ({
        index: idx + 1,
        input: tc.input,
        expectedOutput: tc.expected,
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
    const { source_code, code, stdin, language_id, level, problemId } = req.body || {};
    const src = typeof source_code === "string" ? source_code : code;
    if (typeof src !== "string") {
      return res.status(400).json({ success: false, error: "Missing or invalid 'source_code'" });
    }
    const levelNum = String(level || "1");
    const cases = testCaseGenerator.generateTestCases(levelNum, problemId);
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
    res.json({
      success: passed === cases.length,
      passed,
      total: cases.length,
      verdict: passed === cases.length ? "Accepted" : "Failed",
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
