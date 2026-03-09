import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { LogOut, Users, Building2, BookOpen, ChevronDown } from "lucide-react";
import "./SuperAdminDashboard.css";
import "./UserDashboard.css";
import StaffMentorMentees from "./StaffMentorMentees";
import StaffMentorLeaveApprovals from "./StaffMentorLeaveApprovals";
import StaffWardenWards from "./StaffWardenWards";
import StaffWardenBiometric from "./StaffWardenBiometric";
import StaffWardenLeaveApprovals from "./staff/StaffWardenLeaveApprovals";
import FacultyDashboard from "./FacultyDashboard";
import StaffFacultyCodeReview from "./StaffFacultyCodeReview";
import StaffFacultyStudentAnswers from "./StaffFacultyStudentAnswers";

const API_BASE = "http://localhost:5000";

const STAFF_NAV = [
  {
    id: "mentor",
    label: "Mentor",
    icon: Users,
    roleKey: "mentor",
    sub: [
      { id: "mentees", label: "My mentees", path: "/dashboard/mentor/mentees" },
      { id: "leave-approvals", label: "Student Leaves", path: "/dashboard/mentor/leave-approvals" },
    ],
  },
  {
    id: "warden",
    label: "Warden",
    icon: Building2,
    roleKey: "warden",
    sub: [
      { id: "wards", label: "My wards", path: "/dashboard/warden/wards" },
      { id: "biometric", label: "Biometric details", path: "/dashboard/warden/biometric" },
      { id: "leave-approvals", label: "Warden Leaves", path: "/dashboard/warden/leave-approvals" },
    ],
  },
  {
    id: "faculty",
    label: "Technical faculty",
    icon: BookOpen,
    roleKey: "technical_faculty",
    sub: [
      { id: "question-banks", label: "Questions uploading", path: "/dashboard/faculty/question-banks" },
      { id: "code-review", label: "Code review", path: "/dashboard/faculty/code-review" },
      { id: "student-answers", label: "Student's answers", path: "/dashboard/faculty/student-answers" },
    ],
  },
];

function getStaffNavSections(roles, data) {
  const r = (roles || []).map((x) => String(x).toLowerCase().replace(/\s+/g, "_"));
  if (data?.mentees?.length > 0 && !r.includes("mentor")) r.push("mentor");
  if (data?.ward_students?.length > 0 && !r.includes("warden")) r.push("warden");

  return STAFF_NAV.filter((s) => r.includes(s.roleKey));
}

export default function StaffDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openNav, setOpenNav] = useState(null);

  const rolesFromStorage = (() => {
    try {
      const raw = localStorage.getItem("roles");
      if (raw) return JSON.parse(raw);
    } catch (_) { }
    const r = localStorage.getItem("role");
    return r ? [r] : [];
  })();
  const roles = data?.user?.roles ? data.user.roles.map((r) => String(r).toLowerCase().replace(/\s+/g, "_")) : rolesFromStorage.map((r) => String(r).toLowerCase().replace(/\s+/g, "_"));
  const staffNavSections = getStaffNavSections(roles, data);
  useEffect(() => {
    if (data?.user?.roles?.length) {
      const roleNames = data.user.roles.map((r) => String(r).toLowerCase().replace(/\s+/g, "_"));
      localStorage.setItem("roles", JSON.stringify(roleNames));
      const primary = roleNames.includes("super_admin") ? "super_admin" : roleNames.includes("admin") ? "admin" : roleNames[0] || "";
      if (primary) localStorage.setItem("role", primary);
    }
  }, [data?.user?.roles]);

  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = () => {
    if (!token) return Promise.resolve();
    return fetch(`${API_BASE}/api/dashboard/me`, { headers: authHeaders })
      .then((res) => res.json().then((p) => (res.ok ? p : Promise.reject(new Error(p.message || "Failed to load")))))
      .then(setData);
  };

  useEffect(() => {
    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    loadData()
      .catch((err) => setError(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const pathSection = pathSegments[1] || "";
  const pathSub = pathSegments[2] || "";

  // Redirect /dashboard or /dashboard/mentor (no sub) to first available sub
  useEffect(() => {
    if (loading || error || !data) return;
    const path = location.pathname.replace(/\/+$/, "") || "";
    if (path === "/dashboard" && staffNavSections.length > 0) {
      const first = staffNavSections[0];
      if (first.sub?.length) navigate(first.sub[0].path, { replace: true });
      return;
    }
    if (path === "/dashboard/mentor" || path === "/dashboard/warden" || path === "/dashboard/faculty") {
      const section = staffNavSections.find((s) => s.id === pathSection);
      if (section?.sub?.length) navigate(section.sub[0].path, { replace: true });
    }
  }, [loading, error, data, location.pathname, staffNavSections, navigate]);

  const has = (key) => (data?.user?.accesses || []).includes(key);
  const showNav = staffNavSections.length > 0;

  const activeSectionLabel = staffNavSections.find((s) => s.id === pathSection)?.label || pathSection;
  const activeSubLabel = staffNavSections
    .flatMap((s) => s.sub || [])
    .find((sub) => sub.path === location.pathname)?.label || pathSub;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("roles");
    localStorage.removeItem("userName");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="dashboard-layout sa-dashboard-layout" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <h2>Loading your dashboard...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-layout sa-dashboard-layout" style={{ padding: 40 }}>
        <p style={{ color: "#b91c1c" }}>{error || "Failed to load dashboard"}</p>
        <button type="button" className="sa-btn sa-btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-layout sa-dashboard-layout staff-dashboard-layout">
      <header className="top-navbar">
        <div className="top-nav-brand">
          <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PCDP Portal" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          <span>PCDP Portal</span>
        </div>
        <div className="top-nav-profile">
          <img
            src="https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png"
            alt="Profile"
            className="profile-avatar"
          />
          <div className="profile-info">
            <span className="profile-id">Staff</span>
            <span className="profile-name">{data.user.name || data.user.email || "User"}</span>
          </div>
          {/* {(data.user.roles || []).map((r) => (
            <span key={r} className="ud-role-tag" style={{ marginLeft: 4 }}>{r}</span>
          ))} */}
          <button type="button" className="sa-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="sa-body">
        <aside className="sa-sidebar">
          {showNav &&
            staffNavSections.map((section) => {
              const Icon = section.icon;
              const isOpen = openNav === section.id || pathSection === section.id;
              return (
                <div
                  key={section.id}
                  className={`sa-nav-section ${isOpen ? "open" : ""}`}
                >
                  <div
                    className={`sa-nav-main ${isOpen ? "active" : ""}`}
                    onClick={() => setOpenNav(isOpen ? null : section.id)}
                  >
                    <span><Icon size={18} /> {section.label}</span>
                    <ChevronDown size={16} className="sa-chevon" />
                  </div>
                  {isOpen && (
                    <ul className="sa-nav-sub">
                      {(section.sub || []).map((sub) => (
                        <li key={sub.id}>
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) => (isActive ? "active" : "")}
                          >
                            {sub.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </aside>

        <main className="sa-main">
          <div className="dashboard-container-inner">
            <div className="sa-welcome-banner">
              <span className="highlight">Staff Dashboard</span>
              {" — "}
              {showNav ? `${activeSectionLabel} / ${activeSubLabel}` : "Overview"}
            </div>

            {staffNavSections.length === 0 && (
              <p className="ud-empty">No role-specific view available. Ask admin to assign you Mentor, Warden, or Faculty role.</p>
            )}
            {showNav && pathSection === "mentor" && pathSub === "mentees" && <StaffMentorMentees data={data} has={has} />}
            {showNav && pathSection === "mentor" && pathSub === "leave-approvals" && <StaffMentorLeaveApprovals data={data} has={has} onRefresh={loadData} />}
            {showNav && pathSection === "warden" && pathSub === "wards" && <StaffWardenWards data={data} has={has} />}
            {showNav && pathSection === "warden" && pathSub === "biometric" && <StaffWardenBiometric data={data} has={has} />}
            {showNav && pathSection === "warden" && pathSub === "leave-approvals" && <StaffWardenLeaveApprovals data={data} has={has} onRefresh={loadData} />}
            {showNav && pathSection === "faculty" && pathSub === "question-banks" && <FacultyDashboard data={data} has={has} authHeaders={authHeaders} />}
            {showNav && pathSection === "faculty" && pathSub === "code-review" && <StaffFacultyCodeReview />}
            {showNav && pathSection === "faculty" && pathSub === "student-answers" && <StaffFacultyStudentAnswers />}
          </div>
        </main>
      </div>
    </div>
  );
}
