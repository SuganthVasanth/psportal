import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { Search, BookOpen } from "lucide-react";

const API_BASE = "http://localhost:5000";

const MOCK_PROFILE = { register_no: "Unknown" };

export default function CoursesAvailable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelCourses, setLevelCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

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

  const filteredLevelCourses = useMemo(() => {
    const term = (searchTerm || "").toLowerCase();
    let list = levelCourses;
    if (activeFilter !== "All") {
      list = list.filter((c) => String(c.type || "Specialization").toLowerCase() === activeFilter.toLowerCase());
    }
    if (!term) return list;
    return list.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const type = (c.type || "").toLowerCase();
      return name.includes(term) || type.includes(term);
    });
  }, [levelCourses, searchTerm, activeFilter]);

  const CourseCard = ({ course }) => {
    const colorMap = {
      Advanced: { bg: "rgba(99,102,241,0.1)", color: "#6366f1", emoji: "🚀" },
      Mechanical: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", emoji: "⚙️" },
      "Analog Electronics": { bg: "rgba(16,185,129,0.1)", color: "#10b981", emoji: "⚡" },
      Electronics: { bg: "rgba(99,102,241,0.1)", color: "#6366f1", emoji: "🔌" },
      AE: { bg: "rgba(236,72,153,0.1)", color: "#ec4899", emoji: "📡" },
      Aptitude: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", emoji: "🧠" },
      default: { bg: "rgba(99,102,241,0.08)", color: "#6366f1", emoji: "📘" },
    };
    const style = colorMap[course.name] || colorMap.default;

    return (
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
        <div className="h-[100px] flex items-center justify-center relative" style={{ background: style.bg }}>
          {course.course_logo ? (
            <img
              src={course.course_logo}
              alt={course.name}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <span className="text-4xl z-10">{style.emoji}</span>
          <span
            className="absolute top-3 right-3 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ color: style.color, background: `${style.color}20` }}
          >
            {course.type || "Specialization"}
          </span>
        </div>

        <div className="p-4 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-[#0f0e1a] leading-snug">{course.name}</h3>
            <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2">
              {course.description || `Learn the fundamentals and advanced concepts of ${course.name}.`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 mt-auto">
            <BookOpen size={14} className="text-[#9ca3af]" />
            <span className="text-xs font-medium text-[#9ca3af]">{course.levelsCount || 0} Levels</span>
          </div>

          <button
            type="button"
            className="w-full py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            onClick={() => navigate(`/course/${course.id}`)}
          >
            {enrolledIds.has(course.id) ? "Continue Learning" : "View Curriculum"}
            <span>→</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="dashboard-container-inner bg-[#f8f7ff] min-h-full">
        <div className="px-8 pt-4 pb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-extrabold text-[#0f0e1a] tracking-tight">Courses Available</h1>
              <p className="text-sm text-[#9ca3af] mt-0.5">
                {error ? error : `${levelCourses.length} courses across all specializations`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <input
                placeholder="Search courses, skills, or levels..."
                className="w-full h-10 pl-10 pr-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl text-sm text-[#374151] outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.25)] focus:border-[#6366f1] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {["All", "Specialization", "Core", "Elective"].map((f) => (
              <button
                key={f}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeFilter === f
                    ? "bg-[#6366f1] text-white"
                    : "bg-white border border-[rgba(0,0,0,0.08)] text-[#6b7280] hover:border-[#6366f1] hover:text-[#6366f1]"
                }`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {toast && (
            <div
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                toast.type === "success"
                  ? "bg-[rgba(16,185,129,0.12)] text-[#10b981]"
                  : "bg-[rgba(239,68,68,0.12)] text-[#ef4444]"
              }`}
              role="alert"
            >
              {toast.text}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-56 bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] animate-pulse" />
              ))}
            </div>
          ) : filteredLevelCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] shadow-sm py-16 flex flex-col items-center gap-3 text-center px-8">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center text-2xl">
                📘
              </div>
              <div className="text-[15px] font-semibold text-[#374151]">No courses found</div>
              <div className="text-sm text-[#9ca3af] max-w-xs">
                Try adjusting your search or filter. New courses will appear here when available.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLevelCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
