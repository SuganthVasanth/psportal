import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { Search, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import "./CoursesAvailable.css";

const API_BASE = "http://localhost:5000";

const MOCK_PROFILE = { register_no: "Unknown" };

export default function CoursesAvailable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelCourses, setLevelCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [registeringId, setRegisteringId] = useState(null);

  const registerNo = localStorage.getItem("register_no") || MOCK_PROFILE.register_no;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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
    fetchEnrollments();
    fetch(`${API_BASE}/api/courses`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setLevelCourses(Array.isArray(data) ? data : []))
      .catch(() => setLevelCourses([]))
      .finally(() => setLoading(false));
  }, [token]);

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

  const filteredLevelCourses = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    if (!term) return levelCourses;
    return levelCourses.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const type = (c.type || "").toLowerCase();
      return name.includes(term) || type.includes(term);
    });
  }, [levelCourses, searchTerm]);

  const CourseSkeleton = () => (
    <div className="skeleton-card">
      <div className="skeleton-img"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
      <div className="skeleton-text"></div>
      <div className="shimmer"></div>
    </div>
  );

  return (
    <StudentLayout>
      <div className="courses-container">
        <div className="page-header">
          <h1 className="page-title">Explore Courses</h1>
          <p className="page-subtitle">
            {error ? error : "Master new skills with our premium learning paths."}
          </p>
        </div>

        <div className="filters-card">
          <div className="search-bar-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for courses, skills, or levels..."
              className="courses-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="course-stats-overview">
             <span className="stat-badge">{filteredLevelCourses.length} Courses Available</span>
          </div>
        </div>

        {toast && (
          <div className={`courses-toast courses-toast-${toast.type}`} role="alert">
            {toast.type === "success" ? <BookOpen size={18} /> : <Search size={18} />}
            {toast.text}
          </div>
        )}

        {loading ? (
          <div className="courses-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => <CourseSkeleton key={i} />)}
          </div>
        ) : filteredLevelCourses.length === 0 ? (
          <div className="courses-empty">
            <div className="empty-icon-wrapper">
               <Search size={48} strokeWidth={1} />
            </div>
            <h3>No courses found</h3>
            <p>Try adjusting your search or check back later for new content.</p>
          </div>
        ) : (
          <section className="courses-section">
            <div className="courses-grid">
              {filteredLevelCourses.map((course) => {
                const isEnrolled = enrolledIds.has(course.id);
                return (
                  <div className={`ps-course-card ${isEnrolled ? 'ps-enrolled-card' : ''}`} key={course.id}>
                    <div className="course-image-placeholder">
                      {course.course_logo ? (
                        <img 
                          src={course.course_logo} 
                          alt={course.name} 
                          className="course-logo-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block"; // Show fallback icon
                          }}
                        />
                      ) : null}
                      <div className="fallback-icon" style={{ display: course.course_logo ? "none" : "block" }}>
                        <BookOpen size={48} strokeWidth={1.5} style={{ color: "var(--sidebar-accent)", opacity: 0.6 }} />
                      </div>
                      <span className="course-badge">{course.type || "Specialization"}</span>
                    </div>
                    
                    <div className="course-content">
                      <div className="course-header-row">
                        <h3 className="course-title">{course.name}</h3>
                        {isEnrolled && (
                          <span className="ps-enrolled-badge">
                            <BookOpen size={14} /> Enrolled
                          </span>
                        )}
                      </div>
                      
                      <p className="course-desc-snippet">
                        Learn the fundamentals and advanced concepts of {course.name}. 
                        This course includes comprehensive modules and hands-on practice.
                      </p>
                      
                      <div className="course-footer">
                        <div className="course-stats">
                          <div className="stat-item">
                            <BookOpen size={14} />
                            <span>{course.levelsCount || 0} Levels</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="action-button"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        {isEnrolled ? "Continue Learning" : "View Curriculum"}
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </StudentLayout>
  );
}
