import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    SquareLibrary,
    Youtube,
    Layers,
    CodeXml,
    LogOut
} from "lucide-react";
import "./StudentSidebar.css";

export default function StudentSidebar() {
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
    };

    const navItems = [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={22} /> },
        { name: "Courses Available", path: "/courses-available", icon: <SquareLibrary size={22} /> },
        { name: "My Courses", path: "/my-courses", icon: <Youtube size={22} /> },
        { name: "PS Activity", path: "/ps-activity", icon: <Layers size={22} /> },
        { name: "Code Review", path: "/code-review", icon: <CodeXml size={22} /> }
    ];

    return (
        <aside className="student-sidebar-minimal">
            <nav className="sidebar-nav-minimal">
                <ul>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
                        return (
                            <li key={item.name} className="sidebar-li-minimal">
                                <Link to={item.path} className={isActive ? "nav-item active" : "nav-item"}>
                                    {item.icon}
                                    <h2 className="nav-tooltip">{item.name}</h2>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="sidebar-footer-minimal">
                <button onClick={handleLogout} className="logout-btn-minimal nav-item">
                    <LogOut size={22} />
                    <h2 className="nav-tooltip">Logout</h2>
                </button>
            </div>
        </aside>
    );
}
