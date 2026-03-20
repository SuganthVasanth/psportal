import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/StudentLayout";

const API_BASE = "http://localhost:5000";

export default function DailyTasks() {
  const [data, setData] = useState({ task: null, problem: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const registerNo = localStorage.getItem("register_no") || "";

  useEffect(() => {
    fetch(`${API_BASE}/api/practice/daily-task`)
      .then((r) => r.json())
      .then((res) => {
        setData({ task: res.task, problem: res.problem });
      })
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentLayout>
      <div className="dashboard-container-inner">
        <div className="welcome-banner">Daily Tasks</div>
        {loading && <p className="card-subtitle">Loading...</p>}
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        {!loading && !error && !data.task && (
          <div className="dashboard-card practice-card">
            <h3 className="card-title">No daily challenge today</h3>
            <p className="card-subtitle">Check back tomorrow for a new coding challenge.</p>
          </div>
        )}
        {!loading && !error && data.task && data.problem && (
          <div className="dashboard-card practice-card">
            <h3 className="card-title">Daily Coding Challenge</h3>
            <p className="card-subtitle">Topic: {data.problem.topic || "—"} · Points: {data.task.points}</p>
            <h4 style={{ marginTop: 12, marginBottom: 8 }}>{data.problem.title}</h4>
            <button
              type="button"
              className="sa-btn sa-btn-primary"
              onClick={() => navigate(`/practice/problem/${encodeURIComponent(data.task.problemId)}`)}
            >
              Start Coding
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
