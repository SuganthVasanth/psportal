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

  // 1. Clean up known navigation junk and find the real start
  let normalized = text.replace(/\r/g, "").trim();
  
  // Find "standard output" which is the end of the problem header
  const headerEndMarker = "standard output";
  const headerEndIdx = normalized.toLowerCase().indexOf(headerEndMarker);
  
  let contentArea = normalized;
  if (headerEndIdx !== -1) {
    contentArea = normalized.slice(headerEndIdx + headerEndMarker.length).trim();
  }

  // 2. Locate major sections in the content area
  const idxInput = contentArea.search(/\nInput\b/i);
  const idxOutput = contentArea.search(/\nOutput\b/i);
  const idxExamples = contentArea.search(/\nExamples?\b/i);
  const idxNote = contentArea.search(/\nNote\b/i);

  const cut = (str, from, to) => {
    if (from < 0) return "";
    const end = to > from ? to : str.length;
    return str.slice(from, end).trim();
  };

  const description = idxInput > 0 ? contentArea.slice(0, idxInput).trim() : contentArea;
  const input = cut(contentArea, idxInput, idxOutput > 0 ? idxOutput : (idxExamples > 0 ? idxExamples : idxNote));
  const output = cut(contentArea, idxOutput, idxExamples > 0 ? idxExamples : idxNote);
  const note = idxNote > 0 ? contentArea.slice(idxNote).trim() : "";

  // 3. Parse Examples carefully
  const examplePairs = [];
  if (idxExamples !== -1) {
    const examplesPart = contentArea.slice(idxExamples).split(/\n[\[\(]?Codeforces[\]\)]?/i)[0]; // stop at footer
    const lines = examplesPart.split("\n");
    let currentIn = "";
    let currentOut = "";
    let mode = "";

    for (let ln of lines) {
      const trimmed = ln.trim();
      if (!trimmed) continue;
      if (trimmed.toLowerCase() === "copy") continue;
      
      if (/^Input\b/i.test(trimmed)) {
        if (currentOut) {
          examplePairs.push({ input: currentIn.trim(), output: currentOut.trim() });
          currentIn = ""; currentOut = "";
        }
        mode = "in";
        continue;
      }
      if (/^Output\b/i.test(trimmed)) {
        mode = "out";
        continue;
      }
      if (/^Note\b/i.test(trimmed)) break;
      if (/^Examples?\b/i.test(trimmed) && mode === "") continue;

      if (mode === "in") currentIn += trimmed + "\n";
      if (mode === "out") currentOut += trimmed + "\n";
    }
    if (currentIn.trim() || currentOut.trim()) {
      examplePairs.push({ input: currentIn.trim(), output: currentOut.trim() });
    }
  }

  return {
    description: description.replace(/^Input\b/i, "").trim(),
    input: input.replace(/^Input\b/i, "").trim(),
    output: output.replace(/^Output\b/i, "").trim(),
    note: note.replace(/^Note\b/i, "").trim(),
    examples: examplePairs.slice(0, 3)
  };
}

module.exports = { getProblemsForLevel, getProblemStatement, LEVEL_TAGS };
