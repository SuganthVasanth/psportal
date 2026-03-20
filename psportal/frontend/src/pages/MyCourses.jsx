import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { Search, BookOpen, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

import "./MyCourses.css";

const API_BASE = "http://localhost:5000";

const inferLevelIndex = (levelName) => {
    const s = (levelName || "").toString();
    const m = s.match(/level\s*(\d+)/i);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n - 1;
};

export default function MyCourses() {
    const [activeTab, setActiveTab] = useState("Assessment");
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name_asc");

    const registerNo = localStorage.getItem("register_no");
    const token = localStorage.getItem("token");

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
                        levelName: c.levelName || "",
                        levelIndex: c.levelIndex ?? null,
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
        if (!token || !registerNo) return;
        const query = new URLSearchParams({ studentId: registerNo });
        fetch(`${API_BASE}/api/enrollments/my?${query}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.ok ? r.json() : [])
            .then((data) => setEnrollments(Array.isArray(data) ? data : []))
            .catch(() => setEnrollments([]));
    }, [token, registerNo]);

    const enrolledNames = useMemo(() => new Set(enrollments.map((e) => e.name).filter(Boolean)), [enrollments]);
    const completedCount = useMemo(() => (Array.isArray(courses) ? courses.filter((c) => c.completed).length : 0), [courses]);

    const filteredAndSortedCourses = useMemo(() => {
        const term = (searchTerm || "").trim().toLowerCase();
        const list = (Array.isArray(courses) ? courses : []).filter((c) => {
            if (!term) return true;
            return ((c.title || "").toLowerCase().includes(term) || (c.levelName || "").toLowerCase().includes(term));
        });

        if (sortBy === "name_asc") {
            list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        } else if (sortBy === "name_desc") {
            list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
        } else if (sortBy === "completed_first") {
            list.sort((a, b) => Number(!!b.completed) - Number(!!a.completed) || (a.title || "").localeCompare(b.title || ""));
        }
        return list;
    }, [courses, searchTerm, sortBy]);

    return (
        <StudentLayout>
            <div className="mycourses-container">
                {/* <div className="mycourses-hero">
                    <div className="mycourses-hero-inner">
                        <div className="mycourses-hero-titleRow">
                            <h1 className="mycourses-title">My Courses</h1>
                            <span className="mycourses-hero-chip">
                                <Sparkles size={14} />
                                Stay consistent
                            </span>
                        </div>
                        <p className="mycourses-subtitle">
                            {courses.length ? `You’re enrolled in ${courses.length} course${courses.length === 1 ? "" : "s"}.` : "All courses you’re enrolled in will appear here."}
                        </p>
                        <div className="mycourses-stats">
                            <div className="mycourses-stat">
                                <div className="mycourses-stat-label">Enrolled</div>
                                <div className="mycourses-stat-value">{courses.length}</div>
                            </div>
                            <div className="mycourses-stat">
                                <div className="mycourses-stat-label">Completed</div>
                                <div className="mycourses-stat-value">{completedCount}</div>
                            </div>
                            <div className="mycourses-stat">
                                <div className="mycourses-stat-label">Active</div>
                                <div className="mycourses-stat-value">{Math.max(0, courses.length - completedCount)}</div>
                            </div>
                        </div>
                    </div>
                </div> */}

<div className="mycourses-toggle" role="tablist" aria-label="Course mode">
                        <button
                            type="button"
                            className={`mycourses-toggle-btn ${activeTab === "Assessment" ? "active" : ""}`}
                            onClick={() => setActiveTab("Assessment")}
                            role="tab"
                            aria-selected={activeTab === "Assessment"}
                        >
                            Assessment
                        </button>
                        <button
                            type="button"
                            className={`mycourses-toggle-btn ${activeTab === "Practice" ? "active" : ""}`}
                            onClick={() => setActiveTab("Practice")}
                            role="tab"
                            aria-selected={activeTab === "Practice"}
                        >
                            Practice
                        </button>
                    </div>

                <div className="mycourses-grid">
                    {filteredAndSortedCourses.length === 0 ? (
                        <div className="mycourses-empty">
                            <p>{courses.length === 0 ? "No enrolled courses yet." : "No courses match your search."}</p>
                            <p className="mycourses-empty-hint">Go to Courses Available to register.</p>
                        </div>
                    ) : (
                        filteredAndSortedCourses.map((course) => (
                            (() => {
                                const inferred = inferLevelIndex(course.levelName);
                                const explicitLevelIndex = Number.isFinite(Number(course.levelIndex)) ? Number(course.levelIndex) : null;
                                const to =
                                    explicitLevelIndex != null
                                        ? `/course/${course.id}/level/${explicitLevelIndex}`
                                        : inferred != null
                                        ? `/course/${course.id}/level/${inferred}`
                                        : `/course/${course.id}${course.levelName ? `?level=${encodeURIComponent(course.levelName)}` : ""}`;
                                return (
                            <div className="mycourses-card" key={course.id} style={{ cursor: "default" }}>
                                <Link to={to} style={{ textDecoration: "none", color: "inherit", display: "block", flex: 1, minHeight: 0 }}>
                                    <div className="mycourses-card-media">
                                        {course.image ? (
                                            <img src={course.image} alt={course.title} />
                                        ) : (
                                            <div className="mycourses-card-placeholder" aria-hidden="true">
                                                <BookOpen size={44} />
                                            </div>
                                        )}
                                        <div className="mycourses-card-overlay" aria-hidden="true" />
                                        {course.completed && (
                                            <span className="mycourses-badge mycourses-badge-completed">
                                                <CheckCircle2 size={14} />
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                    <div className="mycourses-card-body" style={{ paddingBottom: 8 }}>
                                        <h3 className="mycourses-card-title">{course.title}</h3>
                                        <div className="mycourses-card-meta">
                                            {course.levelName ? <span className="mycourses-pill">Level: {course.levelName}</span> : <span className="mycourses-pill">Course</span>}
                                            <span className={`mycourses-pill ${course.completed ? "is-done" : "is-open"}`}>{course.completed ? "Done" : "In progress"}</span>
                                        </div>
                                        <div className="mycourses-card-cta">
                                            <span className="mycourses-cta-btn">
                                                Open
                                                <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                                );
                            })()
                        ))
                    )}
                </div>

                    {/* <h2 className="my-enrollments-title">My Enrollments</h2> */}
                    {/* <p className="my-enrollments-subtitle">PS courses you registered for. Complete prerequisites to unlock.</p> */}
                    {enrollments.length === 0 ? (
                        <p className="mycourses-muted">No PS enrollments yet. Go to Courses Available to register.</p>
                    ) : (
                        <div className="my-enrollments-grid">
                            {enrollments.map((e) => {
                                const prereq = e.prereq || [];
                                const unmet = prereq.filter((p) => !enrolledNames.has(p));
                                const locked = unmet.length > 0;
                                // return (
                                //     <div className={`my-enrollment-card ${locked ? "locked" : ""}`} key={e.id}>
                                //         <div className="my-enrollment-content">
                                //             <h3 className="my-enrollment-name">{e.name}</h3>
                                //             <p className="my-enrollment-desc">{(e.description || "").slice(0, 80)}{(e.description || "").length > 80 ? "…" : ""}</p>
                                //             <div className="my-enrollment-progress-wrap">
                                //                 <div className="my-enrollment-progress-bar">
                                //                     <div className="my-enrollment-progress-fill" style={{ width: `${e.progress || 0}%` }} />
                                //                 </div>
                                //                 <span className="my-enrollment-progress-text">{e.progress || 0}%</span>
                                //             </div>
                                //             {locked && (
                                //                 <p className="my-enrollment-prereq">Complete prerequisites: {unmet.join(", ")}</p>
                                //             )}
                                //         </div>
                                //     </div>
                                // );
                            })}
                        </div>
                    )}

            </div>
        </StudentLayout>
    );
}
