import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";
import CodeCompiler from "../../components/CodeCompiler";

const API_BASE = "http://localhost:5000";

export default function PracticeProblem() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const registerNo = localStorage.getItem("register_no") || "";

  useEffect(() => {
    if (!problemId) return;
    fetch(`${API_BASE}/api/practice/problems/${encodeURIComponent(problemId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Problem not found"))))
      .then(setProblem)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [problemId]);

  const testCases = useMemo(() => {
    if (!problem) return [];
    if (Array.isArray(problem.testCases) && problem.testCases.length > 0) {
      return problem.testCases.map((tc) => ({
        input: tc?.input || "",
        expectedOutput: tc?.expectedOutput || tc?.output || "",
      }));
    }
    if (problem.exampleInputs || problem.exampleOutputs) {
      return [
        {
          input: problem.exampleInputs || "",
          expectedOutput: problem.exampleOutputs || "",
        },
      ];
    }
    return [];
  }, [problem]);

  const handleSubmit = async ({ code, language, evaluated }) => {
    const result = evaluated?.success ? "passed" : "failed";
    const res = await fetch(`${API_BASE}/api/practice/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: problem?.problemId,
        courseId: problem?.courseId || "",
        language,
        code,
        register_no: registerNo,
        result,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      ...(evaluated || { success: false, passed: 0, total: 0, results: [] }),
      submissionId: data?.id,
      message: data?.message,
    };
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="dashboard-container-inner"><p>Loading problem...</p></div>
      </StudentLayout>
    );
  }

  if (error || !problem) {
    return (
      <StudentLayout>
        <div className="dashboard-container-inner">
          <p style={{ color: "#b91c1c" }}>{error || "Problem not found"}</p>
          <button type="button" className="sa-btn" onClick={() => navigate("/practice")}>Back to Practice</button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="dashboard-container-inner practice-problem-layout">
          <div className="practice-problem-left">
            <div className="dashboard-card">
              <h3 className="card-title">{problem.title}</h3>
              <p className="card-subtitle">Topic: {problem.topic || "—"} · Source: {problem.sourcePlatform || "—"}</p>
              <div className="problem-description" style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{problem.description || "No description."}</div>
              {problem.constraints && (
                <div style={{ marginTop: 16 }}>
                  <h4>Constraints</h4>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{problem.constraints}</pre>
                </div>
              )}
              {problem.exampleInputs && (
                <div style={{ marginTop: 16 }}>
                  <h4>Examples</h4>
                  <p><strong>Input:</strong> {problem.exampleInputs}</p>
                  <p><strong>Output:</strong> {problem.exampleOutputs}</p>
                </div>
              )}
              {problem.hints && (
                <div style={{ marginTop: 16 }}>
                  <h4>Hints</h4>
                  <p>{problem.hints}</p>
                </div>
              )}
            </div>
          </div>
          <div className="practice-problem-right">
            <CodeCompiler
              problem={problem}
              testCases={testCases}
              initialLanguage="c"
              onSubmit={handleSubmit}
              showSubmit
            />
          </div>
      </div>
    </StudentLayout>
  );
}
