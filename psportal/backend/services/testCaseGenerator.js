/**
 * Generate 2–3 test cases per question dynamically by level. No DB.
 * Level 1: single integer → positive/negative/zero type output
 * Level 2: n → sum of first n numbers
 * Level 3: array (n + n numbers) → sum or max
 */

function normalizeOutput(s) {
  return (s || "").trim().replace(/\r\n/g, "\n");
}

function generateLevel1(problemId, seed = 0) {
  const cases = [
    { input: "5", expected: "positive" },
    { input: "-3", expected: "negative" },
    { input: "0", expected: "zero" },
  ];
  const idx = Math.abs(seed) % cases.length;
  return cases.slice(0, 3);
}

function generateLevel2(problemId, seed = 0) {
  const cases = [
    { input: "1", expected: "1" },
    { input: "5", expected: "15" },
    { input: "10", expected: "55" },
  ];
  return cases.slice(0, 3);
}

function generateLevel3(problemId, seed = 0) {
  const cases = [
    { input: "3\n1 2 3", expected: "6" },
    { input: "4\n10 20 30 40", expected: "100" },
    { input: "2\n-1 1", expected: "0" },
  ];
  return cases.slice(0, 3);
}

const generators = {
  1: generateLevel1,
  2: generateLevel2,
  3: generateLevel3,
};

/**
 * Generate 2–3 test cases for a level. Level is 1-based.
 */
function generateTestCases(level, problemId) {
  const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  const fn = generators[levelNum] || generators[1];
  const seed = problemId ? [...String(problemId)].reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return fn(problemId, seed);
}

function compareOutput(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

module.exports = { generateTestCases, compareOutput, normalizeOutput };
