import React, { useState, useEffect } from "react";
import StudentSidebar from "../components/StudentSidebar";
import AttendanceDetails from "../components/AttendanceDetails";

import axios from "axios";
import "./StudentDashboard.css";

export default function StudentDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeMode, setActiveMode] = useState("Activity Points");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In a real scenario, you'd pass the auth token in headers
                // For this mock integration, we pass the register number as a query param
                const registerNo = localStorage.getItem("register_no") || "7376231CS323";
                const res = await axios.get(`http://localhost:5000/api/dashboard/student?register_no=${encodeURIComponent(registerNo)}`);
                setDashboardData(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data.");
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <StudentSidebar />
                <h2 style={{ marginLeft: 80 }}>Loading Dashboard...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <StudentSidebar />
                <h2 style={{ marginLeft: 80, color: 'red' }}>{error}</h2>
            </div>
        );
    }

    const { profile, points, skills } = dashboardData;

    return (
        <div className="dashboard-layout">
            {/* Top Navbar Header */}
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px" }} />
                    <span>PCDP Portal</span>
                </div>

                <div className="top-nav-profile">
                    <img
                        src={profile.avatarUrl}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <div className="profile-info">
                        <span className="profile-id">{profile.register_no}</span>
                        <span className="profile-name">{profile.name}</span>
                    </div>
                </div>
            </header>

            <StudentSidebar />

            <main className="dashboard-main-area">
                <div className="dashboard-container-inner">
                    <div className="welcome-banner">
                        Welcome back, <span className="highlight">{profile.name}</span>
                    </div>

                    <div className="dashboard-grid">

                        {/* --- LEFT COLUMN --- */}
                        <div className="left-column">

                            {/* Points Wallets */}
                            <div className="dashboard-card pt-wallets-card">
                                <div className="card-header-flex">
                                    <div>
                                        <h3 className="card-title">Points Wallets</h3>
                                        <p className="card-subtitle">Choose a mode to see category points, leaderboard and quest logs.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                    <div
                                        className={`points-wallet-box ${activeMode === "Activity Points" ? 'active' : ''}`}
                                        onClick={() => setActiveMode("Activity Points")}
                                        style={{ cursor: 'pointer', flex: 1, opacity: activeMode === "Activity Points" ? 1 : 0.6 }}
                                    >
                                        {activeMode === "Activity Points" && <div className="status-badge">Active</div>}
                                        <div className="mode-label">MODE</div>
                                        <h3>Activity Points</h3>
                                        <div className="points-label">Points</div>
                                        <div className="points-value">{points.total}</div>
                                    </div>

                                    <div
                                        className={`points-wallet-box ${activeMode === "My Attendance" ? 'active' : ''}`}
                                        onClick={() => setActiveMode("My Attendance")}
                                        style={{ cursor: 'pointer', flex: 1, opacity: activeMode === "My Attendance" ? 1 : 0.6 }}
                                    >
                                        {activeMode === "My Attendance" && <div className="status-badge">Active</div>}
                                        <div className="mode-label">MODE</div>
                                        <h3>My Attendance</h3>
                                        <div className="points-label">Overall %</div>
                                        <div className="points-value">{dashboardData.attendance?.percentage || 0}%</div>
                                    </div>
                                </div>
                            </div>

                            {activeMode === "Activity Points" ? (
                                <>
                                    {/* Points Breakdown */}
                                    <div className="dashboard-card">
                                        <h3 className="card-title">Points Breakdown</h3>
                                        <p className="card-subtitle">Your points organized by source and category.</p>

                                        <table className="breakdown-table">
                                            <thead>
                                                <tr>
                                                    <th>SOURCE / CATEGORY</th>
                                                    <th className="text-right">POINTS EARNED</th>
                                                    <th className="text-right">ELIGIBLE BONUS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {points.breakdown.map((item, idx) => (
                                                    <React.Fragment key={idx}>
                                                        <tr className="category-row">
                                                            <td>{item.category}</td>
                                                            <td className="text-right text-blue">{item.pointsEarned.toFixed(2)}</td>
                                                            <td className="text-right text-orange">{item.eligibleBonus.toFixed(2)}</td>
                                                        </tr>
                                                        {item.transactions.map((tx, txIdx) => (
                                                            <tr className="sub-row" key={txIdx}>
                                                                <td className="source">{tx.source}</td>
                                                                <td className="text-right text-gray">{tx.points > 0 ? tx.points.toFixed(2) : tx.points}</td>
                                                                <td className="text-right text-gray">{tx.bonus}</td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Activity Points List */}
                                    <div className="dashboard-card">
                                        <h3 className="card-title">Activity Points</h3>
                                        <p className="card-subtitle">Recent points transactions.</p>

                                        <div className="activity-list">
                                            {points.recentTransactions.map((tx, idx) => (
                                                <div className="activity-item" key={idx}>
                                                    <div className="activity-icon">⚡</div>
                                                    <div className="activity-details">
                                                        <h4 className="activity-title">
                                                            {tx.title}
                                                            <span className={`tag ${tx.category === 'SSG' ? 'tag-pink' : 'tag-purple'}`}>{tx.category}</span>
                                                            <span className="tag tag-green">{tx.status}</span>
                                                        </h4>
                                                        <p className="activity-meta">
                                                            {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <div className="activity-points">
                                                        +{tx.points}
                                                        <span>Point</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {points.recentTransactions.length === 0 && (
                                                <p style={{ color: '#a0aec0', fontSize: '13px' }}>No recent transactions found.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <AttendanceDetails attendance={dashboardData.attendance} />
                            )}

                        </div>

                        {/* --- RIGHT COLUMN --- */}
                        <div className="right-column">

                            {/* Profile Details Card */}
                            <div className="profile-card">
                                <div className="profile-card-header"></div>
                                <div className="profile-card-body">
                                    <img
                                        src={profile.avatarUrl}
                                        alt="Avatar"
                                        className="profile-card-avatar"
                                    />
                                    <h2 className="profile-card-name">{profile.name}</h2>
                                    <p className="profile-card-dept">{profile.department}</p>
                                </div>
                            </div>

                            {/* Skills Loadout */}
                            <div className="dashboard-card">
                                <h3 className="card-title">Skill Loadout</h3>
                                <div className="skill-tags">
                                    {skills.tags.map((skill, idx) => (
                                        <div className="skill-tag" key={idx}>
                                            {skill.name} <span className="skill-level">{skill.level}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Personalized Skills Progress */}
                            <div className="dashboard-card">
                                <h3 className="card-title">Personalized Skill's Progress</h3>

                                <div className="progress-container">
                                    <div className="progress-block">
                                        <div className="progress-number">{skills.progress.cleared}</div>
                                        <div className="progress-label">Cleared</div>
                                    </div>
                                    <div className="progress-block">
                                        <div className="progress-number">{skills.progress.ongoing}</div>
                                        <div className="progress-label">Ongoing</div>
                                    </div>
                                </div>

                                <button className="action-button">Explore Courses</button>
                            </div>

                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}