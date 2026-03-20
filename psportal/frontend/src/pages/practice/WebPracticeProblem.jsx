import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import CodeCompiler from "../../components/CodeCompiler";
import "./WebPracticeProblem.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function updateStatus(level, problemId, status) {
  const key = `cf:${level}:${problemId}`;
  try {
    const raw = localStorage.getItem("codeforcesPracticeStatus");
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = { status, updatedAt: Date.now() };
    localStorage.setItem("codeforcesPracticeStatus", JSON.stringify(parsed));
  } catch {
    // no-op
  }
}

export default function WebPracticeProblem() {
  const { level, problemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  const [problem, setProblem] = useState(null);
  const [details, setDetails] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const selectedFromState = location?.state?.selectedProblem;
        const [problemsRes, casesRes, detailsRes] = await Promise.all([
          selectedFromState ? Promise.resolve({ ok: true, json: async () => [selectedFromState] }) : fetch(`${API_BASE}/api/coding/problems/${levelNum}`),
          fetch(`${API_BASE}/api/coding/testcases/${levelNum}/${encodeURIComponent(problemId)}`),
          fetch(`${API_BASE}/api/coding/problem/${encodeURIComponent(problemId)}`),
        ]);
        const problemsData = await problemsRes.json().catch(() => []);
        const casesData = await casesRes.json().catch(() => []);
        const detailsData = await detailsRes.json().catch(() => ({}));
        const selected =
          selectedFromState?.problemId === problemId
            ? selectedFromState
            : (Array.isArray(problemsData) ? problemsData : []).find((p) => p.problemId === problemId);
        setProblem(
          selected || {
            problemId,
            title: problemId,
            rating: null,
            tags: [],
            link: `https://codeforces.com/problemset/problem/${String(problemId).split("-")[0]}/${String(problemId).split("-")[1] || ""}`,
          }
        );
        setTestCases(Array.isArray(casesData) ? casesData : []);
        setDetails(detailsData && typeof detailsData === "object" ? detailsData : null);
      } catch (e) {
        setError("Failed to load problem.");
        setProblem(null);
        setDetails(null);
        setTestCases([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [levelNum, problemId, location?.state]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="dashboard-container-inner web-problem-state">
          <p className="web-problem-state-text">Loading problem details...</p>
        </div>
      </StudentLayout>
    );
  }

  if (!problem) {
    return (
      <StudentLayout>
        <div className="dashboard-container-inner web-problem-state">
          <p className="web-problem-state-error">{error || "Problem not found."}</p>
          <button type="button" className="sa-btn" onClick={() => navigate("/web-practice")}>
            Back
          </button>
        </div>
      </StudentLayout>
    );
  }

  const handleSubmit = async ({ evaluated }) => {
    updateStatus(levelNum, problem.problemId, evaluated?.success ? "Passed" : "Failed");
    return evaluated;
  };

  return (
    <StudentLayout>
      <div className="web-problem-page">
        <div className="web-problem-header">
          <div className="web-problem-header-row">
            <div className="web-problem-header-left">
              <button type="button" className="sa-btn" onClick={() => navigate("/web-practice")}>
                Back
              </button>
              <div className="web-problem-header-title-wrap">
                <div className="web-problem-header-eyebrow">Codeforces Practice</div>
                <div className="web-problem-header-title">{problem.title}</div>
              </div>
              <span className="sa-pill web-problem-pill">Level {levelNum}</span>
              {problem.rating != null && (
                <span className="sa-pill web-problem-pill web-problem-pill-rating">
                  Rating {problem.rating}
                </span>
              )}
            </div>
            <a
              href={problem.link}
              target="_blank"
              rel="noreferrer"
              className="web-problem-ext-link"
            >
              Open on Codeforces
            </a>
          </div>
        </div>

        <div className="practice-problem-layout web-problem-layout">
          <div className="practice-problem-left">
            <div className="dashboard-card web-problem-card">
              <h3 className="card-title web-problem-card-title">{problem.title}</h3>
              <p className="card-subtitle web-problem-card-subtitle">
                {problem.problemId} · {(problem.tags || []).slice(0, 3).join(", ") || "No tags"}
              </p>

              <div className="web-problem-sections">
                <h4 className="web-problem-section-title">Problem Description</h4>
                <pre className="web-problem-pre">
                  {details?.description || "Loading description..."}
                </pre>
                {details?.input && (
                  <>
                    <h4 className="web-problem-section-title">Input</h4>
                    <pre className="web-problem-pre">{details.input}</pre>
                  </>
                )}
                {details?.output && (
                  <>
                    <h4 className="web-problem-section-title">Output</h4>
                    <pre className="web-problem-pre">{details.output}</pre>
                  </>
                )}
                {Array.isArray(details?.examples) && details.examples.length > 0 && (
                  <>
                    <h4 className="web-problem-section-title">Examples</h4>
                    {details.examples.slice(0, 2).map((ex, i) => (
                      <div key={i} className="web-problem-example-card">
                        <div className="web-problem-label">Input</div>
                        <pre className="web-problem-pre web-problem-pre-compact">{ex.input}</pre>
                        <div className="web-problem-label">Output</div>
                        <pre className="web-problem-pre web-problem-pre-compact">{ex.output}</pre>
                      </div>
                    ))}
                  </>
                )}
                {details?.note && (
                  <>
                    <h4 className="web-problem-section-title">Note</h4>
                    <pre className="web-problem-pre">{details.note}</pre>
                  </>
                )}
              </div>

              <div className="web-problem-testcases">
                <h4 className="web-problem-section-title">Generated Test Cases</h4>
                <div className="web-problem-testcases-list">
                  {(testCases || []).map((tc) => (
                    <div key={tc.index} className="web-problem-testcase-card">
                      <div className="web-problem-testcase-title">Test {tc.index}</div>
                      <div className="web-problem-label">Input</div>
                      <pre className="web-problem-pre web-problem-pre-compact">{tc.input}</pre>
                      <div className="web-problem-label">Expected</div>
                      <pre className="web-problem-pre web-problem-pre-compact">{tc.expectedOutput}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="practice-problem-right">
            <CodeCompiler
              problem={problem}
              testCases={testCases}
              onSubmit={handleSubmit}
              showSubmit
              submitMode="backend"
              submitMeta={{ level: levelNum, problemId: problem.problemId }}
              initialLanguage="c"
              editorHeight="560px"
            />
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

