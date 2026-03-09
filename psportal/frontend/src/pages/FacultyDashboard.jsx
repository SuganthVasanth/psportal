import React, { useState, useEffect } from "react";
import { BookOpen, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import ChatModal from "../components/ChatModal";

const API_BASE = "http://localhost:5000";

export default function FacultyDashboard({ data, has, authHeaders }) {
  const [questionBankTasks, setQuestionBankTasks] = useState([]);
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [expandTaskId, setExpandTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", content: "", file_url: "" });
  const [taskFile, setTaskFile] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { user, assigned_courses } = data || {};
  const showFaculty = has("faculty.courses_assigned") || has("faculty.question_bank") || (assigned_courses?.length > 0);

  useEffect(() => {
    if (!data?.user?.id || !authHeaders?.Authorization) return;
    const accesses = data.user.accesses || [];
    if (!accesses.includes("faculty.question_bank") && !accesses.includes("faculty.courses_assigned")) return;
    fetch(`${API_BASE}/api/question-banks/my-tasks`, { headers: authHeaders })
      .then((res) => res.json().then((p) => (res.ok ? p : { tasks: [] })))
      .then((r) => setQuestionBankTasks(r.tasks || []))
      .catch(() => setQuestionBankTasks([]));
  }, [data?.user?.id, data?.user?.accesses, authHeaders]);

  const openTaskForm = (task) => {
    const id = task.id || task.course_id;
    if (expandTaskId === id) {
      setExpandTaskId(null);
    } else {
      setExpandTaskId(id);
      setTaskForm({ title: task.title || "", content: task.content || "", file_url: task.file_url || "" });
    }
  };

  const tasks = questionBankTasks?.length ? questionBankTasks : (assigned_courses || []).map((c) => ({ course_id: c.id, course_name: c.name, status: "not_started" }));

  if (!showFaculty) {
    return (
      <div>
        <h1 className="ud-welcome">Faculty Dashboard</h1>
        <p className="ud-welcome-sub">Assigned courses and question bank tasks.</p>
        <p className="ud-empty">No courses assigned. Ask admin to assign courses and grant faculty accesses.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="ud-welcome">Faculty Dashboard</h1>
      <p className="ud-welcome-sub">Complete and submit question banks for your assigned courses.</p>

      <section className="ud-card">
        <h3 className="ud-card-title">
          <BookOpen size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Question bank tasks
        </h3>
        <p className="ud-card-subtitle">Admin will review and approve or reject. Use the chat icon to see messages from admin.</p>
        {!tasks.length ? (
          <p className="ud-empty">No courses assigned yet. Courses from Admin → Course details (Faculty) or Assign Faculty will appear here.</p>
        ) : (
          <div className="ud-task-list">
            {tasks.map((task) => {
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

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} title="Messages from Admin" />
    </div>
  );
}
