import React, { useEffect, useMemo, useRef, useState } from "react";
import StudentLayout from "../../components/StudentLayout";
import { Crown, Medal, Rocket } from "lucide-react";
import "./Leaderboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Leaderboard() {
  const [list, setList] = useState([]);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confetti, setConfetti] = useState([]);
  const prevRankRef = useRef(null);
  const registerNo = (localStorage.getItem("register_no") || "").trim();

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/practice/leaderboard?limit=50&period=${encodeURIComponent(period)}`)
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
        setList(rows);
      })
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [period]);

  const myRow = useMemo(() => {
    return list.find((row) => row.register_no === registerNo) || null;
  }, [list, registerNo]);

  useEffect(() => {
    if (!myRow) return;
    const prev = prevRankRef.current;
    const enteredTop3 = (prev == null || prev > 3) && myRow.rank <= 3;
    prevRankRef.current = myRow.rank;
    if (!enteredTop3) return;
    const pieces = Array.from({ length: 28 }).map((_, idx) => ({
      id: `${Date.now()}-${idx}`,
      left: `${8 + Math.random() * 84}%`,
      hue: Math.floor(Math.random() * 360),
      delay: `${Math.random() * 0.3}s`,
      duration: `${1.1 + Math.random() * 1.2}s`,
    }));
    setConfetti(pieces);
    const timer = setTimeout(() => setConfetti([]), 2600);
    return () => clearTimeout(timer);
  }, [myRow]);

  return (
    <StudentLayout>
      <div className="dashboard-container-inner leaderboard-page">
        <section className="leaderboard-hero">
          <div>
            <div className="leaderboard-badge"><Rocket size={14} /> Live Arena</div>
            <h1>Leaderboard</h1>
            <p>Fun animated scoreboard based on real activity points.</p>
          </div>
          <Crown size={24} className="leaderboard-crown" />
        </section>
        {loading && <p className="card-subtitle">Loading...</p>}
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        {!loading && !error && (
          <div className="leaderboard-card">
            <div className="leaderboard-tabs">
              <button type="button" className={period === "all" ? "active" : ""} onClick={() => setPeriod("all")}>
                All Time
              </button>
              <button type="button" className={period === "weekly" ? "active" : ""} onClick={() => setPeriod("weekly")}>
                Weekly
              </button>
              <button type="button" className={period === "monthly" ? "active" : ""} onClick={() => setPeriod("monthly")}>
                Monthly
              </button>
            </div>
            <div className="leaderboard-your-rank">
              {myRow ? (
                <>
                  <strong>Your Rank: #{myRow.rank}</strong>
                  <span>{myRow.points} pts</span>
                  <span>{myRow.problemsSolved} solved</span>
                </>
              ) : (
                <span>You are not ranked yet for this period. Solve problems to enter!</span>
              )}
            </div>
            <h3 className="card-title">Top Performers</h3>
            <p className="card-subtitle">Each Web Practice completion gives +10 activity points.</p>
            <div className="leaderboard-list">
              {list.map((row, idx) => (
                <div
                  className="leaderboard-row"
                  key={row.register_no}
                  style={{ animationDelay: `${Math.min(idx, 20) * 0.06}s` }}
                >
                  <div className="leaderboard-rank">
                    {row.rank <= 3 ? <Medal size={16} /> : null}
                    #{row.rank}
                  </div>
                  <div className="leaderboard-user">
                    <div className="leaderboard-name">{row.name || row.register_no}</div>
                    <div className="leaderboard-reg">{row.register_no}</div>
                  </div>
                  <div className="leaderboard-stats">
                    <span>Solved: {row.problemsSolved}</span>
                    <span>Streak: {row.streak}</span>
                  </div>
                  <div className="leaderboard-points">{row.points} pts</div>
                </div>
              ))}
            </div>
            {list.length === 0 && <p className="sa-muted">No leaderboard data yet.</p>}
            {confetti.length > 0 && (
              <div className="leaderboard-confetti-layer" aria-hidden="true">
                {confetti.map((c) => (
                  <span
                    key={c.id}
                    className="leaderboard-confetti"
                    style={{
                      left: c.left,
                      background: `hsl(${c.hue} 85% 60%)`,
                      animationDelay: c.delay,
                      animationDuration: c.duration,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
