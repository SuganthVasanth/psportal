import React, { useState, useEffect, useMemo } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { Search, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import "./CoursesAvailable.css";

const API_BASE = "http://localhost:5000";

const MOCK_PROFILE = {
  register_no: "7376231CS323",
  name: "SUGANTH R",
  avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
};

export default function CoursesAvailable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [psCourses, setPsCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);
  const [openAccordion, setOpenAccordion] = useState({});

  const registerNo = localStorage.getItem("register_no") || MOCK_PROFILE.register_no;
  const token = localStorage.getItem("token");

  const fetchPsCourses = () => {
    fetch(`${API_BASE}/api/ps-courses?status=Active`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPsCourses(Array.isArray(data) ? data : []))
      .catch(() => setPsCourses([]));
  };

  const fetchEnrollments = () => {
    if (!token) return;
    const studentId = registerNo;
    fetch(`${API_BASE}/api/enrollments/my?studentId=${encodeURIComponent(studentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const ids = new Set((Array.isArray(data) ? data : []).map((e) => e.courseId).filter(Boolean));
        setEnrolledIds(ids);
      })
      .catch(() => setEnrolledIds(new Set()));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPsCourses();
    fetchEnrollments();
    setLoading(false);
  }, [token]);

  const grouped = useMemo(() => {
    const filtered = psCourses.filter(
      (c) =>
        !searchTerm ||
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.parentCourse || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const bySubject = {};
    filtered.forEach((c) => {
      const key = c.parentCourse || "Other";
      if (!bySubject[key]) bySubject[key] = [];
      bySubject[key].push(c);
    });
    Object.keys(bySubject).forEach((k) => bySubject[k].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
    return bySubject;
  }, [psCourses, searchTerm]);

  const handleRegister = async (courseId) => {
    setRegisteringId(courseId);
    try {
      const res = await fetch(`${API_BASE}/api/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ courseId, studentId: registerNo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Enrollment failed");
      fetchEnrollments();
      setToast({ type: "success", text: "Enrolled successfully!" });
    } catch (e) {
      setToast({ type: "error", text: e.message || "Could not enroll" });
    } finally {
      setRegisteringId(null);
    }
    setTimeout(() => setToast(null), 3000);
  };

  const subjectKeys = Object.keys(grouped).sort();

  return (
    <div className="dashboard-layout">
      <header className="top-navbar">
        <div className="top-nav-brand">
          <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          <span>PCDP Portal</span>
        </div>
        <div className="top-nav-profile">
          <img src={MOCK_PROFILE.avatarUrl} alt="Profile" className="profile-avatar" />
          <div className="profile-info">
            <span className="profile-id">{registerNo}</span>
            <span className="profile-name">{MOCK_PROFILE.name}</span>
          </div>
        </div>
      </header>

      <StudentSidebar />

      <main className="dashboard-main-area">
        <div className="courses-container">
          <div className="page-header">
            <h1 className="page-title">Courses Available</h1>
            <p className="page-subtitle">
              {loading ? "Loading…" : error ? error : `Active courses by subject (${psCourses.length} total)`}
            </p>
          </div>

          <div className="filters-card">
            <div className="courses-filters-section">
              <div className="search-bar-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name or subject..."
                  className="courses-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {toast && (
            <div className={`courses-toast courses-toast-${toast.type}`} role="alert">
              {toast.text}
            </div>
          )}

          {loading ? (
            <div className="courses-loading">Loading courses…</div>
          ) : subjectKeys.length === 0 ? (
            <div className="courses-empty">No active courses. Admins can add courses in the dashboard.</div>
          ) : (
            <div className="ps-courses-accordion">
              {subjectKeys.map((subject) => {
                const courses = grouped[subject];
                const isOpen = openAccordion[subject] !== false;
                return (
                  <div key={subject} className="ps-accordion-group">
                    <button
                      type="button"
                      className="ps-accordion-head"
                      onClick={() => setOpenAccordion((prev) => ({ ...prev, [subject]: !prev[subject] }))}
                    >
                      {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <span>{subject}</span>
                      <span className="ps-accordion-count">({courses.length})</span>
                    </button>
                    {isOpen && (
                      <div className="ps-accordion-body">
                        <div className="courses-grid">
                          {courses.map((course) => {
                            const enrolled = enrolledIds.has(course.id);
                            const busy = registeringId === course.id;
                            return (
                              <div className="course-card ps-course-card" key={course.id}>
                                <div className="course-image-placeholder" style={{ minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <BookOpen size={40} style={{ color: "#cbd5e0" }} />
                                </div>
                                <div className="course-content">
                                  <h3 className="course-title">{course.name}</h3>
                                  <p className="course-desc-snippet">{(course.description || "").slice(0, 80)}{(course.description || "").length > 80 ? "…" : ""}</p>
                                  <div className="course-progress-container">
                                    {enrolled ? (
                                      <span className="ps-enrolled-badge">Enrolled</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="action-button"
                                        disabled={busy}
                                        onClick={() => handleRegister(course.id)}
                                      >
                                        {busy ? "Registering…" : "Register Now"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
