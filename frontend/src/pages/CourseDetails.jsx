import React from "react";
import StudentSidebar from "../components/StudentSidebar";
import { BookOpen, Award } from "lucide-react";
import "./CourseDetails.css";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth"
};

const APTITUDE_LEVELS = [
    {
        id: 1,
        title: "Aptitude Level - 1A",
        topics: ["1. Number System, Ratio Proportion"],
        attempts: 8,
        status: "Completed",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 2,
        title: "Aptitude Level - 1B",
        topics: ["1. Alligation & Mixtures", "2. Partnership"],
        attempts: 1,
        status: "Completed",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 3,
        title: "Aptitude Level - 1C",
        topics: ["1. Percentage", "2. Profit Loss"],
        attempts: 3,
        status: "Completed",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 4,
        title: "Aptitude Level - 1D",
        topics: ["1. Time & Work", "2. Pipes & Cisterns"],
        attempts: 0,
        status: "Register",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 5,
        title: "Aptitude Level - 1E",
        topics: ["1. Averages", "2. SI and CI"],
        attempts: 11,
        status: "Completed",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 6,
        title: "Aptitude Level - 1F",
        topics: ["1. Time Speed and Distance", "2. Problems on Trains", "3. Boats and Streams"],
        attempts: 0,
        status: "Register",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 7,
        title: "Aptitude Level - 1G",
        topics: ["1. Permutation , Combination & Probability"],
        attempts: 6,
        status: "Register",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 8,
        title: "Aptitude Level - 1H",
        topics: ["1. Ages & Calendar"],
        attempts: 1,
        status: "Completed",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 9,
        title: "Aptitude Level - 1I",
        topics: ["1. Clocks & Directions"],
        attempts: 1,
        status: "Completed",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 10,
        title: "Aptitude level- 1J",
        topics: ["1. HCF and LCM", "2. Problems on Numbers"],
        attempts: 0,
        status: "Register",
        rewards: "100 RP",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 11,
        title: "Aptitude Level - 1K",
        topics: ["1. Decimals and fractions", "2. Simplification"],
        attempts: 0,
        status: "Register",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 12,
        title: "Aptitude Level - 1L",
        topics: ["1. Square and cubic roots", "2. Logarithm"],
        attempts: 0,
        status: "Register",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 13,
        title: "Aptitude Level - 1M",
        topics: ["1. Stocks and share", "2. bankers discount"],
        attempts: 0,
        status: "Register",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    },
    {
        id: 14,
        title: "Aptitude Level - 1N",
        topics: ["1. Area , Volume, surface"],
        attempts: 0,
        status: "Register",
        rewards: "100",
        preRequest: "No",
        assessmentType: "MCQ"
    }
];

export default function CourseDetails() {
    return (
        <div className="dashboard-layout cd-layout">
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

            <main className="dashboard-main-area cd-main">
                <div className="cd-container">

                    {/* Top Course Card */}
                    <div className="cd-header-card">
                        <div className="cd-header-info">
                            <h1 className="cd-title">Aptitude</h1>
                            <div className="cd-meta">
                                <span className="cd-meta-item">
                                    <BookOpen size={16} className="cd-meta-icon" />
                                    Levels: 14
                                </span>
                                <span className="cd-meta-item cd-skill-type">
                                    <Award size={16} className="cd-meta-icon" />
                                    GENERAL Skill
                                </span>
                            </div>
                        </div>
                        <div className="cd-header-image">
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" alt="Course" />
                        </div>
                    </div>

                    {/* Levels List */}
                    <div className="cd-levels-list">
                        {APTITUDE_LEVELS.map((level) => (
                            <div className="cd-level-card" key={level.id}>

                                <div className="cd-level-top">
                                    <div className="cd-level-title-group">
                                        <div className="cd-level-number">{level.id}</div>
                                        <h3 className="cd-level-title">{level.title}</h3>
                                    </div>
                                    <div className="cd-level-badges">
                                        <span className="cd-badge attempt-badge">Attempts: {level.attempts}</span>
                                        {level.status === "Completed" && (
                                            <span className="cd-badge completed-badge">Completed</span>
                                        )}
                                    </div>
                                </div>

                                <div className="cd-level-content">
                                    <div className="cd-topics-column">
                                        {level.topics.map((topic, idx) => (
                                            <div className="cd-topic-item" key={idx}>
                                                {topic}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="cd-details-column">
                                        <div className="cd-detail-item">
                                            <span className="cd-detail-label">With Rewards</span>
                                            <span className="cd-detail-value medal-value">
                                                <Award size={14} className="medal-icon" /> {level.rewards}
                                            </span>
                                        </div>
                                        <div className="cd-detail-item">
                                            <span className="cd-detail-label">Pre Request</span>
                                            <span className="cd-detail-value">{level.preRequest}</span>
                                        </div>
                                        {level.assessmentType && (
                                            <div className="cd-detail-item">
                                                <span className="cd-detail-label">Assessment Type</span>
                                                <span className="cd-detail-value">{level.assessmentType}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {level.status === "Register" && (
                                    <div className="cd-level-action">
                                        <button className="cd-register-btn">Register</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
