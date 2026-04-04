/**
 * Utility to pick a random subset of questions from a pool.
 * Uses Fisher-Yates shuffle for unbiased randomness.
 * @param {Array} pool - Array of question objects.
 * @param {number} count - Number of items to pick.
 * @returns {Array} Randomly selected items (max `count`).
 */
function pickRandomQuestions(pool, count) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

module.exports = { pickRandomQuestions };
