import React from "react";
import { Navigate } from "react-router-dom";
import SuperAdminDashboard from "./SuperAdminDashboard";
import AdminDashboard from "./AdminDashboard";
import InternDashboard from "./InternDashboard";
import StudentDashboard from "./StudentDashboard";
import UserDashboard from "./UserDashboard";

const USER_DASHBOARD_ROLES = ["mentor", "warden", "technical_faculty", "technical faculty"];

export default function Dashboard() {
  const role = (localStorage.getItem("role") || "").toLowerCase();

  switch (role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "intern":
      return <InternDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      if (USER_DASHBOARD_ROLES.some((r) => r.toLowerCase() === role)) {
        return <UserDashboard />;
      }
      return <Navigate to="/" />;
  }
}
