import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Shield,
  BookOpen,
  Calendar,
  FileText,
  Code,
  BarChart3,
  Plus,
  Pencil,
  X,
  LogOut,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "./SuperAdminDashboard.css";
import ChatModal from "../components/ChatModal";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const API_BASE = "http://localhost:5000";

const NAV = [
  {
    id: "rbac",
    label: "RBAC",
    icon: Shield,
    sub: [
      { id: "roles", label: "Roles" },
      { id: "users-list", label: " users" },
      { id: "create-user", label: "Create new users" },
    ],
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    sub: [
      { id: "course-upload", label: "Create" },
      { id: "course-points", label: "Details" },
      { id: "question-banks", label: "Question banks" },
    ],
  },
  {
    id: "slots",
    label: "Slots",
    icon: Calendar,
    sub: [
      { id: "venue", label: "Venue" },
      { id: "time", label: "Time" },
      { id: "slots-list", label: "Slots (venue, time)" },
    ],
  },
  {
    id: "leave",
    label: "Leaves",
    icon: FileText,
    sub: [
      { id: "leave-flow", label: "Leave Flow" },
      { id: "all-leave-types", label: "All Leave Types" },
    ],
  },
  {
    id: "code-review",
    label: "Code review",
    icon: Code,
    sub: [
      { id: "code-access", label: "Assign Faculty" },
      { id: "code-students", label: "Students Applied" },
    ],
  },
  {
    id: "stats",
    label: "Reports",
    icon: BarChart3,
    sub: [
      { id: "stats-course", label: "Students applied per course (year, dept)" },
      { id: "stats-slot", label: "Slot used most often" },
      { id: "stats-weekly", label: "Weekly clearing %" },
      { id: "stats-registered", label: "Course registered/attended most, least, avg" },
    ],
  },
];

// Role access options: admin selects what each role can see/do in the user dashboard
const ACCESS_OPTIONS = [
  { id: "mentees.view", label: "List of mentees", group: "Mentor" },
  { id: "mentees.courses", label: "Mentees' completed & ongoing courses", group: "Mentor" },
  { id: "mentees.reward_points", label: "Mentees' reward points", group: "Mentor" },
  { id: "mentees.activity_points", label: "Mentees' activity points", group: "Mentor" },
  { id: "mentees.leave_approve", label: "Leave approvals (mentor)", group: "Mentor" },
  { id: "mentees.attendance", label: "Mentees' attendance %", group: "Mentor" },
  { id: "ward_students.view", label: "Students in their wards", group: "Warden" },
  { id: "ward_students.room", label: "Room numbers", group: "Warden" },
  { id: "ward_students.biometric", label: "Biometric details", group: "Warden" },
  { id: "ward_students.leave_approve", label: "Leave approvals (warden)", group: "Warden" },
  { id: "faculty.courses_assigned", label: "Assigned courses (admin assigns)", group: "Technical faculty" },
  { id: "faculty.question_bank", label: "Submit question banks to admin", group: "Technical faculty" },
  { id: "faculty.student_answers", label: "View student answers (if granted)", group: "Technical faculty" },
  { id: "faculty.answer_key", label: "View answer key (if granted)", group: "Technical faculty" },
];

// Known roles use fixed colors; any other role gets a stable color from the palette (hash of name)
const ROLE_TAG_STYLES = {
  student: { backgroundColor: "#e0f2fe", color: "#0369a1" },
  mentor: { backgroundColor: "#d1fae5", color: "#047857" },
  warden: { backgroundColor: "#fef3c7", color: "#b45309" },
  "hostel manager": { backgroundColor: "#e0e7ff", color: "#3730a3" },
  admin: { backgroundColor: "#cffafe", color: "#0e7490" },
  super_admin: { backgroundColor: "#e2e8f0", color: "#334155" },
  parents: { backgroundColor: "#fce7f3", color: "#9d174d" },
};
const ROLE_TAG_PALETTE = [
  { backgroundColor: "#f1f5f9", color: "#475569" },
  { backgroundColor: "#ede9fe", color: "#5b21b6" },
  { backgroundColor: "#ffedd5", color: "#c2410c" },
  { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  { backgroundColor: "#ccfbf1", color: "#0f766e" },
  { backgroundColor: "#fef9c3", color: "#a16207" },
  { backgroundColor: "#f3e8ff", color: "#7c3aed" },
  { backgroundColor: "#fed7aa", color: "#ea580c" },
  { backgroundColor: "#e0e7ff", color: "#4338ca" },
  { backgroundColor: "#d1fae5", color: "#059669" },
  { backgroundColor: "#fecdd3", color: "#be123c" },
  { backgroundColor: "#e0f2fe", color: "#0284c7" },
  { backgroundColor: "#fae8ff", color: "#a21caf" },
  { backgroundColor: "#fef3c7", color: "#d97706" },
  { backgroundColor: "#c7d2fe", color: "#3730a3" },
  { backgroundColor: "#a7f3d0", color: "#047857" },
  { backgroundColor: "#fbcfe8", color: "#9d174d" },
  { backgroundColor: "#bae6fd", color: "#0369a1" },
  { backgroundColor: "#ddd6fe", color: "#5b21b6" },
];

function hashRole(s) {
  let h = 0;
  const str = (s || "").toString().toLowerCase();
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getRoleTagStyle(role) {
  const r = (role || "").toLowerCase().trim();
  if (ROLE_TAG_STYLES[r]) return ROLE_TAG_STYLES[r];
  return ROLE_TAG_PALETTE[hashRole(role) % ROLE_TAG_PALETTE.length];
}

const emptyLists = {
  roles: [],
  users: [],
  courses: [],
  venues: [],
  timeSlots: [],
  slots: [],
  leaveTypes: [],
  leaveWorkflows: [],
};

export default function AdminDashboard() {
  const [openNav, setOpenNav] = useState("rbac");
  const [activeSub, setActiveSub] = useState("roles");
  const [rolesList, setRolesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [venuesList, setVenuesList] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [leaveTypesList, setLeaveTypesList] = useState([]);
  const [leaveWorkflowList, setLeaveWorkflowList] = useState([]);
  const [leaveApprovalSteps, setLeaveApprovalSteps] = useState("mentor, warden, hostel_manager");
  const [leaveFlowSelectedType, setLeaveFlowSelectedType] = useState("");
  const [leaveFlowSteps, setLeaveFlowSteps] = useState([""]);
  const [createUserForm, setCreateUserForm] = useState({ email: "", name: "", roles: [] });
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [facultyAssignUserId, setFacultyAssignUserId] = useState("");
  const [facultyAssignCourseId, setFacultyAssignCourseId] = useState("");
  const [questionBankSubmissions, setQuestionBankSubmissions] = useState([]);
  const [questionBankFilterCourse, setQuestionBankFilterCourse] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWithUserId, setChatWithUserId] = useState(null);
  const [chatWithUserName, setChatWithUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editModal, setEditModal] = useState({
    open: false,
    section: "",
    itemId: null,
    item: {},
  });

  const facultyCandidates = usersList.filter((u) =>
    (u.roles || []).some((r) => r.toLowerCase().includes("faculty") || r.toLowerCase().includes("mentor"))
  );
  const facultyList = facultyCandidates.length ? facultyCandidates : usersList;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [roles, users, courses, venues, timeSlots, slotTemplates, leaveTypes, leaveWorkflows, settings, assignments, qbSubmissions] = await Promise.all([
          fetch(`${API_BASE}/api/superadmin/roles`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/users`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/courses`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/venues`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/time-slots`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/slot-templates`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/leave-types`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/leave-workflows`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/settings`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/faculty-assignments`).then((r) => r.json()).catch(() => []),
          fetch(`${API_BASE}/api/superadmin/question-bank-submissions`).then((r) => r.json()).catch(() => []),
        ]);
        setRolesList(Array.isArray(roles) ? roles : []);
        setUsersList(Array.isArray(users) ? users : []);
        setCoursesList(Array.isArray(courses) ? courses : []);
        setVenuesList(Array.isArray(venues) ? venues : []);
        setTimeSlotsList(Array.isArray(timeSlots) ? timeSlots : []);
        setSlotsList(Array.isArray(slotTemplates) ? slotTemplates : []);
        setLeaveTypesList(Array.isArray(leaveTypes) ? leaveTypes : []);
        setLeaveWorkflowList(Array.isArray(leaveWorkflows) ? leaveWorkflows : []);
        setFacultyAssignments(Array.isArray(assignments) ? assignments : []);
        setQuestionBankSubmissions(Array.isArray(qbSubmissions) ? qbSubmissions : []);
        if (settings && typeof settings === "object") {
          if (settings.leaveApprovalSteps != null) setLeaveApprovalSteps(settings.leaveApprovalSteps);
        }
      } catch (err) {
        setLoadError(err.message || "Failed to load dashboard data. Run backend and seed: node scripts/seedSuperAdminData.js");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const userRole = localStorage.getItem("role") || "admin";
  const userName = localStorage.getItem("userName") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const openEdit = (section, item) => {
    setEditModal({ open: true, section, itemId: item.id, item: { ...item } });
  };
  const openAdd = (section, defaultItem) => {
    setEditModal({ open: true, section, itemId: null, item: defaultItem });
  };
  const closeEdit = () => setEditModal({ open: false, section: "", itemId: null, item: {} });
  const setEditField = (key, value) => {
    setEditModal((prev) => ({ ...prev, item: { ...prev.item, [key]: value } }));
  };
  const setEditFieldRoles = (roles) => {
    setEditModal((prev) => ({ ...prev, item: { ...prev.item, roles } }));
  };

  const saveEdit = async () => {
    const { section, itemId, item } = editModal;
    const base = `${API_BASE}/api/superadmin`;
    try {
      if (section === "roles") {
        const url = itemId ? `${base}/roles/${itemId}` : `${base}/roles`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: item.role, description: item.description, accesses: item.accesses }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save role");
        if (itemId) setRolesList((prev) => prev.map((r) => (r.id === itemId ? data : r)));
        else setRolesList((prev) => [...prev, data]);
      } else if (section === "users") {
        const url = itemId ? `${base}/users/${itemId}` : `${base}/users`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: item.email, name: item.name, roles: item.roles || [] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save user");
        if (itemId) setUsersList((prev) => prev.map((u) => (u.id === itemId ? data : u)));
        else setUsersList((prev) => [...prev, data]);
      } else if (section === "courses") {
        const url = itemId ? `${base}/courses/${itemId}` : `${base}/courses`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            description: item.description || "",
            status: item.status,
            type: item.type || "",
            course_logo: item.course_logo || "",
            level: item.level || "",
            activityPoints: Number(item.activityPoints || 0),
            rewardPoints: Number(item.rewardPoints || 0),
            faculty: item.faculty || "",
            prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
            levels: Array.isArray(item.levels) ? item.levels : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save course");
        if (itemId) setCoursesList((prev) => prev.map((c) => (c.id === itemId ? data : c)));
        else setCoursesList((prev) => [...prev, data]);
      } else if (section === "venues") {
        const url = itemId ? `${base}/venues/${itemId}` : `${base}/venues`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: item.name, location: item.location }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save venue");
        if (itemId) setVenuesList((prev) => prev.map((v) => (v.id === itemId ? data : v)));
        else setVenuesList((prev) => [...prev, data]);
      } else if (section === "time") {
        const url = itemId ? `${base}/time-slots/${itemId}` : `${base}/time-slots`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startTime: item.startTime, endTime: item.endTime }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save time slot");
        if (itemId) setTimeSlotsList((prev) => prev.map((t) => (t.id === itemId ? data : t)));
        else setTimeSlotsList((prev) => [...prev, data]);
      } else if (section === "slots") {
        const url = itemId ? `${base}/slot-templates/${itemId}` : `${base}/slot-templates`;
        const status = (item.status === "Inactive" ? "Inactive" : "Active");
        const body = { venue_id: item.venueId, time_slot_id: item.timeId, status };
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save slot");
        if (itemId) setSlotsList((prev) => prev.map((s) => (s.id === itemId ? data : s)));
        else setSlotsList((prev) => [...prev, data]);
      } else if (section === "leave-types") {
        const url = itemId ? `${base}/leave-types/${itemId}` : `${base}/leave-types`;
        const status = item.status === "Inactive" ? "Inactive" : "Active";
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: item.type, code: item.code, status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save leave type");
        if (itemId) setLeaveTypesList((prev) => prev.map((l) => (l.id === itemId ? data : l)));
        else setLeaveTypesList((prev) => [...prev, data]);

        // Also save/update workflow for this leave type if provided
        const wfStr = (item.workflow || "").trim();
        if (wfStr) {
          const existing = leaveWorkflowList.find((w) => w.leaveType === data.type);
          const wfUrl = existing ? `${base}/leave-workflows/${existing.id}` : `${base}/leave-workflows`;
          const resWf = await fetch(wfUrl, {
            method: existing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leaveType: data.type, workflow: wfStr }),
          });
          const wfData = await resWf.json();
          if (!resWf.ok) throw new Error(wfData.message || "Failed to save workflow");
          if (existing) setLeaveWorkflowList((prev) => prev.map((w) => (w.id === existing.id ? wfData : w)));
          else setLeaveWorkflowList((prev) => [...prev, wfData]);
        }
      } else if (section === "leave-workflow") {
        const url = itemId ? `${base}/leave-workflows/${itemId}` : `${base}/leave-workflows`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaveType: item.leaveType, workflow: item.workflow }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save workflow");
        if (itemId) setLeaveWorkflowList((prev) => prev.map((w) => (w.id === itemId ? data : w)));
        else setLeaveWorkflowList((prev) => [...prev, data]);
      }
      closeEdit();
    } catch (err) {
      alert(err.message || "Save failed");
    }
  };

  const deleteItem = (section, itemId) => {
    if (!window.confirm("Remove this item?")) return;
    if (section === "roles") setRolesList((prev) => prev.filter((r) => r.id !== itemId));
    else if (section === "users") setUsersList((prev) => prev.filter((u) => u.id !== itemId));
    else if (section === "courses") setCoursesList((prev) => prev.filter((c) => c.id !== itemId));
    else if (section === "venues") setVenuesList((prev) => prev.filter((v) => v.id !== itemId));
    else if (section === "time") setTimeSlotsList((prev) => prev.filter((t) => t.id !== itemId));
    else if (section === "slots") setSlotsList((prev) => prev.filter((s) => s.id !== itemId));
    else if (section === "leave-types") setLeaveTypesList((prev) => prev.filter((l) => l.id !== itemId));
    else if (section === "leave-workflow") setLeaveWorkflowList((prev) => prev.filter((w) => w.id !== itemId));
    closeEdit();
  };

  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = String(t).split(":");
    const hh = parseInt(h, 10);
    const am = hh < 12;
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return `${h12}:${m || "00"} ${am ? "AM" : "PM"}`;
  };

  const statsCourseChart = useMemo(() => {
    const labels = coursesList.length ? coursesList.map((c) => c.name) : ["PS Activity 101", "Advanced PS"];
    const counts = coursesList.length ? [320, 280, 150].slice(0, labels.length) : [320, 280, 150];
    return {
      labels,
      datasets: [{ label: "Applications", data: counts, backgroundColor: ["#8b5cf6", "#06b6d4", "#10b981"] }],
    };
  }, [coursesList]);
  const statsSlotChart = useMemo(() => {
    const labels = slotsList.length ? slotsList.map((s) => `${s.venueLabel} (${s.timeLabel})`) : ["Hall A (09:00–10:30)", "Lab 2 (14:00–15:30)", "Hall B (11:00–12:30)"];
    const bookings = slotsList.length ? [450, 320, 280].slice(0, labels.length) : [450, 320, 280];
    return {
      labels,
      datasets: [{ label: "Bookings", data: bookings, backgroundColor: ["#8b5cf6", "#06b6d4", "#10b981"] }],
    };
  }, [slotsList]);
  const statsWeeklyChart = useMemo(() => ({
    labels: ["Week 1 (Feb 17-23)", "Week 2 (Feb 24-Mar 2)", "Week 3 (Mar 3-9)"],
    datasets: [
      { label: "Cleared %", data: [85, 92, 78], borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", tension: 0.3 },
    ],
  }), []);
  const statsRegisteredChart = useMemo(() => ({
    labels: ["PS Activity 101", "Advanced PS", "Elective X"],
    datasets: [
      { label: "Registered", data: [600, 200, 50], backgroundColor: "rgba(139,92,246,0.6)", stack: "stack1" },
      { label: "Attended", data: [580, 195, 42], backgroundColor: "rgba(6,182,212,0.6)", stack: "stack1" },
    ],
  }), []);
  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" }, title: { display: !!title, text: title } },
  });

  return (
    <div className="dashboard-layout sa-dashboard-layout">
      <header className="top-navbar">
        <div className="top-nav-brand">
          <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          <span>PCDP Portal</span>
        </div>
        <div className="top-nav-profile">
          <img
            src={`https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png`}
            alt="Profile"
            className="profile-avatar"
          />
          <div className="profile-info">
            <span className="profile-id">Admin</span>
            <span className="profile-name">{userName}</span>
          </div>
          <button type="button" className="sa-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="sa-body">
        <aside className="sa-sidebar">
          {NAV.map((section) => {
            const isOpen = openNav === section.id;
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className={`sa-nav-section ${isOpen ? "open" : ""}`}
              >
                <div
                  className={`sa-nav-main ${isOpen ? "active" : ""}`}
                  onClick={() => setOpenNav(isOpen ? "" : section.id)}
                >
                  <span><Icon size={18} /> {section.label}</span>
                  <ChevronDown size={16} className="sa-chevon" />
                </div>
                {isOpen && (
                  <ul className="sa-nav-sub">
                    {section.sub.map((sub) => (
                      <li key={sub.id}>
                        <a
                          href="#"
                          className={activeSub === sub.id ? "active" : ""}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveSub(sub.id);
                          }}
                        >
                          {sub.label}
                        </a>
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
              <span className="highlight">Admin Dashboard</span>
              {" — "}
              {NAV.flatMap((s) => s.sub).find((s) => s.id === activeSub)?.label || "Overview"}
            </div>

          {loading && <div className="sa-loading">Loading dashboard data…</div>}
          {loadError && <div className="sa-error">{loadError}</div>}

          {!loading && !loadError && <>
          {/* Nav 1: Role based access */}
          {activeSub === "roles" && (
            <>
              <div className="dashboard-card">
                <h3 className="card-title">Roles – create new and assign accesses</h3>
                <p className="card-subtitle">Manage system roles and their permissions.</p>
                <button type="button" className="sa-btn sa-btn-primary" onClick={() => openAdd("roles", { role: "", description: "", accesses: "" })}><Plus size={16} /> Create new role</button>
                <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Description</th>
                      <th>Accesses</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolesList.map((row) => (
                      <tr key={row.id}>
                        <td>{row.role}</td>
                        <td>{row.description}</td>
                        <td>{row.accesses}</td>
                        <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("roles", row)} title="Edit"><Pencil size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSub === "users-list" && (
            <div className="dashboard-card">
              <h3 className="card-title">List of users and their roles</h3>
              <p className="card-subtitle">View and edit user role assignments.</p>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Roles</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.email}</td>
                      <td>{row.name}</td>
                      <td><span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{row.roles?.map((r) => <span key={r} className="sa-tag" style={getRoleTagStyle(r)}>{r}</span>)}</span></td>
                      <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("users", row)}><Pencil size={14} /> Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "create-user" && (
            <div className="dashboard-card">
              <h3 className="card-title">Create new users</h3>
              <p className="card-subtitle">Add user with email and assign one or more roles (colour tagged).</p>
              <div className="sa-form-group">
                <label>Email</label>
                <input type="email" placeholder="user@example.com" value={createUserForm.email} onChange={(e) => setCreateUserForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="sa-form-group">
                <label>Name</label>
                <input type="text" placeholder="Full name" value={createUserForm.name} onChange={(e) => setCreateUserForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="sa-form-group">
                <label>Assign roles (pastel colour tagged)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {rolesList.map((r) => {
                    const roleName = r.role;
                    const checked = createUserForm.roles.includes(roleName);
                    return (
                      <label key={r.id || roleName} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setCreateUserForm((p) => ({ ...p, roles: e.target.checked ? [...p.roles, roleName] : p.roles.filter((x) => x !== roleName) }))}
                        />
                        <span className="sa-tag" style={getRoleTagStyle(roleName)}>{roleName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                onClick={async () => {
                  if (!createUserForm.email?.trim()) return;
                  try {
                    const res = await fetch(`${API_BASE}/api/superadmin/users`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: createUserForm.email.trim(),
                        name: createUserForm.name.trim() || "",
                        roles: createUserForm.roles,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Failed to create user");
                    setUsersList((prev) => [...prev, data]);
                    setCreateUserForm({ email: "", name: "", roles: [] });
                  } catch (e) {
                    alert(e.message || "Create failed");
                  }
                }}
              >
                <Plus size={16} /> Create user
              </button>
            </div>
          )}

          {/* Nav 2: Courses */}
          {activeSub === "course-upload" && (
            <div className="dashboard-card">
              <h3 className="card-title">Uploading / creating course</h3>
              <p className="card-subtitle">Add new courses and edit existing ones.</p>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                style={{ marginBottom: 16 }}
                onClick={() =>
                  openAdd("courses", {
                    name: "",
                    type: "",
                    course_logo: "",
                    level: "",
                    status: "Active",
                    activityPoints: 0,
                    rewardPoints: 0,
                    faculty: "",
                    prerequisites: [],
                    levels: [],
                  })
                }
              >
                <Plus size={16} /> Add new course
              </button>
              <table className="sa-table">
                <thead>
                  <tr><th>Course name</th><th>Type</th><th>Level</th><th>Course logo</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {coursesList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.type || "—"}</td>
                      <td>{row.level || "—"}</td>
                      <td className="sa-course-logo-cell">
                        {row.course_logo ? (
                          <>
                            <img src={row.course_logo} alt="" className="sa-course-logo-thumb" onError={(e) => { e.target.style.display = "none"; e.target.nextSibling?.classList.remove("sa-hide"); }} />
                            <span className="sa-muted sa-hide">—</span>
                          </>
                        ) : (
                          <span className="sa-muted">—</span>
                        )}
                      </td>
                      <td><span className={`sa-badge ${row.status === "Active" ? "sa-badge-success" : "sa-badge-warning"}`}>{row.status}</span></td>
                      <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("courses", row)}><Pencil size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "course-points" && (
            <div className="dashboard-card">
              <h3 className="card-title">Course details</h3>
              <p className="card-subtitle">Configure levels, activity points, reward points, faculty, and prerequisites per course. Click a row to edit.</p>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Course name</th>
                    <th>Level</th>
                    <th>Activity points</th>
                    <th>Reward points</th>
                    <th>Faculty</th>
                    <th>Prerequisites</th>
                    <th>Levels</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesList.map((row) => {
                    const facultyUser = facultyList.find((u) => u.id === row.faculty);
                    const levels = Array.isArray(row.levels) ? row.levels : [];
                    const prereqNames = Array.isArray(row.prerequisites)
                      ? row.prerequisites.map((id) => coursesList.find((c) => c.id === id)?.name).filter(Boolean)
                      : [];
                    const expanded = row._levelsExpanded;
                    return (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td><strong>{row.name}</strong></td>
                          <td>{row.level || "—"}</td>
                          <td>{row.activityPoints ?? 0}</td>
                          <td>{row.rewardPoints ?? 0}</td>
                          <td>{facultyUser ? facultyUser.name || facultyUser.email : "—"}</td>
                          <td>{prereqNames.length ? prereqNames.join(", ") : "—"}</td>
                          <td>
                            {levels.length > 0 ? (
                              <button
                                type="button"
                                className="sa-details-levels-toggle"
                                onClick={() => {
                                  setCoursesList((prev) => prev.map((c) => c.id === row.id ? { ...c, _levelsExpanded: !c._levelsExpanded } : { ...c, _levelsExpanded: false }));
                                }}
                              >
                                {expanded ? "Hide" : "View"} {levels.length} level{levels.length !== 1 ? "s" : ""}
                                <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
                              </button>
                            ) : (
                              <span className="sa-muted">—</span>
                            )}
                          </td>
                          <td>
                            <button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("courses", row)}>
                              <Pencil size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                        {levels.length > 0 && expanded && (
                          <tr>
                            <td colSpan={8} style={{ padding: "0 12px 12px 12px", verticalAlign: "top" }}>
                              <div className="sa-details-levels-body">
                                {levels.map((lev, idx) => {
                                  const prereqIndices = Array.isArray(lev.prerequisiteLevelIndices) ? lev.prerequisiteLevelIndices : (lev.prerequisiteLevelIndex != null && lev.prerequisiteLevelIndex >= 0 ? [lev.prerequisiteLevelIndex] : []);
                                  const prereqText = prereqIndices.length === 0 ? "No" : prereqIndices.map((i) => `Level ${i + 1}`).join(", ");
                                  return (
                                    <div key={idx} className="sa-details-level-card">
                                      <div className="sa-details-level-info">
                                        <h4>{idx + 1}. {lev.name || `Level ${idx}`}</h4>
                                        <div className="sa-details-level-meta">
                                          {Array.isArray(lev.topics) && lev.topics.length ? lev.topics.join(" · ") : "No topics"}
                                        </div>
                                      </div>
                                      <div className="sa-details-level-meta" style={{ textAlign: "right" }}>
                                        <div><strong>{lev.rewardPoints ?? 0} pts</strong></div>
                                        <div>Prereq: {prereqText}</div>
                                        <div>{lev.assessmentType || "MCQ"}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "question-banks" && (
            <div className="dashboard-card">
              <h3 className="card-title">Question bank submissions</h3>
              <p className="card-subtitle">Review and approve or reject question banks submitted by faculty for each course.</p>
              <div className="sa-form-group" style={{ marginBottom: 16, maxWidth: 280 }}>
                <label>Filter by course</label>
                <select value={questionBankFilterCourse} onChange={(e) => setQuestionBankFilterCourse(e.target.value)}>
                  <option value="">All courses</option>
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Faculty</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionBankSubmissions
                      .filter((s) => !questionBankFilterCourse || s.course_id === questionBankFilterCourse)
                      .map((s) => (
                        <tr key={s.id}>
                          <td>{s.course_name}</td>
                          <td>{s.faculty_name || s.faculty_email}</td>
                          <td>{s.title || "—"}</td>
                          <td>
                            <span className={`sa-badge ${s.status === "approved" ? "sa-badge-success" : s.status === "rejected" ? "sa-badge-danger" : "sa-badge-warning"}`}>
                              {s.status === "approved" ? "Approved" : s.status === "rejected" ? "Rejected" : "Pending"}
                            </span>
                          </td>
                          <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}</td>
                          <td>
                            {s.status === "submitted" || s.status === "draft" ? (
                              <>
                                <button
                                  type="button"
                                  className="sa-btn sa-btn-sm"
                                  style={{ marginRight: 6 }}
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_BASE}/api/superadmin/question-bank-submissions/${s.id}/review`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "approved" }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.message || "Failed");
                                      setQuestionBankSubmissions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "approved" } : x)));
                                    } catch (e) {
                                      alert(e.message || "Failed to approve");
                                    }
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="sa-btn sa-btn-sm"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_BASE}/api/superadmin/question-bank-submissions/${s.id}/review`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "rejected" }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.message || "Failed");
                                      setQuestionBankSubmissions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "rejected" } : x)));
                                    } catch (e) {
                                      alert(e.message || "Failed to reject");
                                    }
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="sa-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {questionBankSubmissions.filter((s) => !questionBankFilterCourse || s.course_id === questionBankFilterCourse).length === 0 && (
                <p className="sa-muted">No question bank submissions yet. Faculty will see tasks on their dashboard and submit here for your approval.</p>
              )}
            </div>
          )}

          {/* Nav 3: Slots */}
          {activeSub === "venue" && (
            <div className="dashboard-card">
              <h3 className="card-title">Venue</h3>
              <p className="card-subtitle">Manage venues for slots.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }} onClick={() => openAdd("venues", { name: "", location: "" })}><Plus size={16} /> Add venue</button>
              <table className="sa-table">
                <thead><tr><th>Venue name</th><th>Location</th><th>Actions</th></tr></thead>
                <tbody>
                  {venuesList.map((row) => (
                    <tr key={row.id}><td>{row.name}</td><td>{row.location}</td><td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("venues", row)}><Pencil size={14} /></button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "time" && (
            <div className="dashboard-card">
              <h3 className="card-title">Time</h3>
              <p className="card-subtitle">Manage time slots.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }} onClick={() => openAdd("time", { startTime: "09:00", endTime: "10:30" })}><Plus size={16} /> Add time slot</button>
              <table className="sa-table">
                <thead><tr><th>Start time</th><th>End time</th><th>Actions</th></tr></thead>
                <tbody>
                  {timeSlotsList.map((row) => (
                    <tr key={row.id}>
                      <td>{formatTime(row.startTime)}</td>
                      <td>{formatTime(row.endTime)}</td>
                      <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("time", row)}><Pencil size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "slots-list" && (
            <div className="dashboard-card">
              <h3 className="card-title">Slots (venue, time)</h3>
              <p className="card-subtitle">Edit and add new slots.</p>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                style={{ marginBottom: 16 }}
                onClick={() => {
                  const v = venuesList[0];
                  const t = timeSlotsList[0];
                  openAdd("slots", { venueId: v?.id || "", timeId: t?.id || "", venueLabel: v?.name || "", timeLabel: t ? `${formatTime(t.startTime)} – ${formatTime(t.endTime)}` : "", status: "Active" });
                }}
              >
                <Plus size={16} /> New slot
              </button>
              <table className="sa-table">
                <thead><tr><th>Venue</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {slotsList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.venueLabel}</td>
                      <td>{row.timeLabel}</td>
                      <td><span className={`sa-slot-status ${(row.status || "Active").toLowerCase() === "active" ? "sa-slot-active" : "sa-slot-inactive"}`}>{row.status || "Active"}</span></td>
                      <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("slots", { ...row, venueId: row.venueId, timeId: row.timeId, status: row.status || "Active" })}><Pencil size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Leaves: Leave Flow (create new leave types with flow) */}
          {activeSub === "leave-flow" && (
            <div className="dashboard-card">
              <h3 className="card-title">Leave Flow</h3>
              <p className="card-subtitle">Create a leave type and define its approval flow. First approver is always Parents, then choose up to 4 more roles.</p>
              <div className="sa-form-group">
                <label>Leave type</label>
                <input
                  type="text"
                  className="sa-input"
                  placeholder="e.g. Sick Leave"
                  value={leaveFlowSelectedType}
                  onChange={(e) => setLeaveFlowSelectedType(e.target.value)}
                />
              </div>
              <div className="sa-leave-flow-steps">
                <div className="sa-flow-step-row">
                  <span className="sa-flow-step-label">Parents</span>
                  <span className="sa-tag" style={getRoleTagStyle("parents")}>Parents</span>
                </div>
                {leaveFlowSteps.map((role, idx) => (
                  <div key={idx} className="sa-flow-step-row">
                    <span className="sa-flow-step-label">{`Step ${idx + 2}`}</span>
                    <select
                      value={role}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLeaveFlowSteps((prev) => {
                          const next = [...prev];
                          next[idx] = v;
                          return next;
                        });
                      }}
                      className="sa-flow-role-select"
                    >
                      <option value="">Select role...</option>
                      {rolesList
                        .filter((r) => (r.role || "").toLowerCase() !== "student")
                        .map((r) => (
                          <option key={r.id} value={r.role}>{r.role}</option>
                        ))}
                    </select>
                    {role && (
                      <span className="sa-tag" style={getRoleTagStyle(role)}>{role}</span>
                    )}
                    {idx === leaveFlowSteps.length - 1 && idx < 4 && (
                      <button
                        type="button"
                        className="sa-btn sa-btn-icon"
                        title="Add next step"
                        onClick={() => setLeaveFlowSteps((prev) => (prev.length < 5 ? [...prev, ""] : prev))}
                      >
                        <Plus size={18} />
                      </button>
                    )}
                    {leaveFlowSteps.length > 1 && (
                      <button
                        type="button"
                        className="sa-btn sa-btn-icon sa-btn-ghost"
                        title="Remove step"
                        onClick={() => setLeaveFlowSteps((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                style={{ marginTop: 16 }}
                disabled={!leaveFlowSelectedType.trim()}
                onClick={async () => {
                  const typeName = leaveFlowSelectedType.trim();
                  if (!typeName) return;
                  const extraSteps = leaveFlowSteps.filter(Boolean);
                  const steps = ["Parents", ...extraSteps];
                  const workflow = steps.join(", ");
                  try {
                    const base = `${API_BASE}/api/superadmin`;
                    // Ensure LeaveType exists (create if needed)
                    const existingType = leaveTypesList.find((lt) => lt.type === typeName);
                    let typeData = existingType || null;
                    if (existingType) {
                      const status = existingType.status === "Inactive" ? "Inactive" : "Active";
                      const resType = await fetch(`${base}/leave-types/${existingType.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: typeName, code: existingType.code, status }),
                      });
                      const dataType = await resType.json();
                      if (!resType.ok) throw new Error(dataType.message || "Failed to save leave type");
                      typeData = dataType;
                      setLeaveTypesList((prev) => prev.map((l) => (l.id === dataType.id ? dataType : l)));
                    } else {
                      const defaultCode = typeName.split(" ").map((w) => w[0] || "").join("").toUpperCase() || "LV";
                      const resType = await fetch(`${base}/leave-types`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: typeName, code: defaultCode, status: "Active" }),
                      });
                      const dataType = await resType.json();
                      if (!resType.ok) throw new Error(dataType.message || "Failed to create leave type");
                      typeData = dataType;
                      setLeaveTypesList((prev) => [...prev, dataType]);
                    }

                    // Create or update workflow for this leave type
                    const existingWf = leaveWorkflowList.find((w) => w.leaveType === typeName);
                    const url = existingWf ? `${base}/leave-workflows/${existingWf.id}` : `${base}/leave-workflows`;
                    const res = await fetch(url, {
                      method: existingWf ? "PUT" : "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ leaveType: typeName, workflow }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Failed to save leave flow");
                    if (existingWf) setLeaveWorkflowList((prev) => prev.map((w) => (w.id === existingWf.id ? data : w)));
                    else setLeaveWorkflowList((prev) => [...prev, data]);
                    alert("Leave flow saved.");
                  } catch (e) {
                    alert(e.message || "Save failed");
                  }
                }}
              >
                Save flow
              </button>
            </div>
          )}

          {/* Leaves: All Leave Types */}
          {activeSub === "all-leave-types" && (
            <div className="dashboard-card">
              <h3 className="card-title">All Leave Types</h3>
              <p className="card-subtitle">Edit leave types and their status. Use Active/Inactive to enable or disable.</p>
              <table className="sa-table">
                <thead><tr><th>Type</th><th>Code</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaveTypesList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.type}</td>
                      <td>{row.code}</td>
                      <td>
                        <span className={`sa-badge ${(row.status || "Active") === "Active" ? "sa-badge-success" : "sa-badge-warning"}`}>
                          {row.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() => {
                            const wf = leaveWorkflowList.find((w) => w.leaveType === row.type);
                            openEdit("leave-types", { ...row, status: row.status || "Active", workflow: wf?.workflow || "" });
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "code-access" && (
            <div className="dashboard-card">
              <h3 className="card-title">Assign courses to faculty</h3>
              <p className="card-subtitle">Assign courses to technical faculty so they appear in their user dashboard and can submit question banks.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
                <div className="sa-form-group" style={{ minWidth: 200 }}>
                  <label>User (faculty)</label>
                  <select value={facultyAssignUserId} onChange={(e) => setFacultyAssignUserId(e.target.value)}>
                    <option value="">Select user</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email} {u.roles?.length ? `(${u.roles.join(", ")})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="sa-form-group" style={{ minWidth: 200 }}>
                  <label>Course</label>
                  <select value={facultyAssignCourseId} onChange={(e) => setFacultyAssignCourseId(e.target.value)}>
                    <option value="">Select course</option>
                    {coursesList.filter((c) => c.status === "Active").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sa-form-group" style={{ alignSelf: "flex-end" }}>
                  <button
                    type="button"
                    className="sa-btn sa-btn-primary"
                    disabled={!facultyAssignUserId || !facultyAssignCourseId}
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/api/superadmin/faculty-assignments`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ user_id: facultyAssignUserId, course_id: facultyAssignCourseId }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || "Failed");
                        const u = usersList.find((x) => x.id === facultyAssignUserId);
                        setFacultyAssignments((prev) => [...prev, { id: data.id, user_id: data.user_id, course_id: data.course_id, course_name: data.course_name, user_name: u?.name, user_email: u?.email }]);
                        setFacultyAssignUserId("");
                        setFacultyAssignCourseId("");
                      } catch (e) {
                        alert(e.message || "Assign failed");
                      }
                    }}
                  >
                    + Assign
                  </button>
                </div>
              </div>
              <table className="sa-table">
                <thead><tr><th>User</th><th>Course</th><th>Actions</th></tr></thead>
                <tbody>
                  {facultyAssignments.map((a) => {
                    const displayName = a.user_name || a.user_email || (usersList.find((u) => u.id === a.user_id)?.name) || (usersList.find((u) => u.id === a.user_id)?.email) || a.user_id;
                    return (
                    <tr key={a.id}>
                      <td>
                        <button
                          type="button"
                          className="sa-chat-name-btn"
                          onClick={() => {
                            setChatWithUserId(a.user_id);
                            setChatWithUserName(displayName);
                            setChatOpen(true);
                          }}
                        >
                          {displayName}
                        </button>
                      </td>
                      <td>{a.course_name || a.course_id}</td>
                      <td>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/api/superadmin/faculty-assignments/${a.id}`, { method: "DELETE" });
                              if (!res.ok) throw new Error("Failed to remove");
                              setFacultyAssignments((prev) => prev.filter((x) => x.id !== a.id));
                            } catch (e) {
                              alert(e.message);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ); })}
                </tbody>
              </table>
              {facultyAssignments.length === 0 && <p className="sa-muted">No assignments yet. Select a user and course above to assign.</p>}
            </div>
          )}

          <ChatModal
            open={chatOpen}
            onClose={() => { setChatOpen(false); setChatWithUserId(null); setChatWithUserName(""); }}
            otherUserId={chatWithUserId}
            otherUserName={chatWithUserName}
            title={chatWithUserName ? `Chat with ${chatWithUserName}` : ""}
          />

          {activeSub === "code-students" && (
            <div className="dashboard-card">
              <h3 className="card-title">Students applied for code review</h3>
              <p className="card-subtitle">Courses, marks, time slot and answers.</p>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Marks</th>
                    <th>Time slot</th>
                    <th>Answers</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Vidula S (7376231EC317)</td>
                    <td>PS Activity 101</td>
                    <td>72</td>
                    <td>Hall A, 09:00 AM</td>
                    <td><button type="button" className="sa-btn sa-btn-sm">View</button></td>
                    <td><span className="sa-badge sa-badge-warning">Pending</span></td>
                  </tr>
                  <tr>
                    <td>Student 2 (7376231CS323)</td>
                    <td>Advanced PS</td>
                    <td>85</td>
                    <td>Lab 2, 02:00 PM</td>
                    <td><button type="button" className="sa-btn sa-btn-sm">View</button></td>
                    <td><span className="sa-badge sa-badge-success">Verified</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Nav 6: Statistics - Chart.js graphs */}
          {activeSub === "stats-course" && (
            <>
              <div className="sa-stats-row">
                <div className="sa-stat-card"><h4>Total applications</h4><div className="value">1,240</div></div>
                <div className="sa-stat-card"><h4>By year</h4><div className="value">2025-26</div></div>
                <div className="sa-stat-card"><h4>By dept</h4><div className="value">8 depts</div></div>
              </div>
              <div className="dashboard-card">
                <h3 className="card-title">Students applied per course (year &amp; dept)</h3>
                <p className="card-subtitle">Breakdown by year and department.</p>
                <div className="sa-chart-wrap">
                  <Bar data={statsCourseChart} options={chartOptions()} />
                </div>
                <table className="sa-table" style={{ marginTop: 16 }}>
                  <thead><tr><th>Course</th><th>Year</th><th>Dept</th><th>Count</th></tr></thead>
                  <tbody>
                    {statsCourseChart.labels.slice(0, 3).map((name, i) => (
                      <tr key={i}><td>{name}</td><td>2025-26</td><td>{["CSE", "ECE", "CSE"][i]}</td><td>{statsCourseChart.datasets[0].data[i]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSub === "stats-slot" && (
            <div className="dashboard-card">
              <h3 className="card-title">Which slot is used most often</h3>
              <p className="card-subtitle">Booking distribution by slot.</p>
              <div className="sa-chart-wrap sa-chart-bar">
                <Bar data={statsSlotChart} options={chartOptions()} />
              </div>
              <div className="sa-chart-wrap sa-chart-doughnut">
                <Doughnut data={statsSlotChart} options={{ ...chartOptions(), plugins: { ...chartOptions().plugins, legend: { position: "right" } } }} />
              </div>
              <table className="sa-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Slot (Venue, Time)</th><th>Bookings</th><th>%</th></tr></thead>
                <tbody>
                  {statsSlotChart.labels.map((label, i) => (
                    <tr key={i}><td>{label}</td><td>{statsSlotChart.datasets[0].data[i]}</td><td>{Math.round((statsSlotChart.datasets[0].data[i] / statsSlotChart.datasets[0].data.reduce((a, b) => a + b, 0)) * 100)}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "stats-weekly" && (
            <div className="dashboard-card">
              <h3 className="card-title">Weekly clearing analysis</h3>
              <p className="card-subtitle">Students clearing / not clearing percentage.</p>
              <div className="sa-chart-wrap">
                <Line data={statsWeeklyChart} options={chartOptions()} />
              </div>
              <table className="sa-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Week</th><th>Cleared</th><th>Not cleared</th><th>Clear %</th></tr></thead>
                <tbody>
                  {statsWeeklyChart.labels.map((week, i) => (
                    <tr key={i}><td>{week}</td><td>{[85, 92, 78][i]}</td><td>{[15, 8, 22][i]}</td><td>{statsWeeklyChart.datasets[0].data[i]}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "stats-registered" && (
            <div className="dashboard-card">
              <h3 className="card-title">Course registered and attended</h3>
              <p className="card-subtitle">Most, least and average.</p>
              <div className="sa-chart-wrap sa-chart-bar">
                <Bar data={statsRegisteredChart} options={{ ...chartOptions(), scales: { x: { stacked: true }, y: { stacked: true } } }} />
              </div>
              <table className="sa-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Course</th><th>Registered</th><th>Attended</th><th>Attendance %</th><th>Rank</th></tr></thead>
                <tbody>
                  {statsRegisteredChart.labels.map((name, i) => (
                    <tr key={i}>
                      <td>{name}</td>
                      <td>{statsRegisteredChart.datasets[0].data[i]}</td>
                      <td>{statsRegisteredChart.datasets[1].data[i]}</td>
                      <td>{((statsRegisteredChart.datasets[1].data[i] / statsRegisteredChart.datasets[0].data[i]) * 100).toFixed(1)}%</td>
                      <td><span className={`sa-badge ${i === 0 ? "sa-badge-success" : i === 2 ? "sa-badge-warning" : ""}`}>{i === 0 ? "Most" : i === 2 ? "Least" : "Avg"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!NAV.flatMap((s) => s.sub).some((s) => s.id === activeSub) && (
            <div className="dashboard-card">
              <p className="sa-empty">Select a section from the sidebar to view and manage content.</p>
            </div>
          )}
          </>}
          </div>
        </main>
      </div>

      {/* Edit / Add modal */}
      {editModal.open && (
        <div className="sa-modal-overlay" onClick={closeEdit}>
          <div className={`sa-modal ${editModal.section === "courses" ? "sa-modal-courses" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>{editModal.itemId ? "Edit" : "Add"}</h3>
              <button type="button" className="sa-modal-close" onClick={closeEdit} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="sa-modal-body">
              {editModal.section === "roles" && (
                <>
                  <div className="sa-form-group"><label>Role name</label><input type="text" value={editModal.item.role || ""} onChange={(e) => setEditField("role", e.target.value)} placeholder="e.g. student, mentor" /></div>
                  <div className="sa-form-group"><label>Description</label><input type="text" value={editModal.item.description || ""} onChange={(e) => setEditField("description", e.target.value)} placeholder="Short description of this role" /></div>
                  <div className="sa-form-group">
                    <label>Accesses (what this role can see/do in user dashboard)</label>
                    <div className="sa-access-list">
                      {["Mentor", "Warden", "Technical faculty"].map((group) => (
                        <div key={group} className="sa-access-group">
                          <span className="sa-access-group-title">{group}</span>
                          {ACCESS_OPTIONS.filter((o) => o.group === group).map((opt) => {
                            const accessList = (editModal.item.accesses || "").split(",").map((s) => s.trim()).filter(Boolean);
                            const checked = accessList.includes(opt.id);
                            return (
                              <label key={opt.id} className="sa-access-option">
                                <input type="checkbox" checked={checked} onChange={(e) => {
                                  const next = e.target.checked ? [...accessList, opt.id] : accessList.filter((x) => x !== opt.id);
                                  setEditField("accesses", next.join(", "));
                                }} />
                                <span>{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "users" && (
                <>
                  <div className="sa-form-group"><label>Email</label><input type="email" value={editModal.item.email || ""} onChange={(e) => setEditField("email", e.target.value)} placeholder="user@example.com" /></div>
                  <div className="sa-form-group"><label>Name</label><input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="Full name" /></div>
                  <div className="sa-form-group">
                    <label>Roles</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {rolesList.map((r) => {
                        const roleName = r.role;
                        const roles = Array.isArray(editModal.item.roles) ? editModal.item.roles : [];
                        const checked = roles.includes(roleName);
                        return (
                          <label key={r.id || roleName} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="checkbox" checked={checked} onChange={(e) => setEditFieldRoles(e.target.checked ? [...roles, roleName] : roles.filter((x) => x !== roleName))} />
                            <span className="sa-tag" style={getRoleTagStyle(roleName)}>{roleName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "courses" && (
                <>
                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Basic info</h4>
                    <div className="sa-form-group">
                      <label>Course name</label>
                      {editModal.itemId ? (
                        <input type="text" value={editModal.item.name || ""} readOnly disabled className="sa-input-readonly" style={{ opacity: 1, cursor: "default", background: "#f1f5f9" }} />
                      ) : (
                        <input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="e.g. C Programming" />
                      )}
                    </div>
                    <div className="sa-form-group">
                      <label>Course type</label>
                      <input type="text" value={editModal.item.type || ""} onChange={(e) => setEditField("type", e.target.value)} placeholder="e.g. Technical, Assessment" />
                    </div>
                    <div className="sa-form-group">
                      <label>Level (category)</label>
                      <input type="text" value={editModal.item.level || ""} onChange={(e) => setEditField("level", e.target.value)} placeholder="e.g. Beginner, Level 1" />
                    </div>
                    <div className="sa-form-group">
                      <label>Activity points</label>
                      <input type="number" value={editModal.item.activityPoints ?? 0} onChange={(e) => setEditField("activityPoints", e.target.value)} placeholder="10" min="0" />
                    </div>
                    <div className="sa-form-group">
                      <label>Faculty (handles questions)</label>
                      <select value={editModal.item.faculty || ""} onChange={(e) => setEditField("faculty", e.target.value)}>
                        <option value="">Select faculty</option>
                        {facultyList.map((u) => (
                          <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Course levels</h4>
                    <p className="sa-muted" style={{ fontSize: 13, marginBottom: 12 }}>Add levels students can register for. Each level can have one or more prerequisite levels.</p>
                    {(editModal.item.levels || []).map((lev, idx) => {
                      const levelList = editModal.item.levels || [];
                      const prereqIndices = Array.isArray(lev.prerequisiteLevelIndices) ? lev.prerequisiteLevelIndices : (lev.prerequisiteLevelIndex != null && lev.prerequisiteLevelIndex >= 0 ? [lev.prerequisiteLevelIndex] : []);
                      const togglePrereq = (i) => {
                        const l = [...levelList];
                        const next = prereqIndices.includes(i) ? prereqIndices.filter((x) => x !== i) : [...prereqIndices, i].sort((a, b) => a - b);
                        l[idx] = { ...l[idx], prerequisiteLevelIndices: next, prerequisiteLevelIndex: next[0] ?? -1 };
                        setEditField("levels", l);
                      };
                      return (
                        <div key={idx} className="sa-level-card">
                          <div className="sa-level-card-header">
                            <span className="sa-level-card-title">Level {idx + 1}: {lev.name || `Level ${idx}`}</span>
                            <button type="button" className="sa-btn sa-btn-sm" style={{ background: "#dc2626", color: "#fff" }} onClick={() => setEditField("levels", levelList.filter((_, i) => i !== idx))}>Remove</button>
                          </div>
                          <div className="sa-form-group">
                            <label>Level name</label>
                            <input type="text" placeholder="e.g. Level 0, Level 1A" value={lev.name || ""} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], name: e.target.value }; setEditField("levels", l); }} />
                          </div>
                          <div className="sa-form-group">
                            <label>Reward points</label>
                            <input type="number" placeholder="0" value={lev.rewardPoints ?? 0} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], rewardPoints: Number(e.target.value) || 0 }; setEditField("levels", l); }} min="0" />
                          </div>
                          <div className="sa-form-group">
                            <label>Prerequisite levels (select all that must be completed)</label>
                            <div className="sa-prereq-levels">
                              {Array.from({ length: idx }, (_, i) => (
                                <label key={i}>
                                  <input type="checkbox" checked={prereqIndices.includes(i)} onChange={() => togglePrereq(i)} />
                                  Level {i + 1} ({(levelList[i]?.name || `Level ${i}`).slice(0, 20)})
                                </label>
                              ))}
                              {idx === 0 && <span className="sa-muted" style={{ fontSize: 13 }}>None (first level)</span>}
                            </div>
                          </div>
                          <div className="sa-form-group">
                            <label>Assessment type</label>
                            <input type="text" placeholder="e.g. MCQ, Programming, Manual Grading" value={lev.assessmentType || ""} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], assessmentType: e.target.value }; setEditField("levels", l); }} />
                          </div>
                          <div className="sa-form-group">
                            <label>Topics (one per line)</label>
                            <textarea rows={2} placeholder="Topic 1&#10;Topic 2" value={(lev.topics || []).join("\n")} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], topics: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean) }; setEditField("levels", l); }} />
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" className="sa-btn sa-btn-primary" onClick={() => setEditField("levels", [...(editModal.item.levels || []), { name: "", rewardPoints: 0, prerequisiteLevelIndex: -1, prerequisiteLevelIndices: [], assessmentType: "MCQ", topics: [] }])}>+ Add level</button>
                  </div>

                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Prerequisite courses</h4>
                    <p className="sa-muted" style={{ fontSize: 13, marginBottom: 10 }}>Type to search; select one or more courses that students should complete before this course.</p>
                    <div className="sa-autocomplete-wrap">
                      <input
                        type="text"
                        className="sa-autocomplete-input"
                        placeholder="Type course name to search…"
                        value={editModal.item.prereqQuery || ""}
                        onChange={(e) => setEditField("prereqQuery", e.target.value)}
                        onFocus={() => setEditField("prereqSuggestOpen", true)}
                        onBlur={() => setTimeout(() => setEditField("prereqSuggestOpen", false), 180)}
                      />
                      {editModal.item.prereqSuggestOpen && (editModal.item.prereqQuery || "").trim() && (
                        <ul className="sa-autocomplete-list">
                          {coursesList
                            .filter((c) => c.id !== editModal.item.id && !(editModal.item.prerequisites || []).includes(c.id))
                            .filter((c) => (c.name || "").toLowerCase().includes((editModal.item.prereqQuery || "").toLowerCase()))
                            .slice(0, 8)
                            .map((c) => (
                              <li key={c.id}>
                                <button type="button" className="sa-autocomplete-item" onClick={() => { setEditField("prerequisites", [...(editModal.item.prerequisites || []), c.id]); setEditField("prereqQuery", ""); setEditField("prereqSuggestOpen", false); }}>{c.name}</button>
                              </li>
                            ))}
                          {coursesList.filter((c) => c.id !== editModal.item.id && (c.name || "").toLowerCase().includes((editModal.item.prereqQuery || "").toLowerCase())).length === 0 && (
                            <li style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>No matching courses</li>
                          )}
                        </ul>
                      )}
                    </div>
                    <div className="sa-prereq-tags">
                      {(editModal.item.prerequisites || []).map((pid) => {
                        const c = coursesList.find((x) => x.id === pid);
                        if (!c) return null;
                        return (
                          <span key={pid} className="sa-prereq-tag">
                            {c.name}
                            <button type="button" className="sa-prereq-tag-remove" onClick={() => setEditField("prerequisites", (editModal.item.prerequisites || []).filter((x) => x !== pid))} aria-label="Remove">×</button>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Logo & status</h4>
                    <div className="sa-form-group">
                      <label>Course logo</label>
                      <input type="url" value={editModal.item.course_logo?.startsWith("data:") ? "" : (editModal.item.course_logo || "")} onChange={(e) => setEditField("course_logo", e.target.value)} placeholder="https://… or choose file below" />
                      <div className="sa-form-group" style={{ marginTop: 8 }}>
                        <label className="sa-muted" style={{ fontSize: 12 }}>Or choose from your computer</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setEditField("course_logo", reader.result || "");
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }} />
                      </div>
                      {editModal.item.course_logo && (
                        <div className="sa-course-logo-preview" style={{ marginTop: 8 }}>
                          <img src={editModal.item.course_logo} alt="Course logo" onError={(e) => { e.target.style.display = "none"; }} />
                        </div>
                      )}
                    </div>
                    <div className="sa-form-group">
                      <label>Status</label>
                      <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "venues" && (
                <>
                  <div className="sa-form-group"><label>Venue name</label><input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="e.g. Hall A" /></div>
                  <div className="sa-form-group"><label>Location</label><input type="text" value={editModal.item.location || ""} onChange={(e) => setEditField("location", e.target.value)} placeholder="e.g. Block 1" /></div>
                </>
              )}
              {editModal.section === "time" && (
                <>
                  <div className="sa-form-group"><label>Start time (24h)</label><input type="text" value={editModal.item.startTime || ""} onChange={(e) => setEditField("startTime", e.target.value)} placeholder="e.g. 09:00" /></div>
                  <div className="sa-form-group"><label>End time (24h)</label><input type="text" value={editModal.item.endTime || ""} onChange={(e) => setEditField("endTime", e.target.value)} placeholder="e.g. 10:30" /></div>
                </>
              )}
              {editModal.section === "slots" && (
                <>
                  <div className="sa-form-group">
                    <label>Venue</label>
                    <select value={editModal.item.venueId || ""} onChange={(e) => setEditField("venueId", e.target.value)}>
                      <option value="">Select venue</option>
                      {venuesList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label>Time slot</label>
                    <select value={editModal.item.timeId || ""} onChange={(e) => setEditField("timeId", e.target.value)}>
                      <option value="">Select time</option>
                      {timeSlotsList.map((t) => <option key={t.id} value={t.id}>{formatTime(t.startTime)} – {formatTime(t.endTime)}</option>)}
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label>Status</label>
                    <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}
              {editModal.section === "leave-types" && (
                <>
                  <div className="sa-form-group"><label>Type</label><input type="text" value={editModal.item.type || ""} onChange={(e) => setEditField("type", e.target.value)} placeholder="e.g. Sick Leave" /></div>
                  <div className="sa-form-group"><label>Code</label><input type="text" value={editModal.item.code || ""} onChange={(e) => setEditField("code", e.target.value)} placeholder="e.g. SL" /></div>
                  <div className="sa-form-group">
                    <label>Status</label>
                    <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label>Leave flow</label>
                    <p className="sa-form-hint">Click roles below to add; click × on a tag to remove.</p>
                    <div className="sa-workflow-tags">
                      {((editModal.item.workflow || "").split(",").map((s) => s.trim()).filter(Boolean)).map((step) => (
                        <span key={step} className="sa-tag sa-tag-removable" style={getRoleTagStyle(step)}>
                          {step}
                          <button
                            type="button"
                            className="sa-tag-remove"
                            onClick={() => {
                              const steps = (editModal.item.workflow || "").split(",").map((s) => s.trim()).filter(Boolean);
                              setEditField("workflow", steps.filter((s) => s !== step).join(", "));
                            }}
                            aria-label={`Remove ${step}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="sa-workflow-add">
                      <span className="sa-workflow-add-label">Add step:</span>
                      {(() => {
                        const steps = (editModal.item.workflow || "").split(",").map((s) => s.trim()).filter(Boolean);
                        const parentsAdded = steps.includes("Parents");
                        return (
                          <>
                            <button
                              type="button"
                              className={`sa-tag sa-tag-clickable ${parentsAdded ? "sa-tag-added" : ""}`}
                              style={getRoleTagStyle("parents")}
                              onClick={() => {
                                if (parentsAdded) return;
                                const current = (editModal.item.workflow || "").trim();
                                setEditField("workflow", current ? `Parents, ${current}` : "Parents");
                              }}
                              disabled={parentsAdded}
                            >
                              Parents
                            </button>
                            {rolesList
                              .filter((r) => (r.role || "").toLowerCase() !== "student")
                              .map((r) => {
                                const role = r.role;
                                const added = steps.includes(role);
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    className={`sa-tag sa-tag-clickable ${added ? "sa-tag-added" : ""}`}
                                    style={getRoleTagStyle(role)}
                                    onClick={() => {
                                      if (added) return;
                                      const current = (editModal.item.workflow || "").trim();
                                      setEditField("workflow", current ? `${current}, ${role}` : role);
                                    }}
                                    disabled={added}
                                  >
                                    {role}
                                  </button>
                                );
                              })}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "leave-workflow" && (
                <>
                  <div className="sa-form-group"><label>Leave type</label><input type="text" value={editModal.item.leaveType || ""} onChange={(e) => setEditField("leaveType", e.target.value)} placeholder="e.g. Sick Leave" /></div>
                  <div className="sa-form-group"><label>Workflow</label><input type="text" value={editModal.item.workflow || ""} onChange={(e) => setEditField("workflow", e.target.value)} placeholder="e.g. Mentor → Warden" /></div>
                </>
              )}
            </div>
            <div className="sa-modal-footer">
              <button type="button" className="sa-btn" onClick={closeEdit}>Cancel</button>
              <button type="button" className="sa-btn sa-btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
