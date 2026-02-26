import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";

import "./MyCourses.css";

const API_BASE = "http://localhost:5000";

const FALLBACK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth"
};

const FALLBACK_COURSES = [
    { id: "1", title: "Placement Pre Assessment - Feb 2026 IT", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400", completed: false },
    { id: "2", title: "Logical Reasoning - 1A", image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400", completed: false },
    { id: "3", title: "Programming Java Level - 4", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400", completed: false },
    { id: "4", title: "Programming C++ - Level 3", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400", completed: false },
    { id: "5", title: "Construction management - Level 0", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400", completed: false },
    { id: "6", title: "New Product Development and Innovations - Level 1D", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400", completed: false },
];

export default function MyCourses() {
    const [activeTab, setActiveTab] = useState("Assessment");
    const [courses, setCourses] = useState(FALLBACK_COURSES);
    const [profile, setProfile] = useState(FALLBACK_PROFILE);

    const registerNo = localStorage.getItem("register_no");

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
        if (registerNo) {
            fetch(`${API_BASE}/api/dashboard/my-courses?register_no=${encodeURIComponent(registerNo)}`)
                .then((r) => r.ok ? r.json() : null)
                .then((data) => {
                    if (Array.isArray(data) && data.length > 0) {
                        setCourses(data.map((c) => ({ id: c.id, title: c.title, image: c.image || "", completed: !!c.completed })));
                    }
                })
                .catch(() => {});
        }
    }, [registerNo]);

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
                        {courses.map((course) => (
                            <Link to={`/course/${course.id}`} className="my-course-card" key={course.id}>
                                <div className="my-course-image">
                                    <img src={course.image} alt={course.title} />
                                    {course.completed && <span className="my-course-badge completed">Completed</span>}
                                </div>
                                <div className="my-course-content">
                                    <h3 className="my-course-title">{course.title}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
