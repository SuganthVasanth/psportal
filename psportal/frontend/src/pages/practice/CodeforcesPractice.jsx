import React, { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import CodeCompiler from "../../components/CodeCompiler";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function CodeforcesPractice() {
  const [level, setLevel] = useState(1);
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingCases, setLoadingCases] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      setLoadingProblems(true);
      setError("");
      setSelected(null);
      setTestCases([]);
      try {
        const res = await fetch(`${API_BASE}/api/coding/problems/${level}`);
        const data = await res.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        setProblems(list);
        setSelected(list[0] || null);
      } catch (e) {
        setProblems([]);
        setError("Failed to fetch Codeforces problems.");
      } finally {
        setLoadingProblems(false);
      }
    };
    fetchProblems();
  }, [level]);

  useEffect(() => {
    const fetchCases = async () => {
      if (!selected?.problemId) return;
      setLoadingCases(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/coding/testcases/${level}/${encodeURIComponent(selected.problemId)}`
        );
        const data = await res.json().catch(() => []);
        setTestCases(Array.isArray(data) ? data : []);
      } catch {
        setTestCases([]);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchCases();
  }, [selected?.problemId, level]);

  const editorHeight = useMemo(() => "520px", []);

  return (
    <StudentLayout>
      <div className="min-h-[calc(100vh-64px)] bg-slate-900 text-slate-100 flex flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="text-lg font-extrabold">Codeforces Practice</div>
            <div className="text-sm text-slate-400">Level</div>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100"
            >
              <option value={1}>1 (implementation, math)</option>
              <option value={2}>2 (brute force)</option>
              <option value={3}>3 (arrays)</option>
            </select>
          </div>
        </header>

        {error && <div className="px-4 py-3 text-sm text-red-300">{error}</div>}

        <div className="flex-1 flex min-h-0">
          <aside className="w-[38%] min-w-[320px] max-w-[520px] border-r border-slate-800 bg-slate-900/40 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Problems
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {loadingProblems ? (
                <div className="p-3 text-slate-400 text-sm">Loading...</div>
              ) : problems.length === 0 ? (
                <div className="p-3 text-slate-500 text-sm">No problems found.</div>
              ) : (
                problems.map((p) => (
                  <button
                    key={p.problemId}
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`w-full text-left rounded-lg px-3 py-2 border ${
                      selected?.problemId === p.problemId
                        ? "border-indigo-500/40 bg-indigo-600/15"
                        : "border-transparent hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="font-semibold truncate">{p.title}</div>
                    <div className="text-xs text-slate-400 mt-1 flex gap-2 flex-wrap">
                      {p.rating && <span>Rating {p.rating}</span>}
                      {(p.tags || []).slice(0, 2).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 p-4 overflow-auto max-h-[45%]">
              <div className="text-sm font-semibold">Problem</div>
              {selected ? (
                <>
                  <div className="text-slate-300 mt-1">{selected.title}</div>
                  {selected.link && (
                    <a
                      href={selected.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-300 text-sm hover:underline inline-block mt-2"
                    >
                      Open on Codeforces
                    </a>
                  )}
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Generated test cases</div>
                    {loadingCases ? (
                      <div className="text-slate-400 text-sm">Generating...</div>
                    ) : testCases.length === 0 ? (
                      <div className="text-slate-500 text-sm">No test cases.</div>
                    ) : (
                      <div className="space-y-2">
                        {testCases.map((tc) => (
                          <div key={tc.index} className="rounded-lg border border-slate-800 bg-slate-950/30 p-3">
                            <div className="text-xs text-slate-400 mb-1">Test {tc.index}</div>
                            <div className="text-xs text-slate-400">Input</div>
                            <pre className="text-xs whitespace-pre-wrap text-slate-200">{tc.input}</pre>
                            <div className="text-xs text-slate-400 mt-2">Expected</div>
                            <pre className="text-xs whitespace-pre-wrap text-slate-200">{tc.expectedOutput}</pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-sm mt-2">Select a problem.</div>
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0 p-4">
            <div className="h-full">
              <CodeCompiler
                initialLanguage="c"
                showSubmit
                editorHeight={editorHeight}
                submitMode="backend"
                submitMeta={{ level, problemId: selected?.problemId }}
                problem={selected}
              />
            </div>
          </main>
        </div>
      </div>
    </StudentLayout>
  );
}

