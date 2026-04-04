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
      <div className="group bg-white rounded-2xl border border-[#f1f1f5] overflow-hidden hover:border-[#6366f1]/20 hover:shadow-[0_20px_50px_-20px_rgba(99,102,241,0.15)] transition-all duration-300 flex flex-col h-full">
        <div className="h-[120px] flex items-center justify-center relative overflow-hidden">
          {/* Soft background glow */}
          <div 
            className="absolute inset-0 opacity-40 transition-transform duration-500 group-hover:scale-110" 
            style={{ background: `radial-gradient(circle at center, ${style.color}33 0%, transparent 70%)` }}
          />
          
          {course.course_logo ? (
            <img
              src={course.course_logo}
              alt={course.name}
              className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
             <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl z-10 bg-white/80 backdrop-blur-sm shadow-sm border border-white/50">
               {style.emoji}
             </div>
          )}

          <span
            className="absolute top-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg backdrop-blur-md border"
            style={{ 
              color: style.color, 
              backgroundColor: `${style.color}15`,
              borderColor: `${style.color}25`
            }}
          >
            {course.type || "Specialization"}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-[#1a1a2e] leading-tight group-hover:text-[#6366f1] transition-colors">
              {course.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="px-2 py-0.5 rounded-md bg-[#f8f9fa] border border-[#f1f3f5] flex items-center gap-1.5">
                <BookOpen size={12} className="text-[#9ca3af]" />
                <span className="text-[11px] font-medium text-[#6b7280]">{course.levelsCount || 0} Levels</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-auto py-2.5 bg-[#6366f1]/5 hover:bg-[#6366f1] text-[#6366f1] hover:text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-[#6366f1]/10 hover:border-[#6366f1] shadow-sm hover:shadow-md"
            onClick={() => navigate(`/course/${course.id}`)}
          >
            {enrolledIds.has(course.id) ? "Continue Learning" : "View Curriculum"}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
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
                className="w-full h-11 pl-11 pr-4 bg-white border border-[#f1f1f5] rounded-2xl text-sm text-[#374151] placeholder:text-[#9ca3af] outline-none focus:ring-4 focus:ring-[#6366f1]/5 focus:border-[#6366f1]/30 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {["All", "Specialization", "Core", "Elective"].map((f) => (
              <button
                key={f}
                className={`px-5 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-sm ${
                  activeFilter === f
                    ? "bg-[#6366f1] text-white shadow-[#6366f1]/20 shadow-lg"
                    : "bg-white border border-[#f1f1f5] text-[#6b7280] hover:border-[#6366f1]/20 hover:text-[#6366f1] hover:shadow-md"
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
                <div key={i} className="h-64 bg-white rounded-3xl border border-[#f1f1f5] animate-pulse shadow-sm" />
              ))}
            </div>
          ) : filteredLevelCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#f1f1f5] shadow-sm py-20 flex flex-col items-center gap-4 text-center px-10">
              <div className="w-20 h-20 rounded-3xl bg-[#f8f7ff] flex items-center justify-center text-3xl shadow-inner border border-white">
                📘
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-[#1a1a2e]">No results found</h3>
                <p className="text-sm text-[#9ca3af] max-w-xs mx-auto">
                  We couldn't find any courses matching "{searchTerm}". Try adjusting your filters or search terms.
                </p>
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
