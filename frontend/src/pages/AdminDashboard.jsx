import React from "react";
import RoleManagement from "../components/RoleManagement";

export default function AdminDashboard() {
    const role = localStorage.getItem("role");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
    };

    return (
        <div className="dashboard-container" style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
            <header style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid #eee",
                paddingBottom: "15px",
                marginBottom: "30px"
            }}>
                <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ padding: "8px 15px", background: "#e9ecef", borderRadius: "20px", fontSize: "14px" }}>
                        Logged in as: <strong style={{ textTransform: "uppercase", color: "#495057" }}>{role || "Unknown"}</strong>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "8px 15px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="role-view admin-view">
                    <h3>Admin Panel</h3>
                    <p>Welcome! You can assign roles to users and manage students within the system.</p>
                    <RoleManagement userRole={role} />
                </div>
            </main>
        </div>
    );
}
