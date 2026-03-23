import React, { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import StudentSidebar from "./StudentSidebar";
import "./StudentLayout.css";

const API_BASE = "http://localhost:5000";
const FALLBACK_PROFILE = {
  register_no: "",
  name: "Student",
  avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
};

export default function StudentLayout({ children, hideNav = false }) {
  const [profile, setProfile] = useState(FALLBACK_PROFILE);

  useEffect(() => {
    const registerNo = localStorage.getItem("register_no");
    if (registerNo) {
      setProfile((p) => ({ ...p, register_no: registerNo }));
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
    }
  }, []);

  const displayProfile = { ...FALLBACK_PROFILE, ...profile };


  return (
    <div className="dashboard-layout premium-layout">
      {!hideNav && <StudentSidebar />}
      
      <div className={`main-container-premium ${hideNav ? 'nav-hidden' : ''}`}>
        {!hideNav && (
          <header className="top-navbar-premium">
            <div className="search-bar-premium">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search for courses, practice, etc." />
            </div>

            <div className="top-nav-actions-premium">

              <button className="nav-btn-premium" title="Notifications">
                <Bell size={20} />
                <span className="badge-premium"></span>
              </button>
              
              <div className="header-profile-premium">
                 <div className="avatar-minimal-premium">
                    {displayProfile.name.split(' ').map(n => n[0]).join('')}
                 </div>
              </div>
            </div>
          </header>
        )}

        <main className="content-area-premium">
          {children}
        </main>
      </div>
    </div>
  );
}
