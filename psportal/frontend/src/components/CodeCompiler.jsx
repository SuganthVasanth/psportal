import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Send, Loader2, CheckCircle2, XCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const LANGUAGE_OPTIONS = [
  { label: "C", value: "c", judge0Id: 50 },
  { label: "C++", value: "cpp", judge0Id: 54 },
  { label: "JavaScript", value: "javascript", judge0Id: 63 },
  { label: "Python", value: "python", judge0Id: 71 },
];

const DEFAULT_SNIPPETS = {
  c: "#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n",
  javascript: "function solve(input) {\n  // Write your code here\n  return input;\n}\n\nprocess.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet data = '';\nprocess.stdin.on('data', c => data += c);\nprocess.stdin.on('end', () => {\n  process.stdout.write(String(solve(data.trim())));\n});\n",
  python: "def solve(data: str):\n    # Write your code here\n    return data\n\nif __name__ == '__main__':\n    import sys\n    print(solve(sys.stdin.read().strip()))\n",
};

const normalize = (value) => (value == null ? "" : String(value).trim());
const MAX_OUTPUT_PREVIEW_CHARS = 12000;
const EDITOR_MIN_HEIGHT = 240;
const EDITOR_MAX_HEIGHT = 980;
const EDITOR_MIN_WIDTH = 320;
const EDITOR_HEIGHT_STORAGE_KEY = "psportal:studentCompilerEditorHeight";
const EDITOR_WIDTH_STORAGE_KEY = "psportal:studentCompilerEditorWidth";

function parseHeightPx(value, fallbackPx) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const raw = value == null ? "" : String(value).trim();
  const m = raw.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (m) return Math.round(Number(m[1]));
  const n = Number(raw);
  if (Number.isFinite(n)) return Math.round(n);
  return fallbackPx;
}

function toPreviewText(value) {
  const raw = value == null ? "" : String(value);
  if (raw.length <= MAX_OUTPUT_PREVIEW_CHARS) return raw;
  return `${raw.slice(0, MAX_OUTPUT_PREVIEW_CHARS)}\n\n[output truncated: showing first ${MAX_OUTPUT_PREVIEW_CHARS} chars of ${raw.length}]`;
}

export default function CodeCompiler({
  problem = null,
  testCases = [],
  onSubmit = null,
  showSubmit = true,
  submitMode = "local",
  submitMeta = null,
  initialLanguage = "c",
  initialCode = "",
  editorHeight = "360px",
  resizable = true,
}) {
  const initialLang = LANGUAGE_OPTIONS.some((o) => o.value === initialLanguage)
    ? initialLanguage
    : "c";
  const [language, setLanguage] = useState(initialLang);
  const [code, setCode] = useState(initialCode || DEFAULT_SNIPPETS[initialLang]);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const editorWrapRef = useRef(null);
  const dragStateRef = useRef(null);
  const hasStoredHeightRef = useRef(false);
  const hasStoredWidthRef = useRef(false);

  const [editorHeightPx, setEditorHeightPx] = useState(() => {
    const fromProp = parseHeightPx(editorHeight, 360);
    if (typeof window === "undefined") return fromProp;
    try {
      const saved = window.localStorage.getItem(EDITOR_HEIGHT_STORAGE_KEY);
      hasStoredHeightRef.current = saved != null;
      const fromSaved = parseHeightPx(saved, fromProp);
      return Math.max(EDITOR_MIN_HEIGHT, Math.min(EDITOR_MAX_HEIGHT, fromSaved));
    } catch {
      return Math.max(EDITOR_MIN_HEIGHT, Math.min(EDITOR_MAX_HEIGHT, fromProp));
    }
  });
  const [editorWidthPx, setEditorWidthPx] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem(EDITOR_WIDTH_STORAGE_KEY);
      hasStoredWidthRef.current = saved != null && saved !== "";
      if (saved == null || saved === "") return null;
      const parsed = parseHeightPx(saved, NaN);
      return Number.isFinite(parsed) ? Math.max(EDITOR_MIN_WIDTH, parsed) : null;
    } catch {
      return null;
    }
  });
  const defaultEditorHeightPx = useMemo(
    () =>
      Math.max(EDITOR_MIN_HEIGHT, Math.min(EDITOR_MAX_HEIGHT, parseHeightPx(editorHeight, 360))),
    [editorHeight]
  );

  useEffect(() => {
    // If parent changes editorHeight, honor it unless user has already resized (stored).
    const fromProp = parseHeightPx(editorHeight, 360);
    if (typeof window === "undefined") {
      setEditorHeightPx((prev) =>
        Math.max(EDITOR_MIN_HEIGHT, Math.min(EDITOR_MAX_HEIGHT, prev || fromProp))
      );
      return;
    }
    if (!hasStoredHeightRef.current) {
      setEditorHeightPx(Math.max(EDITOR_MIN_HEIGHT, Math.min(EDITOR_MAX_HEIGHT, fromProp)));
    }
  }, [editorHeight]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (hasStoredHeightRef.current) {
        window.localStorage.setItem(EDITOR_HEIGHT_STORAGE_KEY, String(editorHeightPx));
      } else {
        window.localStorage.removeItem(EDITOR_HEIGHT_STORAGE_KEY);
      }
    } catch {
      // no-op
    }
  }, [editorHeightPx]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!hasStoredWidthRef.current || editorWidthPx == null) {
        window.localStorage.removeItem(EDITOR_WIDTH_STORAGE_KEY);
      } else {
        window.localStorage.setItem(EDITOR_WIDTH_STORAGE_KEY, String(editorWidthPx));
      }
    } catch {
      // no-op
    }
  }, [editorWidthPx]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const keepWithinParent = () => {
      if (editorWidthPx == null || !editorWrapRef.current?.parentElement) return;
      const maxW = Math.max(EDITOR_MIN_WIDTH, editorWrapRef.current.parentElement.clientWidth);
      if (editorWidthPx > maxW) setEditorWidthPx(maxW);
    };
    window.addEventListener("resize", keepWithinParent);
    keepWithinParent();
    return () => window.removeEventListener("resize", keepWithinParent);
  }, [editorWidthPx]);

  const languageId = useMemo(
    () => LANGUAGE_OPTIONS.find((opt) => opt.value === language)?.judge0Id || 50,
    [language]
  );

  const resetEditorSize = () => {
    hasStoredHeightRef.current = false;
    hasStoredWidthRef.current = false;
    setEditorHeightPx(defaultEditorHeightPx);
    setEditorWidthPx(null);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(EDITOR_HEIGHT_STORAGE_KEY);
      window.localStorage.removeItem(EDITOR_WIDTH_STORAGE_KEY);
    } catch {
      // no-op
    }
  };

  const executeRun = async (customInput) => {
    const res = await fetch(`${API_BASE}/api/coding/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        stdin: customInput,
        language_id: languageId,
      }),
    });
    return res.json();
  };

  const runAgainstTestCases = async () => {
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return { passed: 0, total: 0, results: [], success: false, error: "No test cases configured." };
    }

    const results = [];
    let passed = 0;

    for (let i = 0; i < testCases.length; i += 1) {
      const tc = testCases[i];
      const runData = await executeRun(tc?.input || "");
      const actual = normalize(runData?.stdout);
      const expected = normalize(tc?.expectedOutput);
      const casePassed = actual === expected;
      if (casePassed) passed += 1;
      results.push({
        index: i + 1,
        passed: casePassed,
        expected,
        actual,
      });
    }

    return {
      success: passed === testCases.length,
      passed,
      total: testCases.length,
      results,
    };
  };

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const data = await executeRun(stdin);
      setRunResult(data);
    } catch (err) {
      setRunResult({ success: false, error: err.message || "Request failed" });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    try {
      if (submitMode === "backend") {
        const res = await fetch(`${API_BASE}/api/coding/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: code,
            stdin,
            language_id: languageId,
            level: submitMeta?.level,
            problemId: submitMeta?.problemId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        setSubmitResult(data);
      } else {
        const evaluated = await runAgainstTestCases();
        if (typeof onSubmit === "function") {
          const custom = await onSubmit({
            code,
            language,
            problem,
            stdin,
            testCases,
            evaluated,
          });
          setSubmitResult(custom || evaluated);
        } else {
          setSubmitResult(evaluated);
        }
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        passed: 0,
        total: Array.isArray(testCases) ? testCases.length : 0,
        results: [],
        error: err.message || "Submit failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-card" style={{ height: "100%" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Language</label>
          <select
            value={language}
            onChange={(e) => {
              const next = e.target.value;
              setLanguage(next);
              if (!code.trim() || code === DEFAULT_SNIPPETS[language]) {
                setCode(DEFAULT_SNIPPETS[next] || "");
              }
            }}
            className="sa-input"
            style={{ minWidth: 140 }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {resizable && (
            <button type="button" className="sa-btn" onClick={resetEditorSize}>
              Reset size
            </button>
          )}
          <button type="button" className="sa-btn" onClick={handleRun} disabled={running}>
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? "Running..." : "Run"}
          </button>
          {showSubmit && (
            <button type="button" className="sa-btn sa-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>

      <div
        ref={editorWrapRef}
        style={{
          marginTop: 12,
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          overflow: "hidden",
          height: editorHeightPx,
          width: editorWidthPx == null ? "100%" : editorWidthPx,
          maxWidth: "100%",
          minHeight: EDITOR_MIN_HEIGHT,
          maxHeight: EDITOR_MAX_HEIGHT,
          position: "relative",
          background: "#0b1220",
        }}
      >
        <Editor
          height={`${editorHeightPx}px`}
          theme="vs-dark"
          defaultLanguage={language === "cpp" ? "cpp" : language}
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />

        {resizable && (
          <div
            role="separator"
            aria-label="Resize editor"
            title="Drag to resize height"
            onPointerDown={(e) => {
              if (!editorWrapRef.current) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture?.(e.pointerId);
              dragStateRef.current = {
                mode: "height",
                startY: e.clientY,
                startH: editorWrapRef.current.getBoundingClientRect().height,
              };
            }}
            onPointerMove={(e) => {
              const st = dragStateRef.current;
              if (!st || st.mode !== "height") return;
              const next = st.startH + (e.clientY - st.startY);
              const clamped = Math.max(EDITOR_MIN_HEIGHT, Math.min(EDITOR_MAX_HEIGHT, next));
              hasStoredHeightRef.current = true;
              setEditorHeightPx(Math.round(clamped));
            }}
            onPointerUp={() => {
              dragStateRef.current = null;
            }}
            onPointerCancel={() => {
              dragStateRef.current = null;
            }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 10,
              cursor: "ns-resize",
              background:
                "linear-gradient(to bottom, rgba(148,163,184,0), rgba(148,163,184,0.28))",
              borderTop: "1px solid rgba(226,232,240,0.12)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 3,
                transform: "translateX(-50%)",
                width: 34,
                height: 4,
                borderRadius: 999,
                background: "rgba(226,232,240,0.35)",
              }}
            />
          </div>
        )}
        {resizable && (
          <div
            role="separator"
            aria-label="Resize editor width"
            title="Drag left edge to resize width"
            onPointerDown={(e) => {
              if (!editorWrapRef.current) return;
              e.preventDefault();
              e.currentTarget.setPointerCapture?.(e.pointerId);
              dragStateRef.current = {
                mode: "width",
                startX: e.clientX,
                startW: editorWrapRef.current.getBoundingClientRect().width,
              };
            }}
            onPointerMove={(e) => {
              const st = dragStateRef.current;
              if (!st || st.mode !== "width" || !editorWrapRef.current?.parentElement) return;
              const parentW = editorWrapRef.current.parentElement.clientWidth;
              const maxW = Math.max(EDITOR_MIN_WIDTH, parentW);
              const next = st.startW - (e.clientX - st.startX);
              const clamped = Math.max(EDITOR_MIN_WIDTH, Math.min(maxW, next));
              hasStoredWidthRef.current = true;
              setEditorWidthPx(Math.round(clamped));
            }}
            onPointerUp={() => {
              dragStateRef.current = null;
            }}
            onPointerCancel={() => {
              dragStateRef.current = null;
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 10,
              cursor: "ew-resize",
              background:
                "linear-gradient(to left, rgba(148,163,184,0), rgba(148,163,184,0.22))",
              borderRight: "1px solid rgba(226,232,240,0.12)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 3,
                transform: "translateY(-50%)",
                width: 4,
                height: 34,
                borderRadius: 999,
                background: "rgba(226,232,240,0.35)",
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ marginTop: 12 }}>
        <div>
          <label className="text-sm font-medium text-slate-700">Input</label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            className="sa-input"
            rows={5}
            style={{ width: "100%", marginTop: 6, fontFamily: "ui-monospace,monospace" }}
            placeholder="Enter stdin..."
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Output</label>
          <div
            style={{
              marginTop: 6,
              minHeight: 124,
              whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace,monospace",
              background: "#0f172a",
              color: "#e2e8f0",
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
            }}
          >
            {runResult == null && <span style={{ color: "#94a3b8" }}>Run your code to see output.</span>}
            {runResult?.stdout && <div>{toPreviewText(runResult.stdout)}</div>}
            {(runResult?.stderr || runResult?.compile_output || runResult?.error) && (
              <div style={{ color: "#fca5a5", marginTop: 6 }}>
                {toPreviewText(runResult.stderr || runResult.compile_output || runResult.error)}
              </div>
            )}
            {(runResult?.time != null || runResult?.memory != null) && (
              <div style={{ color: "#94a3b8", marginTop: 8, fontSize: 12 }}>
                {runResult.time != null ? `Time: ${runResult.time}s` : ""}
                {runResult.memory != null ? `  Memory: ${runResult.memory} KB` : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {submitResult && showSubmit && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {submitResult.success ? (
              <CheckCircle2 size={16} color="#16a34a" />
            ) : (
              <XCircle size={16} color="#dc2626" />
            )}
            <span>
              {submitResult.success
                ? "All test cases passed"
                : `Passed ${submitResult.passed || 0}/${submitResult.total || 0} test cases`}
            </span>
          </div>
          {submitResult.error && (
            <p style={{ marginTop: 6, color: "#dc2626", fontSize: 13 }}>{submitResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
