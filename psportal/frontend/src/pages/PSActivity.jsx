import React from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { Search, ChevronRight } from "lucide-react";
import "./PSActivity.css";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png"
};

const ACTIVITY_SECTIONS = [
    {
        title: "Academics",
        items: [
            { id: 1, title: "Movement Pass", subtitle: "Click to access", icon: <i className="bx bx-walk" style={{ fontSize: "18px", color: "white" }}></i>, path: "/movement-pass" }
        ]
    },
    {
        title: "Leaves",
        items: [
            { id: 2, title: "My Leaves", subtitle: "Click to access", icon: <i className="bx bxs-report" style={{ fontSize: "18px", color: "white" }}></i>, path: "/my-leaves" }
        ]
    },
    {
        title: "Transport",
        items: [
            { id: 3, title: "Transport Attendance", subtitle: "Click to access", icon: <i className="bx bxs-report" style={{ fontSize: "18px", color: "white" }}></i> }
        ]
    }
];

export default function PSActivity() {
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
                <div className="courses-container ps-activity-container">

                    <div className="ps-activity-header">
                        <div className="ps-title-section">
                            <h1 className="ps-page-title">PS Activity</h1>
                            <p className="ps-page-subtitle">Explore and access various activities and tools available in the platform</p>
                        </div>

                        <div className="ps-search-wrapper">
                            <Search size={16} className="ps-search-icon" />
                            <input
                                type="text"
                                placeholder="Search activities..."
                                className="ps-search-input"
                            />
                        </div>
                    </div>

                    <div className="ps-sections-container">
                        {ACTIVITY_SECTIONS.map((section, idx) => (
                            <div className="ps-section" key={idx}>
                                <h2 className="ps-section-title">{section.title}</h2>
                                <div className="ps-cards-grid">
                                    {section.items.map(item => (
                                        item.path ? (
                                            <Link to={item.path} style={{ textDecoration: 'none', color: 'inherit' }} key={item.id}>
                                                <div className="ps-activity-card">
                                                    <div className="ps-card-icon-wrapper">
                                                        {item.icon}
                                                    </div>
                                                    <div className="ps-card-content">
                                                        <h3 className="ps-card-title">{item.title}</h3>
                                                        <p className="ps-card-subtitle">{item.subtitle}</p>
                                                    </div>
                                                    <ChevronRight size={18} className="ps-card-arrow" />
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="ps-activity-card" key={item.id}>
                                                <div className="ps-card-icon-wrapper">
                                                    {item.icon}
                                                </div>
                                                <div className="ps-card-content">
                                                    <h3 className="ps-card-title">{item.title}</h3>
                                                    <p className="ps-card-subtitle">{item.subtitle}</p>
                                                </div>
                                                <ChevronRight size={18} className="ps-card-arrow" />
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
