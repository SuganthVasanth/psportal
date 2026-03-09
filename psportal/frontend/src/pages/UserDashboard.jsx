import React, { useState, useEffect } from "react";
import { LogOut, BookOpen, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import "./SuperAdminDashboard.css";
import "./UserDashboard.css";
import ChatModal from "../components/ChatModal";

const API_BASE = "http://localhost:5000";

export default function UserDashboard() {
  const [data, setData] = useState(null);
  const [questionBankTasks, setQuestionBankTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [expandTaskId, setExpandTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", content: "", file_url: "" });
  const [taskFile, setTaskFile] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const openTaskForm = (task) => {
    const id = task.id || task.course_id;
    if (expandTaskId === id) {
      setExpandTaskId(null);
    } else {
      setExpandTaskId(id);
      setTaskForm({ title: task.title || "", content: task.content || "", file_url: task.file_url || "" });
    }
  };

  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/dashboard/me`, { headers: authHeaders })
      .then((res) => res.json().then((p) => (res.ok ? p : Promise.reject(new Error(p.message || "Failed to load")))))
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data?.user) return;
    const accesses = data.user.accesses || [];
    if (!accesses.includes("faculty.question_bank") && !accesses.includes("faculty.courses_assigned")) return;
    if (!token) return;
    fetch(`${API_BASE}/api/question-banks/my-tasks`, { headers: authHeaders })
      .then((res) => res.json().then((p) => (res.ok ? p : { tasks: [] })))
      .then((r) => setQuestionBankTasks(r.tasks || []))
      .catch(() => setQuestionBankTasks([]));
  }, [data?.user?.id, data?.user?.accesses, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
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

  const { user, mentees, ward_students, leave_requests_to_approve, assigned_courses } = data;
  const has = (key) => (user.accesses || []).includes(key);

  return (
    <div className="ud-dashboard">
      <header className="ud-header">
        <div className="ud-brand">PCDP Portal — User Dashboard</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="ud-user-block">
            <div>
              <div className="ud-user-email">{user.email}</div>
              <div className="ud-user-name">{user.name || "User"}</div>
            </div>
          </div>
          {(user.roles || []).map((r) => (
            <span key={r} className="ud-role-tag">{r}</span>
          ))}
          <button type="button" className="ud-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="ud-main">
        <h1 className="ud-welcome">Welcome, {user.name || user.email}</h1>
        <p className="ud-welcome-sub">Manage your tasks and access by role</p>

        {/* Mentees */}
        {(has("mentees.view") || mentees?.length > 0) && (
          <section className="ud-card">
            <h3 className="card-title">My Mentees</h3>
            <p className="card-subtitle">Students assigned to you as mentor</p>
            {mentees?.length === 0 ? (
              <p className="sa-muted">No mentees assigned.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Register No</th>
                      <th>Name</th>
                      <th>Department</th>
                      {has("mentees.activity_points") && <th>Activity points</th>}
                      {has("mentees.attendance") && <th>Attendance %</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {mentees?.map((m) => (
                      <tr key={m.register_no}>
                        <td>{m.register_no}</td>
                        <td>{m.name}</td>
                        <td>{m.department || "-"}</td>
                        {has("mentees.activity_points") && <td>{m.total_activity ?? m.activity_points ?? 0}</td>}
                        {has("mentees.attendance") && <td>{m.attendance_percent ?? "-"}%</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {has("mentees.courses") && mentees?.length > 0 && (
              <details style={{ marginTop: 16 }}>
                <summary>Course progress by mentee</summary>
                {mentees.map((m) => (
                  <div key={m.register_no} style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                    <strong>{m.name}</strong> ({m.register_no}): {(m.courses_progress || []).length} level(s) in progress
                  </div>
                ))}
              </details>
            )}
          </section>
        )}

        {/* Ward students */}
        {(has("ward_students.view") || ward_students?.length > 0) && (
          <section className="ud-card">
            <h3 className="card-title">My Ward Students</h3>
            <p className="card-subtitle">Students in your ward</p>
            {ward_students?.length === 0 ? (
              <p className="sa-muted">No ward students assigned.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Register No</th>
                      <th>Name</th>
                      <th>Department</th>
                      {has("ward_students.room") && <th>Room</th>}
                      {has("ward_students.biometric") && <th>Biometric</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {ward_students?.map((w) => (
                      <tr key={w.register_no}>
                        <td>{w.register_no}</td>
                        <td>{w.name}</td>
                        <td>{w.department || "-"}</td>
                        {has("ward_students.room") && <td>{w.room_number || "-"}</td>}
                        {has("ward_students.biometric") && <td>{w.biometric_details || "-"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Leave requests to approve */}
        {(has("mentees.leave_approve") || has("ward_students.leave_approve")) && (
          <section className="ud-card">
            <h3 className="card-title">Leave requests to approve</h3>
            <p className="card-subtitle">Pending your approval (mentor / warden)</p>
            {!leave_requests_to_approve?.length ? (
              <p className="sa-muted">No pending leave requests.</p>
            ) : (
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Leave type</th>
                      <th>From – To</th>
                      <th>Remarks</th>
                      <th>Approval type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leave_requests_to_approve.map((l) => (
                      <tr key={l.id || l._id}>
                        <td>{l.student_name || l.register_no}</td>
                        <td>{l.leaveType}</td>
                        <td>{l.fromDate ? new Date(l.fromDate).toLocaleDateString() : ""} – {l.toDate ? new Date(l.toDate).toLocaleDateString() : ""}</td>
                        <td>{l.remarks || "-"}</td>
                        <td><span className="sa-tag">{l.approval_type || "mentor"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Assigned courses & Question bank tasks (technical faculty) */}
        {(has("faculty.courses_assigned") || has("faculty.question_bank") || assigned_courses?.length > 0 || questionBankTasks?.length > 0) && (
          <section className="ud-card">
            <h3 className="ud-card-title">
              <BookOpen size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
              Question bank tasks
            </h3>
            <p className="ud-card-subtitle">Complete and submit question bank for each assigned course. Admin will review and approve or reject.</p>
            {questionBankTasks?.length === 0 && (!assigned_courses?.length || assigned_courses.length === 0) ? (
              <p className="ud-empty">No courses assigned yet. Courses assigned in Admin → Course details (Faculty column) or Code review → Assign Faculty will appear here.</p>
            ) : (
              <div className="ud-task-list">
                {(questionBankTasks?.length ? questionBankTasks : (assigned_courses || []).map((c) => ({ course_id: c.id, course_name: c.name, status: "not_started" }))).map((task) => {
                  const statusLabel = task.status === "approved" ? "Completed" : task.status === "rejected" ? "Rejected" : task.status === "submitted" || task.status === "draft" ? "Pending" : "Not started";
                  const statusClass = task.status === "approved" ? "ud-badge-success" : task.status === "rejected" ? "ud-badge-danger" : "ud-badge-warning";
                  const isExpanded = expandTaskId === (task.id || task.course_id);
                  const canEdit = task.status !== "approved" && task.status !== "rejected";
                  return (
                    <div key={task.id || task.course_id} className="ud-task-card">
                      <div className="ud-task-head" onClick={() => canEdit && openTaskForm(task)}>
                        <div className="ud-task-head-left">
                          {canEdit && (isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />)}
                          <span className="ud-task-name">{task.course_name}</span>
                          <span className={`ud-badge ${statusClass}`}>{statusLabel}</span>
                          {task.submitted_at && (
                            <span className="ud-task-meta">Submitted {new Date(task.submitted_at).toLocaleDateString()}</span>
                          )}
                          <button
                            type="button"
                            className="ud-chat-icon-btn"
                            onClick={(e) => { e.stopPropagation(); setChatOpen(true); }}
                            title="View messages from admin"
                          >
                            <MessageCircle size={18} />
                          </button>
                        </div>
                        {canEdit && <span className="ud-task-cta">{isExpanded ? "Close" : "Complete / Import & post"}</span>}
                      </div>
                      {isExpanded && canEdit && (
                        <div className="ud-task-body">
                          <div className="ud-form-group">
                            <label>Document (drag & drop or click)</label>
                            <div
                              className={`ud-dropzone ${dragOver ? "ud-dropzone-active" : ""}`}
                              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                              onDragLeave={() => setDragOver(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                const file = e.dataTransfer?.files?.[0];
                                if (file) setTaskFile(file);
                              }}
                              onClick={() => document.getElementById(`task-file-${task.course_id}`)?.click()}
                            >
                              <input
                                id={`task-file-${task.course_id}`}
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                                style={{ display: "none" }}
                                onChange={(e) => setTaskFile(e.target.files?.[0] || null)}
                              />
                              {taskFile ? (
                                <span className="ud-dropzone-file">{taskFile.name}</span>
                              ) : (
                                <span className="ud-dropzone-placeholder">Drop your question bank document here or click to choose</span>
                              )}
                            </div>
                          </div>
                          <div className="ud-form-group">
                            <label>Title (optional)</label>
                            <input
                              type="text"
                              value={taskForm.title}
                              onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                              placeholder="e.g. Unit 1 Question Bank"
                            />
                          </div>
                          <div className="ud-form-group">
                            <label>Notes / description (optional)</label>
                            <textarea
                              rows={2}
                              value={taskForm.content}
                              onChange={(e) => setTaskForm((f) => ({ ...f, content: e.target.value }))}
                              placeholder="Brief notes or paste text..."
                            />
                          </div>
                          <div className="ud-btn-row">
                            <button
                              type="button"
                              className="ud-btn-primary"
                              disabled={submittingTaskId !== null}
                              onClick={async () => {
                                let file_url = taskForm.file_url;
                                let file_name = "";
                                if (taskFile) {
                                  const form = new FormData();
                                  form.append("file", taskFile);
                                  const up = await fetch(`${API_BASE}/api/upload`, { method: "POST", headers: authHeaders, body: form });
                                  const upData = await up.json();
                                  if (!up.ok) {
                                    alert(upData.message || "File upload failed");
                                    return;
                                  }
                                  file_url = upData.url?.startsWith("http") ? upData.url : `${API_BASE}${upData.url}`;
                                  file_name = upData.file_name || taskFile.name;
                                }
                                setSubmittingTaskId(task.course_id);
                                try {
                                  const res = await fetch(`${API_BASE}/api/question-banks`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", ...authHeaders },
                                    body: JSON.stringify({
                                      course_id: task.course_id,
                                      title: taskForm.title,
                                      content: taskForm.content,
                                      file_url: file_url || taskForm.file_url,
                                      file_name: file_name || undefined,
                                      action: "submit",
                                    }),
                                  });
                                  const result = await res.json();
                                  if (!res.ok) throw new Error(result.message || "Submit failed");
                                  setQuestionBankTasks((prev) => prev.map((t) => (t.course_id === task.course_id ? { ...t, ...result, status: "submitted" } : t)));
                                  setExpandTaskId(null);
                                  setTaskForm({ title: "", content: "", file_url: "" });
                                  setTaskFile(null);
                                } catch (e) {
                                  alert(e.message || "Failed to submit");
                                } finally {
                                  setSubmittingTaskId(null);
                                }
                              }}
                            >
                              {submittingTaskId === task.course_id ? "Submitting…" : "Import & post (submit to admin)"}
                            </button>
                            <button
                              type="button"
                              className="ud-btn-secondary"
                              disabled={submittingTaskId !== null}
                              onClick={async () => {
                                setSubmittingTaskId(task.course_id);
                                let file_url = taskForm.file_url;
                                if (taskFile) {
                                  const form = new FormData();
                                  form.append("file", taskFile);
                                  const up = await fetch(`${API_BASE}/api/upload`, { method: "POST", headers: authHeaders, body: form });
                                  const upData = await up.json();
                                  if (up.ok) file_url = upData.url?.startsWith("http") ? upData.url : `${API_BASE}${upData.url}`;
                                }
                                try {
                                  const res = await fetch(`${API_BASE}/api/question-banks`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", ...authHeaders },
                                    body: JSON.stringify({
                                      course_id: task.course_id,
                                      title: taskForm.title,
                                      content: taskForm.content,
                                      file_url: file_url || taskForm.file_url,
                                      action: "draft",
                                    }),
                                  });
                                  const result = await res.json();
                                  if (!res.ok) throw new Error(result.message || "Save failed");
                                  setQuestionBankTasks((prev) => prev.map((t) => (t.course_id === task.course_id ? { ...t, ...result, status: "draft" } : t)));
                                  setExpandTaskId(null);
                                  setTaskForm({ title: "", content: "", file_url: "" });
                                  setTaskFile(null);
                                } catch (e) {
                                  alert(e.message || "Failed to save draft");
                                } finally {
                                  setSubmittingTaskId(null);
                                }
                              }}
                            >
                              Save as draft
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {!(mentees?.length || ward_students?.length || leave_requests_to_approve?.length || assigned_courses?.length || questionBankTasks?.length) && (
          <p className="ud-empty">No data to show for your roles. Ask admin to assign you mentees, wards, or courses and to grant the right accesses for your role(s).</p>
        )}

        <ChatModal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          title="Messages from Admin"
        />
      </main>
    </div>
  );
}
