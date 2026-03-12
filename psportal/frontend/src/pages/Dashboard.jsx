import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import SuperAdminDashboard from "./SuperAdminDashboard";
import AdminDashboard from "./AdminDashboard";
import InternDashboard from "./InternDashboard";
import StudentDashboard from "./StudentDashboard";
import StaffDashboardLayout from "./StaffDashboardLayout";

const API_BASE = "http://localhost:5000";
const STAFF_ROLES = ["mentor", "warden", "technical_faculty", "technical faculty", "non_teaching_faculty"];

function getRolesFromStorage() {
  try {
    const raw = localStorage.getItem("roles");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr.map((r) => String(r).toLowerCase().replace(/\s+/g, "_"));
    }
  } catch (_) {}
  const single = localStorage.getItem("role");
  return single ? [single.toLowerCase().replace(/\s+/g, "_")] : [];
}

export default function Dashboard() {
  const [roles, setRoles] = useState(getRolesFromStorage);
  const [rolesFetched, setRolesFetched] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRolesFetched(true);
      return;
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((user) => {
        const roleNames = (user.roles || []).map((r) => (typeof r === "object" && r?.role_name ? r.role_name : String(r)).toLowerCase().replace(/\s+/g, "_"));
        localStorage.setItem("roles", JSON.stringify(roleNames));
        const primary = roleNames.includes("super_admin")
          ? "super_admin"
          : roleNames.includes("admin")
            ? "admin"
            : roleNames[0] || "student";
        localStorage.setItem("role", primary);
        setRoles(roleNames);
        if (user.register_no) localStorage.setItem("register_no", user.register_no);
      })
      .catch(() => {})
      .finally(() => setRolesFetched(true));
  }, []);

  const isStaff = roles.some((r) => STAFF_ROLES.some((s) => s.toLowerCase().replace(/\s+/g, "_") === r));

  if (!rolesFetched) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <h2>Loading…</h2>
      </div>
    );
  }

  if (roles.includes("super_admin")) return <SuperAdminDashboard />;
  if (roles.includes("admin")) return <AdminDashboard />;
  if (roles.includes("student")) return <StudentDashboard />;
  if (roles.includes("intern") && !isStaff) return <InternDashboard />;
  if (isStaff) return <StaffDashboardLayout />;
  if (roles.includes("intern")) return <InternDashboard />;

  return <Navigate to="/" />;
}
