const mongoose = require("mongoose");

const codingStreakSchema = new mongoose.Schema(
  {
    register_no: { type: String, required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodingStreak", codingStreakSchema, "coding_streaks");
