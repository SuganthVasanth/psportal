import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/StudentLayout";

const API_BASE = "http://localhost:5000";

export default function Leaderboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/practice/leaderboard?limit=50`)
      .then((r) => r.json())
      .then(setList)
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentLayout>
      <div className="dashboard-container-inner">
        <div className="welcome-banner">Leaderboard</div>
        {loading && <p className="card-subtitle">Loading...</p>}
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        {!loading && !error && (
          <div className="dashboard-card practice-card">
            <h3 className="card-title">Rankings</h3>
            <p className="card-subtitle">By problems solved and streak. Data from MongoDB.</p>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Register No</th>
                    <th>Problems Solved</th>
                    <th>Streak</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.register_no}>
                      <td>{row.rank}</td>
                      <td>{row.register_no}</td>
                      <td>{row.problemsSolved}</td>
                      <td>{row.streak}</td>
                      <td>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.length === 0 && <p className="sa-muted">No leaderboard data yet.</p>}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
