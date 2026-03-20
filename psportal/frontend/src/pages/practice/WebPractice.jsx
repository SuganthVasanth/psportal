import React, { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
// no react-router navigation needed (Solve opens in a new tab)

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const LEVEL_OPTIONS = [
  { value: 1, label: "Level 1" },
  { value: 2, label: "Level 2" },
  { value: 3, label: "Level 3" },
];

export default function WebPractice() {
  const [level, setLevel] = useState(1);
  const [query, setQuery] = useState("");
  const [problems, setProblems] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [completedOnly, setCompletedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const registerNo = (localStorage.getItem("register_no") || "").trim();

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

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!registerNo) {
        setStatusMap({});
        return;
      }
      setLoadingStatus(true);
      try {
        const url = `${API_BASE}/api/coding/submissions/status?level=${level}&register_no=${encodeURIComponent(registerNo)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({ statuses: [] }));
        const map = {};
        if (Array.isArray(data?.statuses)) {
          for (const s of data.statuses) {
            map[s.problemId] = s;
          }
        }
        setStatusMap(map);
      } catch {
        setStatusMap({});
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatuses();
  }, [level, registerNo]);

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return (problems || [])
      .filter((p) => {
      if (!q) return true;
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase().includes(q) : false)
      );
      })
      .filter((p) => {
        if (!completedOnly) return true;
        return !!statusMap?.[p.problemId]?.isAccepted;
      });
  }, [problems, query, statusMap, completedOnly]);

  const solveInNewTab = (problemId) => {
    const url = `${window.location.origin}/web-practice/${level}/${encodeURIComponent(problemId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
          <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={completedOnly}
                onChange={(e) => setCompletedOnly(e.target.checked)}
              />
              <span style={{ fontSize: 13, color: "#334155" }}>Completed only</span>
            </label>
            {loadingStatus && <span style={{ fontSize: 13, color: "#64748b" }}>Loading completion status...</span>}
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
                        {statusMap?.[p.problemId]?.isAccepted
                          ? "Passed"
                          : statusMap?.[p.problemId]?.lastVerdict === "Failed"
                            ? "Attempted"
                            : "Not attempted"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="sa-btn sa-btn-sm sa-btn-primary"
                        onClick={() => solveInNewTab(p.problemId)}
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
