import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    SquareLibrary,
    Youtube,
    Layers,
    CodeXml,
    ClipboardCheck,
    LogOut,
    ListTodo,
    FileCode,
    Globe,
    Trophy,
    Bus,
    CalendarCheck,
    Moon,
    Sun,
    ChevronRight,
} from "lucide-react";
import "./StudentSidebar.css";

export default function StudentSidebar() {
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
    };

    const sections = [
        {
            title: "MAIN",
            items: [
                { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
                { name: "Daily Tasks", path: "/daily-tasks", icon: <ListTodo size={20} /> },
            ],
        },
        {
            title: "LEARN",
            items: [
                { name: "Courses Available", path: "/courses-available", icon: <SquareLibrary size={20} /> },
                { name: "My Courses", path: "/my-courses", icon: <Youtube size={20} /> },
                { name: "Web Practice", path: "/web-practice", icon: <Globe size={20} /> },
                { name: "Codeforces Practice", path: "/practice/codeforces", icon: <FileCode size={20} /> },
            ],
        },
        {
            title: "COMPETE",
            items: [
                { name: "Book Slots", path: "/book-slots", icon: <CalendarCheck size={20} /> },
                { name: "Leaderboard", path: "/leaderboard", icon: <Trophy size={20} /> },
                { name: "Attendance", path: "/attendance", icon: <ClipboardCheck size={20} /> },
            ],
        },
        {
            title: "ACCOUNT",
            items: [
                { name: "PS Activity", path: "/ps-activity", icon: <Layers size={20} /> },
                { name: "Code Review", path: "/code-review", icon: <CodeXml size={20} /> },
                { name: "Bus Tracking", path: "/bus-tracking", icon: <Bus size={20} /> },
            ],
        },
    ];

    const profileName = localStorage.getItem("name") || "Suganth R";

    return (
        <aside className="student-sidebar-premium">
            <div className="sidebar-header-premium">
                <img
                    src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png"
                    alt="Logo"
                    className="sidebar-logo-premium"
                />
                <span className="sidebar-brand-premium">PCDP Portal</span>
            </div>

            <nav className="sidebar-nav-premium">
                {sections.map((section) => (
                    <div key={section.title} className="nav-section-premium">
                        <h3 className="section-title-premium">{section.title}</h3>
                        <ul>
                            {section.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            to={item.path}
                                            className={`nav-item-premium ${isActive ? "active" : ""}`}
                                        >
                                            <span className="icon-wrapper-premium">{item.icon}</span>
                                            <span className="item-name-premium">{item.name}</span>
                                            {isActive && <ChevronRight size={14} className="active-indicator-premium" />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer-premium">
                {/* <div className="footer-action-premium" onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                </div> */}
                
                <div className="user-profile-summary-premium">
                    <div className="user-avatar-premium">
                        {profileName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="user-info-premium">
                        <span className="user-name-premium">{profileName}</span>
                        <span className="user-role-premium">Student</span>
                    </div>
                </div>

                <button onClick={handleLogout} className="logout-btn-premium">
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
