import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, ChevronDown, ChevronRight, ChevronLeft, MessageCircle, X, Maximize2, Search, History, ListTodo } from "lucide-react";
import ChatModal from "../components/ChatModal";
import TemplateQuestionForm from "../components/renderer/TemplateQuestionForm";

const API_BASE = "http://localhost:5000";

const TASK_TAB_PENDING = "pending";
const TASK_TAB_HISTORY = "history";

const SORT_RECENT = "recent";
const SORT_NAME_ASC = "name_asc";
const SORT_NAME_DESC = "name_desc";
const SORT_STATUS = "status";

export default function FacultyDashboard({ data, has, authHeaders }) {
  const [questionBankTasks, setQuestionBankTasks] = useState([]);
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [expandTaskId, setExpandTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: "", content: "", file_url: "" });
  const [taskFile, setTaskFile] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fullScreenTask, setFullScreenTask] = useState(null);
  const [fullScreenQuestionValues, setFullScreenQuestionValues] = useState({});
  const [fullScreenQuestionIndex, setFullScreenQuestionIndex] = useState(1);
  const [fullScreenSaving, setFullScreenSaving] = useState(false);
  const [fullScreenSubmitting, setFullScreenSubmitting] = useState(false);
  const [draftQuestionValuesByCourse, setDraftQuestionValuesByCourse] = useState({});
  const [fullScreenDraftStorageKey, setFullScreenDraftStorageKey] = useState("");
  const [taskTab, setTaskTab] = useState(TASK_TAB_PENDING);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskSort, setTaskSort] = useState(SORT_RECENT);

  const { user, assigned_courses } = data || {};
  const showFaculty = has("faculty.courses_assigned") || has("faculty.question_bank") || (assigned_courses?.length > 0);

  const getDraftStorageKey = (courseId, templateId) => {
    const userId = data?.user?.id || "unknown";
    return `qbDraft:${userId}:${courseId}:${templateId || "no_template"}`;
  };

  const loadDraftFromStorage = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) {
      return null;
    }
  };

  const saveDraftToStorage = (key, value) => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(value || {}));
    } catch (_) {}
  };

  const clearDraftInStorage = (key) => {
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  };

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

  const allTasks = questionBankTasks?.length ? questionBankTasks : (assigned_courses || []).map((c) => ({ course_id: c.id, course_name: c.name, status: "not_started" }));

  const isCompleted = (task) => task.status === "approved" || task.status === "rejected";
  const pendingTasks = useMemo(() => allTasks.filter((t) => !isCompleted(t)), [allTasks]);
  const historyTasks = useMemo(() => allTasks.filter(isCompleted), [allTasks]);

  const tasksForTab = taskTab === TASK_TAB_HISTORY ? historyTasks : pendingTasks;
  const searchLower = (taskSearch || "").trim().toLowerCase();
  const filteredTasks = useMemo(() => {
    if (!searchLower) return tasksForTab;
    return tasksForTab.filter(
      (t) =>
        (t.course_name || "").toLowerCase().includes(searchLower) ||
        (t.template_name || "").toLowerCase().includes(searchLower)
    );
  }, [tasksForTab, searchLower]);

  const getTaskDate = (task) => {
    const d = task.updated_at || task.submitted_at || task.created_at;
    return d ? new Date(d).getTime() : 0;
  };

  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    if (taskSort === SORT_RECENT) {
      list.sort((a, b) => getTaskDate(b) - getTaskDate(a));
    } else if (taskSort === SORT_NAME_ASC) {
      list.sort((a, b) => (a.course_name || "").localeCompare(b.course_name || ""));
    } else if (taskSort === SORT_NAME_DESC) {
      list.sort((a, b) => (b.course_name || "").localeCompare(a.course_name || ""));
    } else if (taskSort === SORT_STATUS) {
      list.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
    }
    return list;
  }, [filteredTasks, taskSort]);

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
        {!allTasks.length ? (
          <p className="ud-empty">No courses assigned yet. Courses from Admin → Course details (Faculty) or Assign Faculty will appear here.</p>
        ) : (
          <>
            <div className="ud-task-toolbar" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div className="ud-task-tabs" style={{ display: "flex", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setTaskTab(TASK_TAB_PENDING)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: taskTab === TASK_TAB_PENDING ? "#ede9fe" : "#fff",
                    color: taskTab === TASK_TAB_PENDING ? "#5b21b6" : "#475569",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <ListTodo size={16} />
                  Pending ({pendingTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskTab(TASK_TAB_HISTORY)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: taskTab === TASK_TAB_HISTORY ? "#ede9fe" : "#fff",
                    color: taskTab === TASK_TAB_HISTORY ? "#5b21b6" : "#475569",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <History size={16} />
                  History ({historyTasks.length})
                </button>
              </div>
              <div className="ud-task-search" style={{ flex: "1 1 200px", minWidth: 200, maxWidth: 320 }}>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search by course or template..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 36px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
              <div className="ud-task-sort" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label htmlFor="ud-sort-select" style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Sort:</label>
                <select
                  id="ud-sort-select"
                  value={taskSort}
                  onChange={(e) => setTaskSort(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value={SORT_RECENT}>Recently added (newest first)</option>
                  <option value={SORT_NAME_ASC}>Course name (A–Z)</option>
                  <option value={SORT_NAME_DESC}>Course name (Z–A)</option>
                  <option value={SORT_STATUS}>Status</option>
                </select>
              </div>
            </div>
            <div className="ud-task-list">
            {sortedTasks.length === 0 ? (
              <p className="ud-empty">
                {taskSearch.trim() ? "No tasks match your search." : taskTab === TASK_TAB_HISTORY ? "No completed or rejected tasks yet." : "No pending tasks."}
              </p>
            ) : (
            sortedTasks.map((task) => {
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
                      {task.template_name && (
                        <span className="ud-task-meta" style={{ marginLeft: 8 }}>({task.template_name})</span>
                      )}
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
                    <div className="ud-task-head-right" onClick={(e) => e.stopPropagation()}>
                      {canEdit && task.template_id && (
                        <button
                          type="button"
                          className="ud-btn-primary"
                          style={{ marginRight: 8 }}
                          onClick={() => {
                            setFullScreenTask(task);
                            setFullScreenQuestionIndex(1);
                            const storageKey = getDraftStorageKey(task.course_id, task.template_id);
                            setFullScreenDraftStorageKey(storageKey);
                            const fromSaved = (task.questions || []).reduce(
                              (acc, q) => {
                                acc[q.questionNumber] = q.value || {};
                                return acc;
                              },
                              {}
                            );
                            const draft = draftQuestionValuesByCourse[task.course_id];
                            const fromStorage = loadDraftFromStorage(storageKey);
                            setFullScreenQuestionValues(
                              (fromStorage && Object.keys(fromStorage).length > 0)
                                ? fromStorage
                                : (draft && Object.keys(draft).length > 0 ? draft : fromSaved)
                            );
                          }}
                        >
                          <Maximize2 size={16} style={{ marginRight: 4, verticalAlign: "middle" }} />
                          Work on question bank
                        </button>
                      )}
                      {canEdit && <span className="ud-task-cta">{isExpanded ? "Close" : "Complete / Import & post"}</span>}
                    </div>
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
            }) )}
          </div>
          </>
        )}
      </section>

      {/* Full-screen question bank (template-based) */}
      {fullScreenTask && fullScreenTask.template_id && (
        <div
          className="ud-fullscreen-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <header
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>
              {fullScreenTask.course_name} — Question bank ({fullScreenTask.template_name || "Template"})
            </h2>
            <button
              type="button"
              onClick={() => {
                if (fullScreenTask?.course_id) {
                  setDraftQuestionValuesByCourse((prev) => ({ ...prev, [fullScreenTask.course_id]: fullScreenQuestionValues }));
                }
                saveDraftToStorage(fullScreenDraftStorageKey, fullScreenQuestionValues);
                setFullScreenTask(null);
                setFullScreenQuestionValues({});
                setFullScreenQuestionIndex(1);
                setFullScreenDraftStorageKey("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              <X size={18} /> Close
            </button>
          </header>
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 24,
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {(() => {
              const total = Math.max(1, fullScreenTask.question_count || 1);
              const num = fullScreenQuestionIndex;
              return (
                <div style={{ maxWidth: "100%", width: "100%" }}>
                  <h3 style={{ margin: "0 0 20px", fontSize: 18, color: "#1e293b", fontWeight: 600 }}>
                    Question {num} of {total}
                  </h3>
                  <div
                    style={{
                      padding: 28,
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fff",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <TemplateQuestionForm
                      templateId={fullScreenTask.template_id}
                      value={fullScreenQuestionValues[num] || {}}
                      onChange={(v) => {
                        setFullScreenQuestionValues((prev) => {
                          const next = { ...prev, [num]: v };
                          saveDraftToStorage(fullScreenDraftStorageKey, next);
                          return next;
                        });
                      }}
                      readOnly={false}
                      componentPrefix={`q${num}`}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
          <footer
            style={{
              flexShrink: 0,
              padding: "14px 24px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setFullScreenQuestionIndex((i) => Math.max(1, i - 1))}
                disabled={fullScreenQuestionIndex <= 1}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: fullScreenQuestionIndex <= 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  color: fullScreenQuestionIndex <= 1 ? "#94a3b8" : "#475569",
                  opacity: fullScreenQuestionIndex <= 1 ? 0.7 : 1,
                }}
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
                {fullScreenQuestionIndex} / {Math.max(1, fullScreenTask.question_count || 1)}
              </span>
              <button
                type="button"
                onClick={() => setFullScreenQuestionIndex((i) => Math.min(Math.max(1, fullScreenTask.question_count || 1), i + 1))}
                disabled={fullScreenQuestionIndex >= Math.max(1, fullScreenTask.question_count || 1)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: fullScreenQuestionIndex >= Math.max(1, fullScreenTask.question_count || 1) ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  color: fullScreenQuestionIndex >= Math.max(1, fullScreenTask.question_count || 1) ? "#94a3b8" : "#475569",
                  opacity: fullScreenQuestionIndex >= Math.max(1, fullScreenTask.question_count || 1) ? 0.7 : 1,
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                if (fullScreenTask?.course_id) {
                  setDraftQuestionValuesByCourse((prev) => ({ ...prev, [fullScreenTask.course_id]: fullScreenQuestionValues }));
                }
                saveDraftToStorage(fullScreenDraftStorageKey, fullScreenQuestionValues);
                setFullScreenTask(null);
                setFullScreenQuestionValues({});
                setFullScreenQuestionIndex(1);
                setFullScreenDraftStorageKey("");
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={fullScreenSaving || fullScreenSubmitting}
              onClick={async () => {
                if (!fullScreenTask?.course_id || !authHeaders?.Authorization) return;
                setFullScreenSaving(true);
                try {
                  const questions = Array.from({ length: Math.max(1, fullScreenTask.question_count || 1) }, (_, i) => i + 1).map((num) => ({
                    questionNumber: num,
                    template_id: fullScreenTask.template_id,
                    value: fullScreenQuestionValues[num] || {},
                  }));
                  const res = await fetch(`${API_BASE}/api/question-banks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeaders },
                    body: JSON.stringify({
                      course_id: fullScreenTask.course_id,
                      title: fullScreenTask.course_name,
                      content: "",
                      action: "draft",
                      questions,
                    }),
                  });
                  const result = await res.json();
                  if (!res.ok) throw new Error(result.message || "Save failed");
                  setQuestionBankTasks((prev) => prev.map((t) => (t.course_id === fullScreenTask.course_id ? { ...t, ...result, status: "draft", questions } : t)));
                  setDraftQuestionValuesByCourse((prev) => ({ ...prev, [fullScreenTask.course_id]: fullScreenQuestionValues }));
                  saveDraftToStorage(fullScreenDraftStorageKey, fullScreenQuestionValues);
                  alert("Draft saved. You can continue editing or submit when ready.");
                } catch (e) {
                  alert(e.message || "Failed to save draft");
                } finally {
                  setFullScreenSaving(false);
                }
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #64748b",
                background: "#fff",
                cursor: fullScreenSaving || fullScreenSubmitting ? "not-allowed" : "pointer",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              {fullScreenSaving ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              className="ud-btn-primary"
              disabled={fullScreenSaving || fullScreenSubmitting}
              onClick={async () => {
                if (!fullScreenTask?.course_id || !authHeaders?.Authorization) return;
                setFullScreenSubmitting(true);
                try {
                  const questions = Array.from({ length: Math.max(1, fullScreenTask.question_count || 1) }, (_, i) => i + 1).map((num) => ({
                    questionNumber: num,
                    template_id: fullScreenTask.template_id,
                    value: fullScreenQuestionValues[num] || {},
                  }));
                  const res = await fetch(`${API_BASE}/api/question-banks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeaders },
                    body: JSON.stringify({
                      course_id: fullScreenTask.course_id,
                      title: fullScreenTask.course_name,
                      content: "",
                      action: "submit",
                      questions,
                    }),
                  });
                  const result = await res.json();
                  if (!res.ok) throw new Error(result.message || "Submit failed");
                  setQuestionBankTasks((prev) => prev.map((t) => (t.course_id === fullScreenTask.course_id ? { ...t, ...result, status: "submitted", questions } : t)));
                  setDraftQuestionValuesByCourse((prev) => {
                    const next = { ...prev };
                    delete next[fullScreenTask.course_id];
                    return next;
                  });
                  clearDraftInStorage(fullScreenDraftStorageKey);
                  setFullScreenTask(null);
                  setFullScreenQuestionValues({});
                  setFullScreenQuestionIndex(1);
                  setFullScreenDraftStorageKey("");
                } catch (e) {
                  alert(e.message || "Failed to submit");
                } finally {
                  setFullScreenSubmitting(false);
                }
              }}
            >
              {fullScreenSubmitting ? "Submitting…" : "Submit to admin"}
            </button>
            </div>
          </footer>
        </div>
      )}

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} title="Messages from Admin" />
    </div>
  );
}
