import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Send, Loader2, CheckCircle2, XCircle, Terminal } from "lucide-react";

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
  initialStdin = "",
  editorHeight = "360px",
  resizable = true,
}) {
  const initialLang = LANGUAGE_OPTIONS.some((o) => o.value === initialLanguage)
    ? initialLanguage
    : "c";
  const [language, setLanguage] = useState(initialLang);
  const [code, setCode] = useState(initialCode || DEFAULT_SNIPPETS[initialLang]);
  const [stdin, setStdin] = useState(initialStdin || "");
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
    if (!resizable) return Math.max(EDITOR_MIN_HEIGHT, Math.min(EDITOR_MAX_HEIGHT, fromProp));
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
    if (!resizable) return null;
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
    if (!resizable) return;
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
    if (!resizable) return;
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
    if (!resizable) return;
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
    if (!resizable) return;
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
            register_no: submitMeta?.register_no,
            language,
          }),
        });
        const data = await res.json().catch(() => ({}));
        setSubmitResult(data);

        // Allow parent (WebPracticeProblem) to update completion UI / status.
        if (typeof onSubmit === "function") {
          const custom = await onSubmit({
            evaluated: data,
            code,
            language,
            problem,
            stdin,
            testCases,
          });
          setSubmitResult(custom || data);
        }
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
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden min-w-0 flex-1">
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex-none flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment</label>
          <select
            value={language}
            onChange={(e) => {
              const next = e.target.value;
              setLanguage(next);
              if (!code.trim() || code === DEFAULT_SNIPPETS[language]) {
                setCode(DEFAULT_SNIPPETS[next] || "");
              }
            }}
            className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm min-w-[120px]"
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
            <button 
              type="button" 
              className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-tight" 
              onClick={resetEditorSize}
            >
              Reset Size
            </button>
          )}
        </div>
      </div>

      <div
        ref={editorWrapRef}
        style={{
          borderBottom: "1px solid #f1f5f9",
          height: resizable ? editorHeightPx : undefined,
          flex: resizable ? "none" : 1,
          width: editorWidthPx == null ? "100%" : editorWidthPx,
          maxWidth: "100%",
          minHeight: resizable ? EDITOR_MIN_HEIGHT : undefined,
          maxHeight: resizable ? EDITOR_MAX_HEIGHT : undefined,
          position: "relative",
          background: "#1e1e1e", // Standard Monaco background
        }}
      >
        <Editor
          height={resizable ? `${editorHeightPx}px` : "100%"}
          theme="vs-dark"
          defaultLanguage={language === "cpp" ? "cpp" : language}
          language={language === "cpp" ? "cpp" : language}
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 20 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
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
              background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.05))",
              zIndex: 10,
            }}
          >
            <div className="absolute left-1/2 bottom-1.5 -translate-x-1/2 w-10 h-1 bg-slate-700/50 rounded-full" />
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-end gap-2 flex-none">
        <button 
          type="button" 
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[8px] font-black transition-all active:scale-95 shadow-sm" 
          onClick={handleRun} 
          disabled={running}
        >
          {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} className="fill-current" />}
          {running ? "PROCESSING" : "RUN"}
        </button>
        {showSubmit && (
          <button 
            type="button" 
            className="flex items-center gap-1.5 px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[8px] font-black transition-all active:scale-95 shadow-md shadow-indigo-100" 
            onClick={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} className="fill-current" />}
            {submitting ? "UPLOADING" : "SUBMIT"}
          </button>
        )}
      </div>

      {submitResult && showSubmit && (
        <div className="mx-4 my-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 animate-in slide-in-from-top-2 shadow-sm flex-none">
          <div className={`p-1.5 rounded-lg ${submitResult.success ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
            {submitResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
              {submitResult.success ? "System Verified" : "Verification Failed"}
            </div>
            <div className="text-[11px] font-bold text-slate-500">
              {submitResult.success
                ? "Your solution passed the core registry checks."
                : `Passed ${submitResult.passed || 0}/${submitResult.total || 0} registry case entries.`}
            </div>
          </div>
          {submitResult.error && (
            <div className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
              {submitResult.error}
            </div>
          )}
          <button 
            onClick={() => setSubmitResult(null)}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400"
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      <div className="flex-none h-32 grid grid-cols-1 md:grid-cols-2 bg-white min-w-0 border-t border-slate-100">
        <div className="flex flex-col border-r border-slate-100 min-w-0">
          <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Input</label>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            className="flex-1 p-4 text-[13px] text-slate-600 bg-white focus:outline-none placeholder:text-slate-300 resize-none transition-all leading-relaxed w-full min-w-0"
            placeholder="Type input parameters here..."
          />
        </div>
        <div className="flex flex-col bg-slate-50/30 min-w-0">
          <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Console Output</label>
            {runResult && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                runResult.success === false ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
              }`}>
                {runResult.success === false ? "Execution Error" : "Completed"}
              </span>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto text-[13px] leading-relaxed">
            {runResult == null && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                 <Terminal className="w-8 h-8 mb-3" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Output Pipeline Empty</span>
              </div>
            )}
            {runResult?.stdout && (
              <div className="text-slate-700 whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2">
                {toPreviewText(runResult.stdout)}
              </div>
            )}
            {(runResult?.stderr || runResult?.compile_output || runResult?.error) && (
              <div className="text-red-500 whitespace-pre-wrap mt-2 p-4 bg-red-50 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
                {toPreviewText(runResult.stderr || runResult.compile_output || runResult.error)}
              </div>
            )}
            {(runResult?.time != null || runResult?.memory != null) && (
              <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4">
                {runResult.time != null && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Runtime</span>
                    <span className="text-xs font-bold text-slate-500">{runResult.time}s</span>
                  </div>
                )}
                {runResult.memory != null && (
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Memory</span>
                    <span className="text-xs font-bold text-slate-500">{runResult.memory} KB</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
