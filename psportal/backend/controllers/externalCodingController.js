const AdminCourse = require("../models/AdminCourse");

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes
const cache = new Map(); // key -> { expiresAt, data }

const cacheGet = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data;
};

const cacheSet = (key, data) => {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
};

async function fetchLeetCodeByKeyword(keyword, limit = 10) {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          title
          titleSlug
          difficulty
          topicTags {
            name
            slug
          }
        }
      }
    }
  `;

  const variables = {
    categorySlug: "",
    skip: 0,
    limit,
    filters: {
      searchKeywords: keyword,
    },
  };

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "ps-portal/1.0 (server)",
      Referer: "https://leetcode.com/problemset/",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) {
    const msg = json?.errors?.[0]?.message || `LeetCode request failed (${res.status})`;
    throw new Error(msg);
  }

  const questions = json?.data?.problemsetQuestionList?.questions;
  return Array.isArray(questions) ? questions : [];
}

exports.getCodingQuestionsForLevel = async (req, res) => {
  try {
    const { courseId, levelIndex } = req.query;
    const platform = (req.query.platform || "leetcode").toString().toLowerCase();

    if (!courseId) return res.status(400).json({ message: "courseId required" });
    const idx = Number(levelIndex);
    if (!Number.isFinite(idx) || idx < 0) return res.status(400).json({ message: "levelIndex must be a non-negative number" });

    const course = await AdminCourse.findById(courseId).lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const level = Array.isArray(course.levels) ? course.levels[idx] : null;
    if (!level) return res.status(404).json({ message: "Level not found" });

    const conceptsRaw = Array.isArray(level.concepts) ? level.concepts : Array.isArray(level.topics) ? level.topics : [];
    const concepts = conceptsRaw.map((x) => (x || "").toString().trim()).filter(Boolean);

    const cacheKey = `${platform}:${courseId}:${idx}:${concepts.join("|").toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json({ platform, courseId, levelIndex: idx, concepts, questions: cached });

    if (platform !== "leetcode") {
      return res.json({ platform, courseId, levelIndex: idx, concepts, questions: [] });
    }

    const perConcept = Math.max(3, Math.min(8, Number(req.query.perConcept) || 5));
    const maxTotal = Math.max(5, Math.min(30, Number(req.query.maxTotal) || 20));

    const seen = new Set();
    const out = [];

    // Prefer multiple smaller searches per concept for better relevance
    for (const concept of concepts.length ? concepts : ["programming"]) {
      if (out.length >= maxTotal) break;
      const rows = await fetchLeetCodeByKeyword(concept, perConcept + 4);
      for (const q of rows) {
        const slug = q?.titleSlug;
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        out.push({
          platform: "leetcode",
          title: q.title,
          difficulty: q.difficulty,
          url: `https://leetcode.com/problems/${slug}/`,
          slug,
          tags: Array.isArray(q.topicTags) ? q.topicTags.map((t) => t.name).filter(Boolean) : [],
          matchedConcept: concept,
        });
        if (out.length >= maxTotal) break;
      }
    }

    cacheSet(cacheKey, out);
    res.json({ platform, courseId, levelIndex: idx, concepts, questions: out });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch coding questions" });
  }
};

