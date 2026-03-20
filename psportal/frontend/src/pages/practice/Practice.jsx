import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";

const API_BASE = "http://localhost:5000";

export default function Practice() {
  const [courses, setCourses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [problems, setProblems] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLevelIndex, setSelectedLevelIndex] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const registerNo = (localStorage.getItem("register_no") || "").trim();

  useEffect(() => {
    const params = new URLSearchParams();
    if (registerNo) params.set("register_no", registerNo);
    fetch(`${API_BASE}/api/practice/courses?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setLevels([]);
      setProblems([]);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (registerNo) params.set("register_no", registerNo);
    fetch(`${API_BASE}/api/practice/courses/${encodeURIComponent(selectedCourseId)}/levels?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setLevels(Array.isArray(data) ? data : []))
      .catch(() => setLevels([]))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setProblems([]);
      return;
    }
    const params = new URLSearchParams({ courseId: selectedCourseId });
    if (registerNo) params.set("register_no", registerNo);
    if (selectedLevelIndex !== "") params.set("levelIndex", selectedLevelIndex);
    fetch(`${API_BASE}/api/practice/problems?${params}`)
      .then((r) => r.json())
      .then((data) => setProblems(Array.isArray(data) ? data : []))
      .catch(() => setProblems([]));
  }, [selectedCourseId, selectedLevelIndex]);

  return (
    <StudentLayout>
      <div className="dashboard-container-inner">
          <div className="welcome-banner">
            <div className="welcome-banner-text">Practice</div>
          </div>
          {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
          <div className="practice-layout">
            <aside className="practice-sidebar dashboard-card">
              <h3 className="card-title">Filters</h3>
              <p className="card-subtitle">Course → Level → Problems</p>
              <div className="practice-filters">
                <label>
                  Course
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedLevelIndex("");
                    }}
                    className="sa-input"
                    style={{ marginTop: 4 }}
                  >
                    <option value="">— Select —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedCourseId && (
                  <label style={{ marginTop: 12 }}>
                    Level
                    <select
                      value={selectedLevelIndex}
                      onChange={(e) => setSelectedLevelIndex(e.target.value)}
                      className="sa-input"
                      style={{ marginTop: 4 }}
                    >
                      <option value="">All</option>
                      {levels.map((l) => (
                        <option key={l.id} value={l.levelIndex}>
                          Level {l.levelIndex + 1} – {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </aside>

            <section className="practice-main dashboard-card">
              <h3 className="card-title">Problem details</h3>
              <p className="card-subtitle">
                Select a problem on the right to view the full description and start coding.
              </p>
            </section>

            <aside className="practice-right dashboard-card">
              <h3 className="card-title">Problems</h3>
              <div className="sa-table-wrap" style={{ marginTop: 8 }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Problem</th>
                      <th>Topic</th>
                      <th>Acceptance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p) => (
                      <tr key={p.problemId}>
                        <td>{p.title}</td>
                        <td>{p.topic || "—"}</td>
                        <td>{p.acceptanceRate != null ? `${p.acceptanceRate}%` : "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="sa-btn sa-btn-sm sa-btn-primary"
                            onClick={() => navigate(`/practice/problem/${encodeURIComponent(p.problemId)}`)}
                          >
                            Solve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedCourseId && problems.length === 0 && !loading && (
                <p className="sa-muted">No problems in this selection.</p>
              )}
            </aside>
          </div>
      </div>
    </StudentLayout>
  );
}
