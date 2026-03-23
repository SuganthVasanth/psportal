import React from "react";
import { Link } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { Search, ChevronRight } from "lucide-react";
import "./PSActivity.css";

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
        <StudentLayout>
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
        </StudentLayout>
    );
}
