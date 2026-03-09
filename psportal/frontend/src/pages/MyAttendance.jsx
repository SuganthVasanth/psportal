import React, { useState, useEffect } from "react";
import StudentSidebar from "../components/StudentSidebar";
import AttendanceDetails from "../components/AttendanceDetails";
import "./MyLeaves.css";

const API_BASE = "http://localhost:5000";

export default function MyAttendance() {
  const [registerNo, setRegisterNo] = useState(() => localStorage.getItem("register_no"));
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!registerNo) {
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.register_no) {
              setRegisterNo(data.register_no);
              localStorage.setItem("register_no", data.register_no);
            }
          });
      }
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/attendance?register_no=${encodeURIComponent(registerNo)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load attendance"))))
      .then(setAttendance)
      .catch((err) => setError(err.message || "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, [registerNo]);

  return (
    <div className="dashboard-layout leaves-layout">
      <StudentSidebar />
      <main className="dashboard-main-area leaves-main">
        <div className="leaves-container">
          <div className="leaves-header">
            <h1 className="leaves-title">My Attendance</h1>
            <p className="leaves-subtitle">View your daily attendance and session-wise status.</p>
          </div>
          {loading && <div className="leaves-loading">Loading attendance…</div>}
          {error && <div className="leaves-error">{error}</div>}
          {!loading && !error && <AttendanceDetails attendance={attendance} />}
        </div>
      </main>
    </div>
  );
}
