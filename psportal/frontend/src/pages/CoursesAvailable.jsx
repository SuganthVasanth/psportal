import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { Search, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import "./CoursesAvailable.css";

const API_BASE = "http://localhost:5000";

export default function CoursesAvailable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [psCourses, setPsCourses] = useState([]);
  const [levelCourses, setLevelCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);
  const [openAccordion, setOpenAccordion] = useState({});

  const registerNo = localStorage.getItem("register_no") || MOCK_PROFILE.register_no;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
    fetch(`${API_BASE}/api/courses`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setLevelCourses(Array.isArray(data) ? data : []))
      .catch(() => setLevelCourses([]))
      .finally(() => setLoading(false));
  }, [token]);

  const grouped = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    const filtered = psCourses.filter(
      (c) =>
        !term ||
        (c.name || "").toLowerCase().includes(term) ||
        (c.parentCourse || "").toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term)
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

  const filteredLevelCourses = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    if (!term) return levelCourses;
    return levelCourses.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const type = (c.type || "").toLowerCase();
      return name.includes(term) || type.includes(term);
    });
  }, [levelCourses, searchTerm]);

  return (
    <StudentLayout>
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
          ) : filteredLevelCourses.length === 0 && subjectKeys.length === 0 ? (
            <div className="courses-empty">No active courses. Admins can add courses in the dashboard.</div>
          ) : (
            <>
            {filteredLevelCourses.length > 0 && (
              <section className="courses-section">
                <h2 className="page-title" style={{ fontSize: 18, marginBottom: 8 }}>Level-based courses</h2>
                <p className="page-subtitle" style={{ marginBottom: 16 }}>Click a course to view levels and register.</p>
                <div className="courses-grid">
                  {filteredLevelCourses.map((course) => (
                    <div className="course-card ps-course-card" key={course.id}>
                      <div className="course-image-placeholder" style={{ minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={40} style={{ color: "#cbd5e0" }} />
                      </div>
                      <div className="course-content">
                        <h3 className="course-title">{course.name}</h3>
                        <p className="course-desc-snippet">
                          {course.type ? `${course.type} • ` : ""}{course.levelsCount != null ? `${course.levelsCount} level${course.levelsCount === 1 ? "" : "s"}` : ""}
                        </p>
                        <div className="course-progress-container">
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => navigate(`/course/${course.id}`)}
                          >
                            View levels &amp; register
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {subjectKeys.length > 0 && (
            <div className="ps-courses-accordion" style={{ marginTop: 32 }}>
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
            </>
          )}
      </div>
    </StudentLayout>
  );
}
