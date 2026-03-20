import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import CodeCompiler from "../../components/CodeCompiler";
import "./WebPracticeProblem.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function WebPracticeProblem() {
  const { level, problemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  const registerNo = (localStorage.getItem("register_no") || "").trim();
  const [problem, setProblem] = useState(null);
  const [details, setDetails] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [savedSubmission, setSavedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const lastSavedText = savedSubmission?.lastSubmittedAt
    ? new Date(savedSubmission.lastSubmittedAt).toLocaleString()
    : "";

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

        if (registerNo) {
          const subRes = await fetch(
            `${API_BASE}/api/coding/submission?level=${levelNum}&problemId=${encodeURIComponent(problemId)}&register_no=${encodeURIComponent(registerNo)}`
          );
          const subData = await subRes.json().catch(() => ({}));
          if (subData?.exists) setSavedSubmission(subData);
          else setSavedSubmission(null);
        } else {
          setSavedSubmission(null);
        }
      } catch (e) {
        setError("Failed to load problem.");
        setProblem(null);
        setDetails(null);
        setTestCases([]);
        setSavedSubmission(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [levelNum, problemId, location?.state, registerNo]);

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

  const handleSubmit = async ({ evaluated, code, language, stdin }) => {
    const verdict = evaluated?.verdict || (evaluated?.success ? "Accepted" : "Failed");
    setSavedSubmission((prev) => ({
      ...(prev || {}),
      code: code ?? prev?.code ?? "",
      stdin: stdin ?? prev?.stdin ?? "",
      language: language ?? prev?.language ?? "c",
      isAccepted: verdict === "Accepted" ? true : prev?.isAccepted ?? false,
      lastVerdict: verdict,
      lastSubmittedAt: new Date().toISOString(),
    }));
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
              <span
                className={`sa-pill web-problem-pill ${
                  savedSubmission?.isAccepted ? "web-problem-pill-success" : "web-problem-pill-neutral"
                }`}
              >
                {savedSubmission?.isAccepted ? "Completed" : "In progress"}
              </span>
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
          {savedSubmission && (
            <div className="web-problem-meta-row">
              <span className="web-meta-label">Last verdict:</span>
              <span className={savedSubmission?.isAccepted ? "web-meta-success" : "web-meta-muted"}>
                {savedSubmission?.lastVerdict || "Attempted"}
              </span>
              {lastSavedText && (
                <>
                  <span className="web-meta-dot">-</span>
                  <span className="web-meta-muted">Saved on {lastSavedText}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="practice-problem-layout web-problem-layout">
          <div className="practice-problem-right web-problem-right-sticky web-problem-compiler-first">
            <CodeCompiler
              key={`${levelNum}-${problem.problemId}`}
              problem={problem}
              testCases={testCases}
              onSubmit={handleSubmit}
              showSubmit
              submitMode="backend"
              submitMeta={{ level: levelNum, problemId: problem.problemId, register_no: registerNo }}
              initialLanguage={savedSubmission?.language || "c"}
              initialCode={savedSubmission?.code || ""}
              initialStdin={savedSubmission?.stdin || ""}
              resizable={false}
              editorHeight="560px"
            />
          </div>

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
        </div>
      </div>
    </StudentLayout>
  );
}

