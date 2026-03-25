import React, { useEffect, useMemo, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { Search, Trophy, CircleCheckBig, Sparkles } from "lucide-react";
import "./WebPractice.css";
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
      <div className="dashboard-container-inner web-practice-page">
        <div className="pb-5">
          <h1 className="text-[22px] font-extrabold text-[#0f0e1a] tracking-tight">Web Practice</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">Solve curated coding problems and track your progress.</p>
        </div>
        <section className="web-practice-hero">
          <div className="web-practice-hero-left">
            <div className="web-practice-badge"><Sparkles size={14} /> Smart Practice</div>
            <h1>Web Practice Arena</h1>
            <p>Clean practice flow, faster solving, and clear progress tracking.</p>
          </div>
          <div className="web-practice-hero-stat">
            <Trophy size={18} />
            <span>{Object.values(statusMap || {}).filter((s) => s?.isAccepted).length} Completed</span>
          </div>
        </section>

        <div className="web-practice-toolbar">
          <div className="web-practice-search-wrap">
            <Search size={16} />
            <input
              placeholder="Search Codeforces questions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="web-practice-levels">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`web-practice-level-btn ${level === opt.value ? "active" : ""}`}
                  onClick={() => setLevel(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
          </div>
          <div className="web-practice-filters">
            <label className="web-practice-check">
              <input
                type="checkbox"
                checked={completedOnly}
                onChange={(e) => setCompletedOnly(e.target.checked)}
              />
              <span>Completed only</span>
            </label>
            {loadingStatus && <span className="web-practice-muted">Loading completion status...</span>}
          </div>
        </div>

        <div className="web-practice-table-card">
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
                    <td className="web-practice-index">{idx + 1}</td>
                    <td>
                      <div className="web-practice-title">{p.title}</div>
                      <div className="web-practice-id">
                        {p.problemId}
                      </div>
                    </td>
                    <td>{p.rating || "—"}</td>
                    <td>{Array.isArray(p.tags) && p.tags.length ? p.tags.slice(0, 2).join(", ") : "—"}</td>
                    <td>
                      <span className={`web-practice-status ${statusMap?.[p.problemId]?.isAccepted ? "ok" : ""}`}>
                        {statusMap?.[p.problemId]?.isAccepted && <CircleCheckBig size={13} />}
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
                        className="web-practice-solve-btn"
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
