import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, ExternalLink, UserRound } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const initialForm = {
  topic: "",
  facultyName: "",
  date: "",
  googleClassroomLink: "",
};

export default function CreateClassroomTask() {
  const localFacultyName = (localStorage.getItem("name") || localStorage.getItem("userName") || "").trim();
  const localUserId = (localStorage.getItem("userId") || "").trim();
  const [form, setForm] = useState({ ...initialForm, facultyName: localFacultyName });
  const [createdTasks, setCreatedTasks] = useState([]);
  const [loadingCreated, setLoadingCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.topic.trim() &&
      form.facultyName.trim() &&
      form.date &&
      form.googleClassroomLink.trim()
    );
  }, [form]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadCreatedTasks = async () => {
    const facultyName = (form.facultyName || localFacultyName || "").trim();
    if (!facultyName && !localUserId) {
      setCreatedTasks([]);
      return;
    }
    setLoadingCreated(true);
    try {
      const params = new URLSearchParams();
      if (facultyName) params.set("facultyName", facultyName);
      if (localUserId) params.set("createdByUserId", localUserId);
      const res = await axios.get(`${API_BASE}/api/tasks?${params.toString()}`);
      setCreatedTasks(Array.isArray(res.data) ? res.data : []);
    } catch (_) {
      setCreatedTasks([]);
    } finally {
      setLoadingCreated(false);
    }
  };

  useEffect(() => {
    loadCreatedTasks();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await axios.post(`${API_BASE}/api/tasks`, {
        topic: form.topic.trim(),
        facultyName: form.facultyName.trim(),
        date: form.date,
        googleClassroomLink: form.googleClassroomLink.trim(),
        createdByUserId: localUserId || undefined,
      });
      setMessage("Task published successfully.");
      setForm((prev) => ({ ...initialForm, facultyName: prev.facultyName || localFacultyName }));
      loadCreatedTasks();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to publish task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-card">
      <h3 className="card-title">Create Classroom Task</h3>
      <p className="card-subtitle">Publish daily classroom tasks with a Google Classroom redirect link.</p>

      <form
        onSubmit={handlePublish}
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Topic</span>
          <input
            className="sa-input"
            type="text"
            placeholder="e.g. Arrays - Prefix Sum"
            value={form.topic}
            onChange={(e) => onChange("topic", e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Faculty Name</span>
          <input
            className="sa-input"
            type="text"
            placeholder="e.g. Dr. Kumar"
            value={form.facultyName}
            onChange={(e) => onChange("facultyName", e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Date</span>
          <input
            className="sa-input"
            type="date"
            value={form.date}
            onChange={(e) => onChange("date", e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Google Classroom Link</span>
          <input
            className="sa-input"
            type="url"
            placeholder="https://classroom.google.com/..."
            value={form.googleClassroomLink}
            onChange={(e) => onChange("googleClassroomLink", e.target.value)}
            required
          />
        </label>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
          <button type="submit" className="sa-btn sa-btn-primary" disabled={!canSubmit || submitting}>
            {submitting ? "Publishing..." : "Publish Task"}
          </button>
          {message && <span style={{ color: "#15803d", fontWeight: 600 }}>{message}</span>}
          {error && <span style={{ color: "#b91c1c", fontWeight: 600 }}>{error}</span>}
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <h4 style={{ margin: 0, color: "#0f172a", fontSize: 16, fontWeight: 800 }}>Your Created Classrooms</h4>
        <p style={{ margin: "6px 0 12px", color: "#64748b", fontSize: 13 }}>
          Open and revisit any classroom you created.
        </p>
        {loadingCreated ? (
          <div className="sa-muted">Loading classrooms...</div>
        ) : createdTasks.length === 0 ? (
          <div className="sa-muted">No classrooms created yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
            {createdTasks.map((task) => (
              <article
                key={task.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  background: "#fff",
                  padding: 14,
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{task.topic}</div>
                <div style={{ marginTop: 8, display: "grid", gap: 6, color: "#475569", fontSize: 13 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <UserRound size={14} />
                    {task.facultyName}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CalendarDays size={14} />
                    {new Date(task.date).toLocaleDateString()}
                  </span>
                </div>
                <button
                  type="button"
                  className="sa-btn sa-btn-sm sa-btn-primary"
                  style={{ marginTop: 10 }}
                  onClick={() => window.open(task.googleClassroomLink, "_blank", "noopener,noreferrer")}
                >
                  Open Classroom
                  <ExternalLink size={14} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

