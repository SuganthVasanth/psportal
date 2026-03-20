/**
 * Seed practice platform data: courses, levels, problems, one daily task.
 * Run from backend: node scripts/seedPracticeData.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const CodingProblem = require("../models/CodingProblem");
const DailyCodingTask = require("../models/DailyCodingTask");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected – seeding practice data\n");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const problemId = "practice-two-sum";
    await CodingProblem.findOneAndUpdate(
      { problemId },
      {
        problemId,
        title: "Two Sum",
        description: "Given an array of integers and a target, return indices of two numbers that add up to target.",
        courseId: "python",
        levelIndex: 0,
        topic: "Variables",
        exampleInputs: "nums = [2, 7, 11, 15], target = 9",
        exampleOutputs: "[0, 1]",
        constraints: "Exactly one solution. Same element not used twice.",
        hints: "Use a hash map.",
        sourcePlatform: "LeetCode",
        isActive: true,
      },
      { upsert: true }
    );

    await DailyCodingTask.findOneAndUpdate(
      { date: today },
      { taskId: "daily-" + today.toISOString().slice(0, 10), problemId, date: today, points: 10 },
      { upsert: true }
    );

    console.log("Practice seed done: courses, levels, 1 problem, daily task for today.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

seed();
