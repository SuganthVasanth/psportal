import React, { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const LEVEL_OPTIONS = [
  { value: 1, label: "Level 1" },
  { value: 2, label: "Level 2" },
  { value: 3, label: "Level 3" },
];

function getStatus(level, problemId) {
  const key = `cf:${level}:${problemId}`;
  try {
    const raw = localStorage.getItem("codeforcesPracticeStatus");
    const parsed = raw ? JSON.parse(raw) : {};
    const s = parsed?.[key]?.status;
    return s || "Not attempted";
  } catch {
    return "Not attempted";
  }
}

export default function WebPractice() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [query, setQuery] = useState("");
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/coding/problems/${level}`);
        const data = await res.json().catch(() => []);
        setProblems(Array.isArray(data) ? data : []);
      } catch {
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [level]);

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return (problems || []).filter((p) => {
      if (!q) return true;
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase().includes(q) : false)
      );
    });
  }, [problems, query]);

  return (
    <StudentLayout>
      <div className="dashboard-container-inner" style={{ paddingBottom: 24 }}>
        <div className="welcome-banner">
          <div className="welcome-banner-text">Web Development Practice</div>
        </div>

        <div className="dashboard-card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              className="sa-input"
              placeholder="Search Codeforces questions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`sa-btn sa-btn-sm ${level === opt.value ? "sa-btn-primary" : ""}`}
                  onClick={() => setLevel(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card practice-card">
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Rating</th>
                  <th>Tags</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ color: "#64748b" }}>Loading questions...</td>
                  </tr>
                ) : filtered.map((p, idx) => (
                  <tr key={p.problemId}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {p.problemId}
                      </div>
                    </td>
                    <td>{p.rating || "—"}</td>
                    <td>{Array.isArray(p.tags) && p.tags.length ? p.tags.slice(0, 2).join(", ") : "—"}</td>
                    <td>
                      <span className="sa-pill" style={{ background: "#f1f5f9", color: "#334155" }}>
                        {getStatus(level, p.problemId)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="sa-btn sa-btn-sm sa-btn-primary"
                        onClick={() =>
                          navigate(`/web-practice/${level}/${encodeURIComponent(p.problemId)}`, {
                            state: { selectedProblem: p },
                          })
                        }
                      >
                        Solve
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: "#64748b" }}>
                      No questions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
