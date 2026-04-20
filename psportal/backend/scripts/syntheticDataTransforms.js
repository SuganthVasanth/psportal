/**
 * Normalize synthetic JSON documents toward what the app / MongoDB expect.
 */

function isIsoDateString(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s);
}

function deepConvertDates(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(deepConvertDates);
  if (typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && isIsoDateString(v)) {
      const d = new Date(v);
      out[k] = Number.isNaN(d.getTime()) ? v : d;
    } else if (v && typeof v === "object") {
      out[k] = deepConvertDates(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function normalizeCourseStatus(s) {
  const x = String(s || "").toLowerCase();
  if (x === "active") return "Active";
  if (x === "inactive") return "Inactive";
  return s;
}

function mapAdminCourseLevel(l) {
  if (!l || typeof l !== "object") return l;
  const assessment = l.assessment || {};
  return {
    name: l.name || "Level",
    rewardPoints: l.rewardPoints ?? l.rewards ?? 0,
    prerequisiteLevelIndex: l.prerequisiteLevelIndex ?? -1,
    prerequisiteLevelIndices: Array.isArray(l.prerequisiteLevelIndices)
      ? l.prerequisiteLevelIndices
      : Array.isArray(l.prereq_indices)
        ? l.prereq_indices
        : [],
    assessmentType: l.assessmentType || "MCQ",
    questionsPerAssessment: assessment.questions ?? l.questionsPerAssessment ?? 5,
    passPercentage: assessment.pass_score ?? l.passPercentage ?? 50,
    durationMinutes: l.durationMinutes ?? 60,
    topics: Array.isArray(l.topics) ? l.topics : [],
    studyMaterials: (l.studyMaterials || []).map((m) => ({
      name: m.name || m.title || "",
      type: m.type === "file" ? "file" : "link",
      url: m.url || "",
      content: m.content || "",
    })),
  };
}

function prepareDocument(collectionName, doc) {
  let d = JSON.parse(JSON.stringify(doc));
  d = deepConvertDates(d);

  if (collectionName === "courses") {
    if (d.status != null) d.status = normalizeCourseStatus(d.status);
  }

  if (collectionName === "admincourses") {
    if (d.status != null) d.status = normalizeCourseStatus(d.status);
    if (d.level != null && typeof d.level !== "string") d.level = String(d.level);
    if (Array.isArray(d.levels)) d.levels = d.levels.map(mapAdminCourseLevel);
    d.activity_points = d.activity_points ?? d.activityPoints;
    d.reward_points = d.reward_points ?? d.rewardPoints;
    delete d.activityPoints;
    delete d.rewardPoints;
  }

  if (collectionName === "students") {
    if (d.year != null && typeof d.year !== "string") d.year = String(d.year);
  }

  if (collectionName === "leaves") {
    if (d.status != null) d.status = String(d.status);
  }

  return d;
}

module.exports = {
  deepConvertDates,
  prepareDocument,
  normalizeCourseStatus,
};
