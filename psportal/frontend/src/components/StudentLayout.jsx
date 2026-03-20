import React, { useState, useEffect } from "react";
import StudentSidebar from "./StudentSidebar";
import "./StudentLayout.css";

const API_BASE = "http://localhost:5000";
const FALLBACK_PROFILE = {
  register_no: "",
  name: "Student",
  avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
};

export default function StudentLayout({ children }) {
  const [profile, setProfile] = useState(FALLBACK_PROFILE);

  useEffect(() => {
    const registerNo = localStorage.getItem("register_no");
    const token = localStorage.getItem("token");
    if (registerNo) {
      setProfile((p) => ({ ...FALLBACK_PROFILE, ...p, register_no: registerNo }));
      fetch(`${API_BASE}/api/dashboard/student?register_no=${encodeURIComponent(registerNo)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.profile) {
            setProfile((p) => ({
              ...p,
              register_no: data.profile.register_no || p.register_no,
              name: data.profile.name || p.name,
              avatarUrl: data.profile.avatarUrl || FALLBACK_PROFILE.avatarUrl,
            }));
          }
        })
        .catch(() => {});
    } else if (token) {
      fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.register_no) {
            localStorage.setItem("register_no", data.register_no);
            setProfile((p) => ({ ...p, register_no: data.register_no, name: data.name || p.name }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const displayProfile = { ...FALLBACK_PROFILE, ...profile };

  return (
    <div className="dashboard-layout student-portal-layout">
      <header className="top-navbar">
        <div className="top-nav-brand">
          <img
            src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png"
            alt="PS Portal Logo"
            style={{ width: "32px", height: "32px", objectFit: "contain" }}
          />
          <span>PCDP Portal</span>
        </div>
        <div className="top-nav-profile">
          <img src={displayProfile.avatarUrl} alt="Profile" className="profile-avatar" />
          <div className="profile-info">
            <span className="profile-id">{displayProfile.register_no || "—"}</span>
            <span className="profile-name">{displayProfile.name}</span>
          </div>
        </div>
      </header>
      <StudentSidebar />
      <main className="dashboard-main-area">
        {children}
      </main>
    </div>
  );
}
