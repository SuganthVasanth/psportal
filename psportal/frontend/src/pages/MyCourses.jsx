import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";

import "./MyCourses.css";

const API_BASE = "http://localhost:5000";

const FALLBACK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png"
};

export default function MyCourses() {
    const [activeTab, setActiveTab] = useState("Assessment");
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [profile, setProfile] = useState(FALLBACK_PROFILE);

    const registerNo = localStorage.getItem("register_no");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (registerNo) {
            fetch(`${API_BASE}/api/dashboard/student?register_no=${encodeURIComponent(registerNo)}`)
                .then((r) => r.ok ? r.json() : null)
                .then((data) => {
                    if (data?.profile) {
                        setProfile({
                            register_no: data.profile.register_no,
                            name: data.profile.name,
                            avatarUrl: data.profile.avatarUrl || FALLBACK_PROFILE.avatarUrl,
                        });
                    }
                })
                .catch(() => {});
        }
    }, [registerNo]);

    useEffect(() => {
        if (!registerNo) return;
        fetch(`${API_BASE}/api/dashboard/my-courses?register_no=${encodeURIComponent(registerNo)}`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (Array.isArray(data)) {
                    setCourses(data.map((c) => ({
                        id: c.id,
                        title: c.title,
                        image: c.image || "",
                        completed: !!c.completed,
                        levelName: c.levelName || ""
                    })));
                } else {
                    setCourses([]);
                }
            })
            .catch(() => {
                setCourses([]);
            });
    }, [registerNo]);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/api/enrollments/my`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.ok ? r.json() : [])
            .then((data) => setEnrollments(Array.isArray(data) ? data : []))
            .catch(() => setEnrollments([]));
    }, [token]);

    const enrolledNames = useMemo(() => new Set(enrollments.map((e) => e.name).filter(Boolean)), [enrollments]);

    const displayProfile = registerNo ? { ...FALLBACK_PROFILE, ...profile, register_no: profile.register_no || registerNo } : FALLBACK_PROFILE;

    return (
        <div className="dashboard-layout">
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                    <span>PCDP Portal</span>
                </div>

                <div className="top-nav-profile">
                    <img
                        src={displayProfile.avatarUrl}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <div className="profile-info">
                        <span className="profile-id">{displayProfile.register_no}</span>
                        <span className="profile-name">{displayProfile.name}</span>
                    </div>
                </div>
            </header>

            <StudentSidebar />

            <main className="dashboard-main-area">
                <div className="courses-container">

                    <h1 className="page-title">My Courses</h1>

                    <div className="my-courses-toggle">
                        <button
                            className={`toggle-btn ${activeTab === 'Assessment' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Assessment')}
                        >
                            Assessment
                        </button>
                        <button
                            className={`toggle-btn ${activeTab === 'Practice' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Practice')}
                        >
                            Practice
                        </button>
                    </div>

                    <div className="my-courses-grid">
                        {courses.length === 0 ? (
                            <p className="courses-empty">No enrolled courses yet. Browse Courses Available to register.</p>
                        ) : (
                            courses.map((course) => (
                                <Link
                                    to={`/course/${course.id}${course.levelName ? `?level=${encodeURIComponent(course.levelName)}` : ""}`}
                                    className="my-course-card"
                                    key={course.id}
                                >
                                    <div className="my-course-image">
                                        <img src={course.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400"} alt={course.title} />
                                        {course.completed && <span className="my-course-badge completed">Completed</span>}
                                    </div>
                                    <div className="my-course-content">
                                        <h3 className="my-course-title">{course.title}</h3>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    <h2 className="my-enrollments-title">My Enrollments</h2>
                    <p className="my-enrollments-subtitle">PS courses you registered for. Complete prerequisites to unlock.</p>
                    {enrollments.length === 0 ? (
                        <p className="courses-empty">No PS enrollments yet. Go to Courses Available to register.</p>
                    ) : (
                        <div className="my-enrollments-grid">
                            {enrollments.map((e) => {
                                const prereq = e.prereq || [];
                                const unmet = prereq.filter((p) => !enrolledNames.has(p));
                                const locked = unmet.length > 0;
                                return (
                                    <div className={`my-enrollment-card ${locked ? "locked" : ""}`} key={e.id}>
                                        <div className="my-enrollment-content">
                                            <h3 className="my-enrollment-name">{e.name}</h3>
                                            <p className="my-enrollment-desc">{(e.description || "").slice(0, 80)}{(e.description || "").length > 80 ? "…" : ""}</p>
                                            <div className="my-enrollment-progress-wrap">
                                                <div className="my-enrollment-progress-bar">
                                                    <div className="my-enrollment-progress-fill" style={{ width: `${e.progress || 0}%` }} />
                                                </div>
                                                <span className="my-enrollment-progress-text">{e.progress || 0}%</span>
                                            </div>
                                            {locked && (
                                                <p className="my-enrollment-prereq">Complete prerequisites: {unmet.join(", ")}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
