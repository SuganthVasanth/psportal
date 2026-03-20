/**
 * Judge0 execution via the PUBLIC CE API (no API key).
 * https://ce.judge0.com
 */

const DEFAULT_LANGUAGE_ID = 50; // C
const BASE_URL = "https://ce.judge0.com";
const QUEUED_STATUS_IDS = new Set([1, 2]); // In Queue, Processing

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function submitCode({ source_code, language_id, stdin }) {
  const res = await fetch(`${BASE_URL}/submissions?base64_encoded=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code,
      language_id: Number.isFinite(language_id) ? language_id : DEFAULT_LANGUAGE_ID,
      stdin: stdin || "",
    }),
  });

  if (!res.ok) {
    throw new Error("Code execution failed. Try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!data?.token) throw new Error("Code execution failed. Try again.");
  return data.token;
}

async function fetchResult(token) {
  const res = await fetch(`${BASE_URL}/submissions/${encodeURIComponent(token)}?base64_encoded=false`);
  if (!res.ok) throw new Error("Code execution failed. Try again.");
  return res.json();
}

/**
 * Poll result with retry:
 * - wait 1s
 * - if status is queued/processing, retry after 1s (max 3 attempts total)
 */
async function pollResult(token) {
  await sleep(1000);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const raw = await fetchResult(token);
    const statusId = raw?.status?.id;
    if (!QUEUED_STATUS_IDS.has(statusId)) return raw;
    if (attempt < 2) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
    }
    if (attempt === 2) return raw;
  }
  throw new Error("Code execution failed. Try again.");
}

function mapResult(raw) {
  const statusId = raw?.status?.id ?? null;
  const statusDescription = raw?.status?.description ?? "";
  return {
    token: raw?.token,
    stdout: raw?.stdout ?? "",
    stderr: raw?.stderr ?? "",
    compile_output: raw?.compile_output ?? "",
    time: raw?.time ?? null,
    memory: raw?.memory ?? null,
    status: { id: statusId, description: statusDescription },
    success: statusId === 3,
  };
}

async function runCode({ source_code, stdin, language_id }) {
  const token = await submitCode({ source_code, stdin, language_id });
  const raw = await pollResult(token);
  return mapResult({ ...raw, token });
}

module.exports = { runCode, submitCode, pollResult, DEFAULT_LANGUAGE_ID };
