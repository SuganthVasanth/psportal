import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Users, Building2, BookOpen, ChevronDown, UserCircle, CalendarCheck, Home, Fingerprint, FileText, ClipboardList, Code, MessageSquare, Shield, KeyRound, Bus, MapPin, Search, Bell } from "lucide-react";
import "./SuperAdminDashboard.css";
import "./UserDashboard.css";
import "../components/SidebarPremium.css";
import SmartSidebar from "../components/SmartSidebar";
import StaffMentorMentees from "./StaffMentorMentees";
import StaffMentorLeaveApprovals from "./StaffMentorLeaveApprovals";
import StaffWardenWards from "./StaffWardenWards";
import StaffWardenBiometric from "./StaffWardenBiometric";
import StaffHostelManagerWardens from "./staff/StaffHostelManagerWardens";
import StaffSecurityLeaves from "./staff/StaffSecurityLeaves";
import StaffSecurityBiometric from "./staff/StaffSecurityBiometric";
import StaffWardenLeaveApprovals from "./staff/StaffWardenLeaveApprovals";
import BusIncharge from "./staff/BusIncharge";
import CreateClassroomTask from "./staff/CreateClassroomTask";
import FacultyDashboard from "./FacultyDashboard";
import StaffFacultyCodeReview from "./StaffFacultyCodeReview";
import StaffFacultyStudentAnswers from "./StaffFacultyStudentAnswers";

const API_BASE = "http://localhost:5000";

const STAFF_NAV = [
  {
    id: "mentor",
    label: "Mentor",
    icon: UserCircle,
    roleKey: "mentor",
    sub: [
      { id: "mentees", label: "My mentees", path: "/dashboard/mentor/mentees", icon: Users },
      { id: "leave-approvals", label: "Student Leaves", path: "/dashboard/mentor/leave-approvals", icon: CalendarCheck },
    ],
  },
  {
    id: "warden",
    label: "Warden",
    icon: Building2,
    roleKey: "warden",
    sub: [
      { id: "wards", label: "My wards", path: "/dashboard/warden/wards", icon: Home },
      { id: "biometric", label: "Biometric details", path: "/dashboard/warden/biometric", icon: Fingerprint },
      { id: "leave-approvals", label: "Warden Leaves", path: "/dashboard/warden/leave-approvals", icon: FileText },
    ],
  },
  {
    id: "faculty",
    label: "Technical faculty",
    icon: BookOpen,
    roleKey: "technical_faculty",
    sub: [
      { id: "question-banks", label: "Questions uploading", path: "/dashboard/faculty/question-banks", icon: ClipboardList },
      { id: "classroom-tasks", label: "Create Classroom Task", path: "/dashboard/faculty/classroom-tasks", icon: CalendarCheck },
      { id: "code-review", label: "Code review", path: "/dashboard/faculty/code-review", icon: Code },
      { id: "student-answers", label: "Student's answers", path: "/dashboard/faculty/student-answers", icon: MessageSquare },
    ],
  },
  {
    id: "hostel-manager",
    label: "Hostel manager",
    icon: Building2,
    roleKey: "hostel_manager",
    sub: [
      { id: "wardens", label: "Wardens & wards", path: "/dashboard/hostel-manager/wardens", icon: Home },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    roleKey: "security",
    sub: [
      { id: "leaves", label: "Approved leaves", path: "/dashboard/security/leaves", icon: FileText },
      { id: "biometric", label: "Biometric log", path: "/dashboard/security/biometric", icon: Fingerprint },
    ],
  },
  {
    id: "bus-incharge",
    label: "Bus Incharge",
    icon: Bus,
    roleKey: "bus_incharge",
    sub: [{ id: "tracking", label: "Live tracking", path: "/dashboard/bus-incharge/tracking", icon: MapPin }],
  },
];

function getStaffNavSections(roles) {
  const r = (roles || []).map((x) => String(x).toLowerCase().replace(/\s+/g, "_"));
  return STAFF_NAV.filter((s) => r.includes(s.roleKey));
}

export default function StaffDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openNav, setOpenNav] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const rolesFromStorage = (() => {
    try {
      const raw = localStorage.getItem("roles");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const r = localStorage.getItem("role");
    return r ? [r] : [];
  })();
  const roles = data?.user?.roles ? data.user.roles.map((r) => String(r).toLowerCase().replace(/\s+/g, "_")) : rolesFromStorage.map((r) => String(r).toLowerCase().replace(/\s+/g, "_"));
  const staffNavSections = getStaffNavSections(roles);
  const navItems = useMemo(
    () => staffNavSections.flatMap((section) => (section.sub || []).map((sub) => ({ ...sub, sectionId: section.id }))),
    [staffNavSections]
  );
  useEffect(() => {
    if (data?.user?.roles?.length) {
      const roleNames = data.user.roles.map((r) => String(r).toLowerCase().replace(/\s+/g, "_"));
      localStorage.setItem("roles", JSON.stringify(roleNames));
      const primary = roleNames.includes("super_admin") ? "super_admin" : roleNames.includes("admin") ? "admin" : roleNames[0] || "";
      if (primary) localStorage.setItem("role", primary);
    }
  }, [data?.user?.roles]);

  useEffect(() => {
    const uid = data?.user?.id;
    if (uid) localStorage.setItem("userId", uid);
  }, [data?.user?.id]);

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
  const securitySelectedRegisterNo =
    pathSection === "security" && pathSub === "leaves" && pathSegments[3] ? decodeURIComponent(pathSegments[3]) : "";

  // Redirect /dashboard or /dashboard/mentor (no sub) to first available sub
  useEffect(() => {
    if (loading || error || !data) return;
    const path = location.pathname.replace(/\/+$/, "") || "";
    if (path === "/dashboard" && staffNavSections.length > 0) {
      const first = staffNavSections.find((s) => s.id === "bus-incharge") || staffNavSections[0];
      if (first.sub?.length) navigate(first.sub[0].path, { replace: true });
      return;
    }
    if (
      path === "/dashboard/mentor" ||
      path === "/dashboard/warden" ||
      path === "/dashboard/faculty" ||
      path === "/dashboard/bus-incharge"
    ) {
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

  const userName = data?.user?.name || data?.user?.email || "User";
  const userAvatar = userName.split(' ').map(n => n[0]).join('');

  if (loading) {
    return (
      <div className="dashboard-layout premium-layout" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <h2>Loading your dashboard...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-layout premium-layout" style={{ padding: 40 }}>
        <p style={{ color: "#b91c1c" }}>{error || "Failed to load dashboard"}</p>
        <button type="button" className="portal-btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-layout premium-layout staff-dashboard-layout">
      <SmartSidebar
        sections={staffNavSections.map((section) => ({
          title: section.label,
          items: (section.sub || []).map((sub) => ({
            id: sub.id,
            label: sub.label,
            path: sub.path,
            icon: sub.icon,
          })),
        }))}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        profileName={userName}
        profileRole="Staff"
        onLogout={handleLogout}
      />

      <div className={`main-container-premium ${collapsed ? "sidebar-collapsed" : ""}`}>
        <header className="top-navbar-premium">
          <div className="search-bar-premium">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search for courses, mentees, etc." />
          </div>

          <div className="top-nav-actions-premium">
            <button className="nav-btn-premium" title="Notifications">
              <Bell size={20} />
              <span className="badge-premium"></span>
            </button>
            <div className="header-profile-premium">
              <div className="avatar-minimal-premium">
                {userAvatar}
              </div>
            </div>
          </div>
        </header>

        <main className="content-area-premium">
          <div className="dashboard-container-inner" style={{ padding: '24px' }}>
            {staffNavSections.length === 0 && (
              <p className="ud-empty">No role-specific view available. Ask admin to assign you Mentor, Warden, Hostel manager, Security or Faculty role.</p>
            )}
            <div className="sa-welcome-banner" style={{ marginBottom: '24px' }}>
              <span className="highlight">Staff Dashboard</span>
              {" — "}
              {showNav ? `${activeSectionLabel} / ${activeSubLabel}` : "Overview"}
            </div>
            {showNav && pathSection === "mentor" && pathSub === "mentees" && <StaffMentorMentees data={data} has={has} />}
            {showNav && pathSection === "mentor" && pathSub === "leave-approvals" && <StaffMentorLeaveApprovals data={data} has={has} onRefresh={loadData} />}
            {showNav && pathSection === "warden" && pathSub === "wards" && <StaffWardenWards data={data} has={has} />}
            {showNav && pathSection === "warden" && pathSub === "biometric" && <StaffWardenBiometric data={data} has={has} />}
            {showNav && pathSection === "warden" && pathSub === "leave-approvals" && <StaffWardenLeaveApprovals data={data} has={has} onRefresh={loadData} />}
            {showNav && pathSection === "faculty" && pathSub === "question-banks" && <FacultyDashboard data={data} has={has} authHeaders={authHeaders} />}
            {showNav && pathSection === "faculty" && pathSub === "classroom-tasks" && <CreateClassroomTask />}
            {showNav && pathSection === "faculty" && pathSub === "code-review" && <StaffFacultyCodeReview />}
            {showNav && pathSection === "faculty" && pathSub === "student-answers" && <StaffFacultyStudentAnswers />}
            {showNav && pathSection === "hostel-manager" && pathSub === "wardens" && <StaffHostelManagerWardens data={data} />}
            {showNav && pathSection === "security" && pathSub === "leaves" && (
              <StaffSecurityLeaves data={data} selectedRegisterNo={securitySelectedRegisterNo} />
            )}
            {showNav && pathSection === "security" && pathSub === "biometric" && <StaffSecurityBiometric data={data} />}
            {showNav && pathSection === "bus-incharge" && pathSub === "tracking" && <BusIncharge />}
          </div>
        </main>
      </div>
    </div>
  );
}
