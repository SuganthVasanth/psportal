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
      { id: "leave-types", label: "Leave types" },
      { id: "leave-approval", label: "Leave approval flow" },
      { id: "leave-workflow", label: "All leave types with workflow" },
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

const ROLE_TAG_COLORS = {
  student: "sa-tag-student",
  mentor: "sa-tag-mentor",
  warden: "sa-tag-warden",
  "hostel manager": "sa-tag-hostel",
  admin: "sa-tag-admin",
  super_admin: "sa-tag-super",
};

function getRoleTagClass(role) {
  const r = (role || "").toLowerCase();
  return ROLE_TAG_COLORS[r] || "sa-tag-neutral";
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
  const [coursePointsForm, setCoursePointsForm] = useState({
    activityPoints: "10",
    rewardPoints: "5",
    description: "",
    numLevels: "3",
    prerequisites: "",
  });
  const [leaveApprovalSteps, setLeaveApprovalSteps] = useState("mentor, warden, hostel_manager");
  const [createUserForm, setCreateUserForm] = useState({ email: "", name: "", roles: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editModal, setEditModal] = useState({
    open: false,
    section: "",
    itemId: null,
    item: {},
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [roles, users, courses, venues, timeSlots, slotTemplates, leaveTypes, leaveWorkflows, settings] = await Promise.all([
          fetch(`${API_BASE}/api/superadmin/roles`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/users`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/courses`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/venues`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/time-slots`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/slot-templates`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/leave-types`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/leave-workflows`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/settings`).then((r) => r.json()),
        ]);
        setRolesList(Array.isArray(roles) ? roles : []);
        setUsersList(Array.isArray(users) ? users : []);
        setCoursesList(Array.isArray(courses) ? courses : []);
        setVenuesList(Array.isArray(venues) ? venues : []);
        setTimeSlotsList(Array.isArray(timeSlots) ? timeSlots : []);
        setSlotsList(Array.isArray(slotTemplates) ? slotTemplates : []);
        setLeaveTypesList(Array.isArray(leaveTypes) ? leaveTypes : []);
        setLeaveWorkflowList(Array.isArray(leaveWorkflows) ? leaveWorkflows : []);
        if (settings && typeof settings === "object") {
          if (settings.leaveApprovalSteps != null) setLeaveApprovalSteps(settings.leaveApprovalSteps);
          if (settings.coursePoints && typeof settings.coursePoints === "object") {
            setCoursePointsForm((p) => ({ ...p, ...settings.coursePoints }));
          }
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
          body: JSON.stringify({ name: item.name, description: item.description, status: item.status }),
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
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: item.type, code: item.code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save leave type");
        if (itemId) setLeaveTypesList((prev) => prev.map((l) => (l.id === itemId ? data : l)));
        else setLeaveTypesList((prev) => [...prev, data]);
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
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`}
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
                      <td><span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{row.roles?.map((r) => <span key={r} className={`sa-tag ${getRoleTagClass(r)}`}>{r}</span>)}</span></td>
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
                  {["Student", "Mentor", "Warden", "Hostel Manager", "Admin"].map((r) => {
                    const checked = createUserForm.roles.includes(r);
                    return (
                      <label key={r} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setCreateUserForm((p) => ({ ...p, roles: e.target.checked ? [...p.roles, r] : p.roles.filter((x) => x !== r) }))}
                        />
                        <span className={`sa-tag ${getRoleTagClass(r)}`}>{r}</span>
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
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }} onClick={() => openAdd("courses", { name: "", description: "", status: "Active" })}><Plus size={16} /> Add new course</button>
              <table className="sa-table">
                <thead>
                  <tr><th>Course name</th><th>Description</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {coursesList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.description}</td>
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
              <h3 className="card-title">Activity Points, Reward Points &amp; levels</h3>
              <p className="card-subtitle">Description, number of levels and prerequisites.</p>
              <div className="sa-form-group"><label>Activity Points</label><input type="number" placeholder="e.g. 10" value={coursePointsForm.activityPoints} onChange={(e) => setCoursePointsForm((p) => ({ ...p, activityPoints: e.target.value }))} /></div>
              <div className="sa-form-group"><label>Reward Points</label><input type="number" placeholder="e.g. 5" value={coursePointsForm.rewardPoints} onChange={(e) => setCoursePointsForm((p) => ({ ...p, rewardPoints: e.target.value }))} /></div>
              <div className="sa-form-group"><label>Description</label><textarea placeholder="Course description" value={coursePointsForm.description} onChange={(e) => setCoursePointsForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <div className="sa-form-group"><label>Number of levels</label><input type="number" placeholder="e.g. 3" value={coursePointsForm.numLevels} onChange={(e) => setCoursePointsForm((p) => ({ ...p, numLevels: e.target.value }))} /></div>
              <div className="sa-form-group"><label>Prerequisites</label><input type="text" placeholder="Comma-separated course IDs or names" value={coursePointsForm.prerequisites} onChange={(e) => setCoursePointsForm((p) => ({ ...p, prerequisites: e.target.value }))} /></div>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/api/superadmin/settings`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ coursePoints: coursePointsForm }),
                    });
                    if (!res.ok) throw new Error((await res.json()).message || "Failed to save");
                    alert("Course points settings saved.");
                  } catch (e) {
                    alert(e.message || "Save failed");
                  }
                }}
              >
                Save
              </button>
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

          {/* Nav 4: Leave flow */}
          {activeSub === "leave-types" && (
            <div className="dashboard-card">
              <h3 className="card-title">Leave types</h3>
              <p className="card-subtitle">Add and manage leave type codes.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }} onClick={() => openAdd("leave-types", { type: "", code: "" })}><Plus size={16} /> Add leave type</button>
              <table className="sa-table">
                <thead><tr><th>Type</th><th>Code</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaveTypesList.map((row) => (
                    <tr key={row.id}><td>{row.type}</td><td>{row.code}</td><td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("leave-types", row)}><Pencil size={14} /></button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "leave-approval" && (
            <div className="dashboard-card">
              <h3 className="card-title">Leave approval flow</h3>
              <p className="card-subtitle">Define order of approvers (e.g. Mentor, Warden, Hostel Manager).</p>
              <div className="sa-form-group">
                <label>Approval steps</label>
                <input type="text" placeholder="e.g. mentor, warden, hostel_manager" value={leaveApprovalSteps} onChange={(e) => setLeaveApprovalSteps(e.target.value)} />
              </div>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/api/superadmin/settings`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ leaveApprovalSteps }),
                    });
                    if (!res.ok) throw new Error((await res.json()).message || "Failed to save");
                    alert("Leave approval flow saved.");
                  } catch (e) {
                    alert(e.message || "Save failed");
                  }
                }}
              >
                Save flow
              </button>
            </div>
          )}

          {activeSub === "leave-workflow" && (
            <div className="dashboard-card">
              <h3 className="card-title">All leave types with workflow</h3>
              <p className="card-subtitle">Edit and add new workflows.</p>
              <table className="sa-table">
                <thead><tr><th>Leave type</th><th>Workflow</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaveWorkflowList.map((row) => (
                    <tr key={row.id}><td>{row.leaveType}</td><td>{row.workflow}</td><td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("leave-workflow", row)}><Pencil size={14} /></button></td></tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginTop: 16 }} onClick={() => openAdd("leave-workflow", { leaveType: "", workflow: "" })}><Plus size={16} /> Add new</button>
            </div>
          )}

          {activeSub === "code-access" && (
            <div className="dashboard-card">
              <h3 className="card-title">Give access to faculty</h3>
              <p className="card-subtitle">Student answers and answer key for verification.</p>
              <div className="sa-form-group">
                <label>Select faculty</label>
                <select><option>Select faculty</option><option>Faculty 1</option><option>Faculty 2</option></select>
              </div>
              <div className="sa-form-group">
                <label>Assessment / Exam</label>
                <select><option>Select assessment</option></select>
              </div>
              <div className="sa-form-group">
                <label>Access type</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <label><input type="checkbox" /> Student answers</label>
                  <label><input type="checkbox" /> Answer key</label>
                </div>
              </div>
              <button type="button" className="sa-btn sa-btn-primary">Grant access</button>
            </div>
          )}

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
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>{editModal.itemId ? "Edit" : "Add"}</h3>
              <button type="button" className="sa-modal-close" onClick={closeEdit} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="sa-modal-body">
              {editModal.section === "roles" && (
                <>
                  <div className="sa-form-group"><label>Role name</label><input type="text" value={editModal.item.role || ""} onChange={(e) => setEditField("role", e.target.value)} placeholder="e.g. student, mentor" /></div>
                  <div className="sa-form-group"><label>Description</label><input type="text" value={editModal.item.description || ""} onChange={(e) => setEditField("description", e.target.value)} placeholder="Short description" /></div>
                  <div className="sa-form-group"><label>Accesses</label><input type="text" value={editModal.item.accesses || ""} onChange={(e) => setEditField("accesses", e.target.value)} placeholder="Comma-separated" /></div>
                </>
              )}
              {editModal.section === "users" && (
                <>
                  <div className="sa-form-group"><label>Email</label><input type="email" value={editModal.item.email || ""} onChange={(e) => setEditField("email", e.target.value)} placeholder="user@example.com" /></div>
                  <div className="sa-form-group"><label>Name</label><input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="Full name" /></div>
                  <div className="sa-form-group">
                    <label>Roles</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {["Student", "Mentor", "Warden", "Hostel Manager", "Admin"].map((r) => {
                        const roles = Array.isArray(editModal.item.roles) ? editModal.item.roles : [];
                        const checked = roles.includes(r);
                        return (
                          <label key={r} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="checkbox" checked={checked} onChange={(e) => setEditFieldRoles(e.target.checked ? [...roles, r] : roles.filter((x) => x !== r))} />
                            <span className={`sa-tag ${getRoleTagClass(r)}`}>{r}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "courses" && (
                <>
                  <div className="sa-form-group"><label>Course name</label><input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="Course name" /></div>
                  <div className="sa-form-group"><label>Description</label><input type="text" value={editModal.item.description || ""} onChange={(e) => setEditField("description", e.target.value)} placeholder="Description" /></div>
                  <div className="sa-form-group">
                    <label>Status</label>
                    <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
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
