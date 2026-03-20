/**
 * Fetch problems from Codeforces API. No DB storage.
 * Level-to-tags mapping: Level 1 → implementation, math; Level 2 → brute force; Level 3 → arrays
 */

const CODEFORCES_API = "https://codeforces.com/api/problemset.problems";
const MIN_RATING = 800;
const MAX_RATING = 1600;
const PER_LEVEL = 8;

const LEVEL_TAGS = {
  1: ["implementation", "math"],
  2: ["brute force"],
  3: ["arrays"],
};

function normalizeTag(t) {
  return (t || "").toLowerCase().trim();
}

function decodeHtmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToReadableText(html) {
  if (!html) return "";
  let s = html;
  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<\/div>/gi, "\n");
  s = s.replace(/<\/li>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "- ");
  s = s.replace(/<pre[^>]*>/gi, "\n");
  s = s.replace(/<\/pre>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeHtmlEntities(s);
  s = s.replace(/\r/g, "");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function extractSection(block, cls) {
  const rx = new RegExp(`<div class="${cls}">([\\s\\S]*?)</div>`, "i");
  const m = block.match(rx);
  return m ? htmlToReadableText(m[1]) : "";
}

async function fetchAllProblems() {
  const res = await fetch(CODEFORCES_API);
  if (!res.ok) throw new Error("Codeforces API request failed");
  const data = await res.json();
  if (data.status !== "OK" || !Array.isArray(data.result?.problems)) {
    throw new Error(data.comment || "Invalid response from Codeforces");
  }
  return data.result.problems;
}

/**
 * Get 5–10 problems for a level. Level is 1-based (1, 2, 3).
 */
async function getProblemsForLevel(level) {
  const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  const tags = LEVEL_TAGS[levelNum] || LEVEL_TAGS[1];
  const normalizedTags = tags.map(normalizeTag);

  const problems = await fetchAllProblems();
  const filtered = problems.filter((p) => {
    const problemTags = (p.tags || []).map(normalizeTag);
    const hasTag = normalizedTags.some((t) => problemTags.includes(t));
    const rating = p.rating != null ? p.rating : 0;
    if (!hasTag) return false;
    if (rating && (rating < MIN_RATING || rating > MAX_RATING)) return false;
    return true;
  });

  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(PER_LEVEL, shuffled.length));

  return selected.map((p) => ({
    contestId: p.contestId,
    index: p.index,
    title: p.name || `Problem ${p.contestId}${p.index}`,
    rating: p.rating ?? null,
    tags: p.tags || [],
    link: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
    problemId: `${p.contestId}-${p.index}`,
  }));
}

async function getProblemStatement(problemId) {
  const [contestId, index] = String(problemId || "").split("-");
  if (!contestId || !index) throw new Error("Invalid problemId");
  const cfUrl = `http://codeforces.com/contest/${contestId}/problem/${index}`;
  const mirrorUrl = `https://r.jina.ai/${cfUrl}`;
  const res = await fetch(mirrorUrl);
  if (!res.ok) throw new Error("Failed to fetch problem statement");
  let text = await res.text();
  if (!text || text.length < 50) throw new Error("Failed to fetch problem statement");

  const markdownMarker = "Markdown Content:";
  const markerPos = text.indexOf(markdownMarker);
  if (markerPos >= 0) {
    text = text.slice(markerPos + markdownMarker.length).trim();
  }

  const normalized = text.replace(/\r/g, "").trim();
  const idxInput = normalized.search(/\nInput\b/i);
  const idxOutput = normalized.search(/\nOutput\b/i);
  const idxNote = normalized.search(/\nNote\b/i);

  const cut = (from, to) => {
    if (from < 0) return "";
    const start = from;
    const end = to > from ? to : normalized.length;
    return normalized.slice(start, end).trim();
  };

  const description = idxInput > 0 ? normalized.slice(0, idxInput).trim() : normalized;
  const input = cut(idxInput, idxOutput > 0 ? idxOutput : idxNote);
  const output = cut(idxOutput, idxNote);
  const note = cut(idxNote, -1);

  const blocks = normalized.split(/\nExamples?\b/i);
  const examplesRaw = blocks.length > 1 ? blocks[1] : "";
  const examplePairs = [];
  if (examplesRaw) {
    const lines = examplesRaw.split("\n");
    let currentIn = "";
    let currentOut = "";
    let mode = "";
    for (const ln of lines) {
      if (/^\s*Input\s*$/i.test(ln)) { mode = "in"; continue; }
      if (/^\s*Output\s*$/i.test(ln)) { mode = "out"; continue; }
      if (/^\s*Note\s*$/i.test(ln)) break;
      if (mode === "in") currentIn += `${ln}\n`;
      if (mode === "out") currentOut += `${ln}\n`;
      if (mode === "out" && ln.trim() === "") {
        if (currentIn.trim() || currentOut.trim()) {
          examplePairs.push({ input: currentIn.trim(), output: currentOut.trim() });
        }
        currentIn = "";
        currentOut = "";
        mode = "";
      }
    }
    if (currentIn.trim() || currentOut.trim()) {
      examplePairs.push({ input: currentIn.trim(), output: currentOut.trim() });
    }
  }

  return {
    description,
    input,
    output,
    note,
    examples: examplePairs.slice(0, 3),
  };
}

module.exports = { getProblemsForLevel, getProblemStatement, LEVEL_TAGS };
