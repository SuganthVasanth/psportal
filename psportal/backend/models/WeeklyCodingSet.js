const mongoose = require("mongoose");

const weeklyCodingSetSchema = new mongoose.Schema(
  {
    weekKey: { type: String, required: true, index: true }, // e.g. 2026-W12
    level: { type: Number, required: true, index: true }, // 1..3
    problems: { type: Array, default: [] }, // stored snapshot (problemId/title/rating/tags/link)
  },
  { timestamps: true }
);

weeklyCodingSetSchema.index({ weekKey: 1, level: 1 }, { unique: true });

module.exports = mongoose.model("WeeklyCodingSet", weeklyCodingSetSchema, "weekly_coding_sets");

