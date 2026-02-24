import React from "react";
import { Navigate } from "react-router-dom";
import SuperAdminDashboard from "./SuperAdminDashboard";
import AdminDashboard from "./AdminDashboard";
import InternDashboard from "./InternDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
  const role = localStorage.getItem("role");

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
      // If no valid role is found, log them out for safety
      return <Navigate to="/" />;
  }
}
