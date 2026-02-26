import React, { useState } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";

import "./MyCourses.css";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth"
};

const MY_COURSES = [
    {
        id: 1,
        title: 'Placement Pre Assessment - Feb 2026 IT',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 2,
        title: 'Logical Reasoning - 1A',
        image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 3,
        title: 'Programming Java Level - 4',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 4,
        title: 'Programming C++ - Level 3',
        image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 5,
        title: 'Construction management - Level 0',
        image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400'
    },
    {
        id: 6,
        title: 'New Product Development and Innovations - Level 1D - Artistic Design Vertical',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400'
    }
];

export default function MyCourses() {
    const [activeTab, setActiveTab] = useState("Assessment");

    return (
        <div className="dashboard-layout">
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                    <span>PCDP Portal</span>
                </div>

                <div className="top-nav-profile">
                    <img
                        src={MOCK_PROFILE.avatarUrl}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <div className="profile-info">
                        <span className="profile-id">{MOCK_PROFILE.register_no}</span>
                        <span className="profile-name">{MOCK_PROFILE.name}</span>
                    </div>
                </div>
            </header>

            <StudentSidebar />

            <main className="dashboard-main-area">
                <div className="courses-container">

                    <h1 className="page-title">My Courses</h1>

                    {/* Toggle Switch */}
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

                    {/* Courses Grid - click goes to course detail (materials + book slot) */}
                    <div className="my-courses-grid">
                        {MY_COURSES.map((course) => (
                            <Link to={`/course/${course.id}`} className="my-course-card" key={course.id}>
                                <div className="my-course-image">
                                    <img src={course.image} alt={course.title} />
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
