import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { Search, BookOpen, Award, Monitor, Cpu } from "lucide-react";
import "./CoursesAvailable.css";

const API_BASE = "http://localhost:5000";

const MOCK_PROFILE = {
  register_no: "7376231CS323",
  name: "SUGANTH R",
  avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
};

const getSkillIcon = (typeName) => {
  const t = (typeName || "").toLowerCase();
  if (t.includes("advanced") || t.includes("assessment")) return <Award size={14} className="skill-icon" />;
  if (t.includes("hardware")) return <Cpu size={14} className="skill-icon" />;
  if (t.includes("software") || t.includes("technical")) return <Monitor size={14} className="skill-icon" />;
  return <BookOpen size={14} className="skill-icon" />;
};

export default function CoursesAvailable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/courses`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load courses");
        return r.json();
      })
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((e) => {
        setError(e.message || "Could not load courses");
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(
    (c) =>
      !searchTerm ||
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <span className="profile-id">{MOCK_PROFILE.register_no}</span>
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
              {loading ? "Loading…" : error ? error : `Showing ${filtered.length} of ${courses.length} courses`}
            </p>
          </div>

          <div className="filters-card">
            <div className="courses-filters-section">
              <div className="search-bar-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search courses by name or category..."
                  className="courses-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-dropdowns">
                <select className="course-select">
                  <option>All Categories</option>
                </select>
                <select className="course-select">
                  <option>Sort by Name</option>
                </select>
              </div>
            </div>
            <div className="courses-tabs-wrapper">
              <div className="active-tab">
                Courses <span className="tab-badge">{courses.length}</span>
              </div>
            </div>
          </div>

          <h2 className="section-title">
            Courses <span className="title-count">({filtered.length} courses)</span>
          </h2>

          {loading ? (
            <div className="courses-loading">Loading courses…</div>
          ) : filtered.length === 0 ? (
            <div className="courses-empty">No courses available. Admins can add courses in the dashboard.</div>
          ) : (
            <div className="courses-grid">
              {filtered.map((course) => {
                const levelsCount = course.levelsCount ?? 0;
                return (
                  <Link to={`/course/${course.id}`} style={{ textDecoration: "none", color: "inherit" }} key={course.id}>
                    <div className="course-card">
                      <div className="course-image">
                        {course.course_logo ? (
                          <img src={course.course_logo} alt={course.name} />
                        ) : (
                          <div className="course-image-placeholder">
                            <BookOpen size={48} style={{ color: "#cbd5e0" }} />
                          </div>
                        )}
                      </div>
                      <div className="course-content">
                        <h3 className="course-title">{course.name}</h3>
                        <div className="course-meta">
                          <div className="meta-item">
                            <BookOpen size={14} className="meta-icon" />
                            <span>Levels: {levelsCount}</span>
                          </div>
                          <div className="meta-item skill-type">
                            {getSkillIcon(course.type)}
                            <span>{course.type || "Course"}</span>
                          </div>
                        </div>
                        <div className="course-progress-container">
                          <div className="progress-text">Click to view levels and register</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
