const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const CodingProblem = require("../models/CodingProblem");

function toSafeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function makeProblemId(item, index) {
  const level = Number(item?.level) || 1;
  const qn = Number(item?.questionNumber) || index + 1;
  const titleSlug = toSafeString(item?.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `c1-l${level}-q${qn}${titleSlug ? `-${titleSlug}` : ""}`;
}

function buildConstraints(item) {
  const bits = [];
  const difficulty = toSafeString(item?.difficulty);
  const inputFormat = toSafeString(item?.inputFormat);
  const outputFormat = toSafeString(item?.outputFormat);
  if (difficulty) bits.push(`Difficulty: ${difficulty}`);
  if (inputFormat) bits.push(`Input: ${inputFormat}`);
  if (outputFormat) bits.push(`Output: ${outputFormat}`);
  return bits.join("\n");
}

function mapQuestionToCodingProblem(item, index) {
  const sample = Array.isArray(item?.sampleCases) && item.sampleCases.length > 0 ? item.sampleCases[0] : null;
  return {
    problemId: makeProblemId(item, index),
    title: toSafeString(item?.title) || `C1 Question ${index + 1}`,
    description: toSafeString(item?.description),
    courseId: toSafeString(item?.courseId) || "c-programming",
    levelIndex: Number(item?.level) || 1,
    topic: toSafeString(item?.topic),
    exampleInputs: toSafeString(sample?.input),
    exampleOutputs: toSafeString(sample?.output),
    constraints: buildConstraints(item),
    hints: toSafeString(item?.topic),
    sourcePlatform: "Internal",
    linkToOriginalProblem: "",
    isActive: true,
  };
}

async function run() {
  const jsonPath = path.join(__dirname, "..", "..", "frontend", "c1questions.json");
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Questions file not found: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("c1questions.json is empty or not an array");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected. Importing ${parsed.length} C1 questions...`);

  let insertedOrUpdated = 0;
  for (let i = 0; i < parsed.length; i += 1) {
    const doc = mapQuestionToCodingProblem(parsed[i], i);
    await CodingProblem.findOneAndUpdate(
      { problemId: doc.problemId },
      doc,
      { upsert: true, setDefaultsOnInsert: true }
    );
    insertedOrUpdated += 1;
  }

  console.log(`Done. Upserted ${insertedOrUpdated} documents into coding_problems.`);
}

run()
  .catch((err) => {
    console.error("Import failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // no-op
    }
  });
