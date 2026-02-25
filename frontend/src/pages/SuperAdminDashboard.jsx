import React, { useState } from "react";
import {
  ChevronDown,
  Shield,
  BookOpen,
  Calendar,
  FileText,
  Code,
  BarChart3,
  LogOut,
  Plus,
  Pencil,
} from "lucide-react";
import "./SuperAdminDashboard.css";

const NAV = [
  {
    id: "rbac",
    label: "Role based access control (users defining)",
    icon: Shield,
    sub: [
      { id: "roles", label: "Roles (student, mentor, warden, hostel manager…)" },
      { id: "users-list", label: "List of users and their roles" },
      { id: "create-user", label: "Create new users" },
    ],
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    sub: [
      { id: "course-upload", label: "Uploading/creating course" },
      { id: "course-points", label: "Activity Points, Reward Points, levels, prereq" },
    ],
  },
  {
    id: "slots",
    label: "Slots creating",
    icon: Calendar,
    sub: [
      { id: "venue", label: "Venue" },
      { id: "time", label: "Time" },
      { id: "slots-list", label: "Slots (venue, time)" },
    ],
  },
  {
    id: "leave",
    label: "Leave flow",
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
      { id: "code-access", label: "Give access to faculty for verification" },
      { id: "code-students", label: "List of students applied for code review" },
    ],
  },
  {
    id: "stats",
    label: "Statistics",
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

export default function SuperAdminDashboard() {
  const [openNav, setOpenNav] = useState("rbac");
  const [activeSub, setActiveSub] = useState("roles");

  const userRole = localStorage.getItem("role") || "super_admin";
  const userName = localStorage.getItem("userName") || "Super Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

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
            <span className="profile-id">Super Admin</span>
            <span className="profile-name">{userName}</span>
          </div>
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
              <span className="highlight">Super Admin Dashboard</span>
              {" — "}
              {NAV.flatMap((s) => s.sub).find((s) => s.id === activeSub)?.label || "Overview"}
            </div>

          {/* Nav 1: Role based access */}
          {activeSub === "roles" && (
            <>
              <div className="dashboard-card">
                <h3 className="card-title">Roles – create new and assign accesses</h3>
                <p className="card-subtitle">Manage system roles and their permissions.</p>
                <div className="sa-form-group">
                  <label>Role name</label>
                  <input type="text" placeholder="e.g. student, mentor, warden, hostel manager" />
                </div>
                <div className="sa-form-group">
                  <label>Description</label>
                  <input type="text" placeholder="Short description" />
                </div>
                <div className="sa-form-group">
                  <label>Accesses (permissions)</label>
                  <input type="text" placeholder="Comma-separated or select from list" />
                </div>
                <button type="button" className="sa-btn sa-btn-primary"><Plus size={16} /> Create new role</button>
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
                    <tr>
                      <td>Student</td>
                      <td>Can view courses, apply leave</td>
                      <td>courses.view, leave.apply</td>
                      <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td>
                    </tr>
                    <tr>
                      <td>Mentor</td>
                      <td>Can approve leave, view students</td>
                      <td>leave.approve, students.view</td>
                      <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td>
                    </tr>
                    <tr>
                      <td>Warden</td>
                      <td>Hostel warden approvals</td>
                      <td>leave.approve, hostel.view</td>
                      <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td>
                    </tr>
                    <tr>
                      <td>Hostel Manager</td>
                      <td>Manage hostel and leave flow</td>
                      <td>hostel.manage, leave.approve</td>
                      <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td>
                    </tr>
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
                  <tr>
                    <td>vidula@example.com</td>
                    <td>Vidula S</td>
                    <td><span className={`sa-tag ${getRoleTagClass("student")}`}>Student</span></td>
                    <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /> Edit</button></td>
                  </tr>
                  <tr>
                    <td>mentor@example.com</td>
                    <td>Mentor User</td>
                    <td><span className={`sa-tag ${getRoleTagClass("mentor")}`}>Mentor</span></td>
                    <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /> Edit</button></td>
                  </tr>
                  <tr>
                    <td>admin@example.com</td>
                    <td>Admin User</td>
                    <td><span className={`sa-tag ${getRoleTagClass("admin")}`}>Admin</span> <span className={`sa-tag ${getRoleTagClass("mentor")}`}>Mentor</span></td>
                    <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /> Edit</button></td>
                  </tr>
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
                <input type="email" placeholder="user@example.com" />
              </div>
              <div className="sa-form-group">
                <label>Name</label>
                <input type="text" placeholder="Full name" />
              </div>
              <div className="sa-form-group">
                <label>Assign roles (pastel colour tagged)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {["Student", "Mentor", "Warden", "Hostel Manager", "Admin"].map((r) => (
                    <label key={r} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="checkbox" />
                      <span className={`sa-tag ${getRoleTagClass(r)}`}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="button" className="sa-btn sa-btn-primary"><Plus size={16} /> Create user</button>
            </div>
          )}

          {/* Nav 2: Courses */}
          {activeSub === "course-upload" && (
            <div className="dashboard-card">
              <h3 className="card-title">Uploading / creating course</h3>
              <p className="card-subtitle">Add new courses and edit existing ones.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }}><Plus size={16} /> Add new course</button>
              <table className="sa-table">
                <thead>
                  <tr><th>Course name</th><th>Description</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PS Activity 101</td>
                    <td>Introduction to PS</td>
                    <td><span className="sa-badge sa-badge-success">Active</span></td>
                    <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td>
                  </tr>
                  <tr>
                    <td>Advanced PS</td>
                    <td>Level 2 course</td>
                    <td><span className="sa-badge sa-badge-success">Active</span></td>
                    <td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "course-points" && (
            <div className="dashboard-card">
              <h3 className="card-title">Activity Points, Reward Points &amp; levels</h3>
              <p className="card-subtitle">Description, number of levels and prerequisites.</p>
              <div className="sa-form-group"><label>Activity Points</label><input type="number" placeholder="e.g. 10" /></div>
              <div className="sa-form-group"><label>Reward Points</label><input type="number" placeholder="e.g. 5" /></div>
              <div className="sa-form-group"><label>Description</label><textarea placeholder="Course description" /></div>
              <div className="sa-form-group"><label>Number of levels</label><input type="number" placeholder="e.g. 3" /></div>
              <div className="sa-form-group"><label>Prerequisites</label><input type="text" placeholder="Comma-separated course IDs or names" /></div>
              <button type="button" className="sa-btn sa-btn-primary">Save</button>
            </div>
          )}

          {/* Nav 3: Slots */}
          {activeSub === "venue" && (
            <div className="dashboard-card">
              <h3 className="card-title">Venue</h3>
              <p className="card-subtitle">Manage venues for slots.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }}><Plus size={16} /> Add venue</button>
              <table className="sa-table">
                <thead><tr><th>Venue name</th><th>Location</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr><td>Hall A</td><td>Block 1</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                  <tr><td>Lab 2</td><td>Block 2</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "time" && (
            <div className="dashboard-card">
              <h3 className="card-title">Time</h3>
              <p className="card-subtitle">Manage time slots.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }}><Plus size={16} /> Add time slot</button>
              <table className="sa-table">
                <thead><tr><th>Start time</th><th>End time</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr><td>09:00 AM</td><td>10:30 AM</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                  <tr><td>02:00 PM</td><td>03:30 PM</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "slots-list" && (
            <div className="dashboard-card">
              <h3 className="card-title">Slots (venue, time)</h3>
              <p className="card-subtitle">Edit and add new slots.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }}><Plus size={16} /> New slot</button>
              <table className="sa-table">
                <thead><tr><th>Venue</th><th>Time</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr><td>Hall A</td><td>09:00 AM – 10:30 AM</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                  <tr><td>Lab 2</td><td>02:00 PM – 03:30 PM</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Nav 4: Leave flow */}
          {activeSub === "leave-types" && (
            <div className="dashboard-card">
              <h3 className="card-title">Leave types</h3>
              <p className="card-subtitle">Add and manage leave type codes.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }}><Plus size={16} /> Add leave type</button>
              <table className="sa-table">
                <thead><tr><th>Type</th><th>Code</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr><td>Sick Leave</td><td>SL</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                  <tr><td>SP</td><td>SP</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                  <tr><td>OnDuty - Events</td><td>OD-E</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
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
                <input type="text" placeholder="e.g. mentor, warden, hostel_manager" />
              </div>
              <button type="button" className="sa-btn sa-btn-primary">Save flow</button>
            </div>
          )}

          {activeSub === "leave-workflow" && (
            <div className="dashboard-card">
              <h3 className="card-title">All leave types with workflow</h3>
              <p className="card-subtitle">Edit and add new workflows.</p>
              <table className="sa-table">
                <thead><tr><th>Leave type</th><th>Workflow</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr><td>Sick Leave</td><td>Mentor → Warden</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                  <tr><td>SP</td><td>Mentor → Warden</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                  <tr><td>OnDuty</td><td>Mentor only</td><td><button type="button" className="sa-btn sa-btn-sm"><Pencil size={14} /></button></td></tr>
                </tbody>
              </table>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginTop: 16 }}><Plus size={16} /> Add new</button>
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

          {/* Nav 6: Statistics */}
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
                <table className="sa-table">
                  <thead><tr><th>Course</th><th>Year</th><th>Dept</th><th>Count</th></tr></thead>
                  <tbody>
                    <tr><td>PS Activity 101</td><td>2025-26</td><td>CSE</td><td>320</td></tr>
                    <tr><td>PS Activity 101</td><td>2025-26</td><td>ECE</td><td>280</td></tr>
                    <tr><td>Advanced PS</td><td>2025-26</td><td>CSE</td><td>150</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSub === "stats-slot" && (
            <div className="dashboard-card">
              <h3 className="card-title">Which slot is used most often</h3>
              <p className="card-subtitle">Booking distribution by slot.</p>
              <table className="sa-table">
                <thead><tr><th>Slot (Venue, Time)</th><th>Bookings</th><th>%</th></tr></thead>
                <tbody>
                  <tr><td>Hall A, 09:00 AM - 10:30 AM</td><td>450</td><td>38%</td></tr>
                  <tr><td>Lab 2, 02:00 PM - 03:30 PM</td><td>320</td><td>27%</td></tr>
                  <tr><td>Hall B, 11:00 AM - 12:30 PM</td><td>280</td><td>24%</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "stats-weekly" && (
            <div className="dashboard-card">
              <h3 className="card-title">Weekly clearing analysis</h3>
              <p className="card-subtitle">Students clearing / not clearing percentage.</p>
              <table className="sa-table">
                <thead><tr><th>Week</th><th>Cleared</th><th>Not cleared</th><th>Clear %</th></tr></thead>
                <tbody>
                  <tr><td>Week 1 (Feb 17-23)</td><td>85</td><td>15</td><td>85%</td></tr>
                  <tr><td>Week 2 (Feb 24-Mar 2)</td><td>92</td><td>8</td><td>92%</td></tr>
                  <tr><td>Week 3 (Mar 3-9)</td><td>78</td><td>22</td><td>78%</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "stats-registered" && (
            <div className="dashboard-card">
              <h3 className="card-title">Course registered and attended</h3>
              <p className="card-subtitle">Most, least and average.</p>
              <table className="sa-table">
                <thead><tr><th>Course</th><th>Registered</th><th>Attended</th><th>Attendance %</th><th>Rank</th></tr></thead>
                <tbody>
                  <tr><td>PS Activity 101</td><td>600</td><td>580</td><td>96.7%</td><td><span className="sa-badge sa-badge-success">Most</span></td></tr>
                  <tr><td>Advanced PS</td><td>200</td><td>195</td><td>97.5%</td><td>Avg</td></tr>
                  <tr><td>Elective X</td><td>50</td><td>42</td><td>84%</td><td><span className="sa-badge sa-badge-warning">Least</span></td></tr>
                </tbody>
              </table>
            </div>
          )}

          {!NAV.flatMap((s) => s.sub).some((s) => s.id === activeSub) && (
            <div className="dashboard-card">
              <p className="sa-empty">Select a section from the sidebar to view and manage content.</p>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
