const QuestionBankSubmission = require("../models/QuestionBankSubmission");

/**
 * Legacy DB state:
 * 1) Unique index on (course_id, user_id) only — blocks multi-level; remove via syncIndexes.
 * 2) Old submissions may omit level_index — findOneAndUpdate filter { level_index: 0 } won't match,
 *    upsert INSERTs → E11000 duplicate key on (course_id, user_id).
 */
async function ensureQuestionBankSubmissionIndexes() {
  const norm = await QuestionBankSubmission.updateMany(
    { $or: [{ level_index: { $exists: false } }, { level_index: null }] },
    { $set: { level_index: 0 } }
  );
  if (norm.modifiedCount > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[QuestionBankSubmission] Set default level_index on ${norm.modifiedCount} document(s)`
    );
  }

  await QuestionBankSubmission.syncIndexes();
  // eslint-disable-next-line no-console
  console.log("[QuestionBankSubmission] Indexes synced with schema (legacy 2-field unique dropped if present)");
}

module.exports = { ensureQuestionBankSubmissionIndexes };
