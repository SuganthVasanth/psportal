import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Star,
    TrendingUp,
    Check,
    X,
    Settings,
    LineChart,
    Calendar,
    Trophy,
} from "lucide-react";
import "./StudentDashboard.css";
import StudentLayout from "../components/StudentLayout";
import AttendanceDetails from "../components/AttendanceDetails";
import RewardPointsPanel from "../components/RewardPointsPanel";

const API_BASE = (
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
).replace(/\/$/, "");

function categoryPillClass(cat) {
    const c = (cat || "").toLowerCase();
    if (c.includes("assessment")) return "sd-pill sd-pill-blue";
    if (c.includes("ssg")) return "sd-pill sd-pill-amber";
    if (c.includes("daily")) return "sd-pill sd-pill-slate";
    return "sd-pill sd-pill-slate";
}

function skillLevelToPercent(level) {
    const n = Number(level);
    if (!Number.isFinite(n) || n <= 0) return 35;
    return Math.min(98, Math.round(20 + n * 8));
}

function AttendanceRing({ percentage, size = 76 }) {
    const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
    const stroke = 6;
    const r = (size - stroke) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const dash = (pct / 100) * circumference;
    return (
        <svg
            width={size}
            height={size}
            className="sd-attendance-ring"
            aria-hidden
        >
            <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={stroke}
            />
            <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke="#1e40af"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                transform={`rotate(-90 ${c} ${c})`}
            />
            <text
                x={c}
                y={c + 5}
                textAnchor="middle"
                className="sd-attendance-ring-text"
            >
                {Math.round(pct)}%
            </text>
        </svg>
    );
}

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attendance, setAttendance] = useState(null);
    /** 'activity' | 'attendance' | 'reward' */
    const [activeView, setActiveView] = useState("activity");

    const registerNo = localStorage.getItem("register_no");

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!registerNo) {
                setError("Not logged in");
                setLoading(false);
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${API_BASE}/api/dashboard/student?register_no=${encodeURIComponent(
                        registerNo
                    )}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) throw new Error("Failed to load dashboard");
                const data = await res.json();
                setDashboardData(data);
            } catch (e) {
                setError(e.message || "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [registerNo]);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!registerNo) return;
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${API_BASE}/api/attendance?register_no=${encodeURIComponent(
                        registerNo
                    )}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const data = await res.json();
                    setAttendance(data);
                }
            } catch {
                /* optional */
            }
        };
        fetchAttendance();
    }, [registerNo]);

    const profile = dashboardData?.profile;
    const points = dashboardData?.points;
    const skills = dashboardData?.skills;
    const rewardPoints = dashboardData?.rewardPoints || {};

    const firstName = useMemo(() => {
        const n = profile?.name || "Student";
        return n.trim().split(/\s+/)[0] || "Student";
    }, [profile?.name]);

    const displayId = profile?.register_no || registerNo || "—";
    const totalPoints = points?.total ?? 0;
    const recentRows = points?.recentTransactions || [];
    const skillTags = skills?.tags || [];

    const attPct = attendance?.percentage ?? 0;
    const presentDays = attendance?.presentDays ?? 0;
    const absentDays = attendance?.absentDays ?? 0;

    const balanceReward = rewardPoints.balance ?? 0;

    if (loading) {
        return (
            <StudentLayout>
                <div className="student-dashboard-v2 sd-loading">
                    <div className="sd-spinner" />
                    <p>Loading your dashboard…</p>
                </div>
            </StudentLayout>
        );
    }

    if (error || !dashboardData) {
        return (
            <StudentLayout>
                <div className="student-dashboard-v2 sd-error">
                    <p>{error || "Unable to load dashboard."}</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="student-dashboard-v2">
                <header className="sd-header">
                    <div>
                        <h1 className="sd-welcome">Welcome back, {firstName}</h1>
                        <p className="sd-sub">
                            Here’s a snapshot of your progress and activity.
                        </p>
                    </div>
                    <div className="sd-status-pill" role="status">
                        <span className="sd-status-dot" />
                        System Status: Optimal
                    </div>
                </header>

                <div className="sd-top-grid sd-top-grid--metrics">
                    <button
                        type="button"
                        className={`sd-metric-card sd-metric-card--activity ${
                            activeView === "activity" ? "sd-metric-card--active" : ""
                        }`}
                        onClick={() => setActiveView("activity")}
                    >
                        <div className="sd-metric-card-top">
                            <span className="sd-kicker">Activity points</span>
                            <div className="sd-icon-circle" aria-hidden>
                                <LineChart size={18} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="sd-metric-value">{totalPoints}</div>
                        <p className="sd-metric-label">Total points earned</p>
                        <div className="sd-metric-accent sd-metric-accent--navy" />
                    </button>

                    <button
                        type="button"
                        className={`sd-metric-card sd-metric-card--attendance ${
                            activeView === "attendance"
                                ? "sd-metric-card--active sd-metric-card--active-att"
                                : ""
                        }`}
                        onClick={() => setActiveView("attendance")}
                    >
                        <div className="sd-metric-card-top">
                            <span className="sd-kicker">Attendance</span>
                            <div className="sd-icon-circle sd-icon-circle--green" aria-hidden>
                                <Calendar size={18} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="sd-metric-value-row">
                            <span className="sd-metric-value">{Math.round(attPct)}%</span>
                            <AttendanceRing percentage={attPct} size={64} />
                        </div>
                        <p className="sd-metric-label">
                            {presentDays} present / {absentDays} absent
                        </p>
                    </button>

                    <button
                        type="button"
                        className={`sd-metric-card sd-metric-card--reward ${
                            activeView === "reward"
                                ? "sd-metric-card--active sd-metric-card--active-reward"
                                : ""
                        }`}
                        onClick={() => setActiveView("reward")}
                    >
                        {activeView === "reward" && (
                            <span className="sd-reward-dot" aria-hidden />
                        )}
                        <div className="sd-metric-card-top">
                            <span className="sd-kicker">Reward points</span>
                            <div className="sd-icon-circle sd-icon-circle--amber" aria-hidden>
                                <Trophy size={18} strokeWidth={2} />
                            </div>
                        </div>
                        <div className="sd-metric-value">{balanceReward}</div>
                        <p className="sd-metric-label">Balance points</p>
                    </button>

                    <div className="sd-card sd-card-navy sd-profile-navy">
                        <div className="sd-profile-navy-top">
                            <img
                                src={
                                    profile?.avatarUrl ||
                                    "https://ui-avatars.com/api/?name=" +
                                        encodeURIComponent(
                                            profile?.name || "Student"
                                        ) +
                                        "&background=1e3a8a&color=fff&size=128"
                                }
                                alt=""
                                className="sd-profile-avatar"
                            />
                            <div className="sd-profile-text">
                                <h3 className="sd-profile-name">
                                    {profile?.name || "Student"}
                                </h3>
                                <p className="sd-profile-id">ID: {displayId}</p>
                            </div>
                        </div>
                        <div className="sd-profile-divider" />
                        <div className="sd-profile-meta">
                            <div>
                                <span className="sd-meta-label">Major</span>
                                <p className="sd-meta-value">
                                    {profile?.department || "—"}
                                </p>
                            </div>
                            <div>
                                <span className="sd-meta-label">Academic year</span>
                                <p className="sd-meta-value">
                                    {profile?.year || "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {activeView === "activity" && (
                    <div className="sd-bottom-grid">
                        <div className="sd-card sd-card-white sd-points-card">
                            <div className="sd-points-head">
                                <h2 className="sd-section-title">Points breakdown</h2>
                                <button
                                    type="button"
                                    className="sd-link"
                                    onClick={() => navigate("/daily-tasks")}
                                >
                                    View Full Report
                                </button>
                            </div>
                            <div className="sd-table-wrap">
                                <table className="sd-table">
                                    <thead>
                                        <tr>
                                            <th>Activity name</th>
                                            <th>Category</th>
                                            <th>Date</th>
                                            <th className="sd-th-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentRows.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="sd-table-empty"
                                                >
                                                    No recent point transactions yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentRows.map((row, i) => (
                                                <tr key={i}>
                                                    <td className="sd-td-title">
                                                        {row.title || "—"}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={categoryPillClass(
                                                                row.category
                                                            )}
                                                        >
                                                            {row.category || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="sd-td-muted">
                                                        {row.date || "—"}
                                                    </td>
                                                    <td className="sd-td-points">
                                                        +
                                                        {row.points != null
                                                            ? row.points
                                                            : "0"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="sd-card sd-card-white sd-skills-card">
                            <div className="sd-skills-head">
                                <Settings
                                    size={18}
                                    className="sd-skills-gear"
                                    strokeWidth={2}
                                />
                                <h2 className="sd-section-title">Skill Loadout</h2>
                            </div>
                            <div className="sd-skills-list">
                                {skillTags.length === 0 ? (
                                    <p className="sd-skills-empty">
                                        Skill tags will appear here as you progress.
                                    </p>
                                ) : (
                                    skillTags.map((tag, i) => {
                                        const pct = skillLevelToPercent(tag.level);
                                        return (
                                            <div
                                                className="sd-skill-row"
                                                key={`${tag.name}-${i}`}
                                            >
                                                <div className="sd-skill-row-top">
                                                    <span className="sd-skill-name">
                                                        {tag.name}
                                                    </span>
                                                    <span className="sd-skill-pct">
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div
                                                    className="sd-skill-bar"
                                                    role="progressbar"
                                                    aria-valuenow={pct}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >
                                                    <div
                                                        className="sd-skill-bar-fill"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <p className="sd-skill-sub">
                                                    Level {tag.level ?? "—"}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <button
                                type="button"
                                className="sd-btn-ghost"
                                onClick={() => navigate("/my-courses")}
                            >
                                Endorse skills
                            </button>
                        </div>
                    </div>
                )}

                {activeView === "attendance" && (
                    <div className="sd-panel-flow">
                        <div className="sd-card sd-card-white sd-attendance-wrap">
                            <AttendanceDetails attendance={attendance} />
                        </div>
                    </div>
                )}

                {activeView === "reward" && (
                    <div className="sd-panel-flow">
                        <RewardPointsPanel
                            profile={profile}
                            rewardPoints={rewardPoints}
                        />
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
