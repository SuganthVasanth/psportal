import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BookOpenCheck, ExternalLink, CalendarDays, UserRound, ClipboardList } from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingTaskId, setWorkingTaskId] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const registerNo = (localStorage.getItem("register_no") || "").trim();
  const studentName = (localStorage.getItem("name") || "").trim();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (!showAll) params.set("today", "true");
        if (registerNo) params.set("register_no", registerNo);
        const res = await axios.get(`${API_BASE}/api/tasks?${params.toString()}`);
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setTasks(list);
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || "Failed to load daily tasks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [registerNo, showAll]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks]);
  const completedCount = useMemo(
    () => sortedTasks.filter((task) => task.isRegistered).length,
    [sortedTasks]
  );
  const pendingCount = Math.max(0, sortedTasks.length - completedCount);
  const todayTasksCount = sortedTasks.filter((task) => {
    const d = new Date(task.date);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;
  const upcomingTasks = sortedTasks.filter((task) => new Date(task.date).getTime() > Date.now()).slice(0, 5);

  const openClassroom = async (task) => {
    const link = task?.googleClassroomLink;
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const enrollTask = async (task) => {
    if (!registerNo || !task?.id) return;
    setWorkingTaskId(task.id);
    try {
      await axios.post(`${API_BASE}/api/tasks/${task.id}/register`, {
        register_no: registerNo,
        studentName,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isRegistered: true } : t)));
    } catch (_) {
      // Keep UI unchanged if enroll fails.
    } finally {
      setWorkingTaskId("");
    }
  };

  return (
    <StudentLayout>
      <div className="dashboard-container-inner bg-[#f8f7ff] min-h-full">
        <div className="px-8 pt-7 pb-8 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-extrabold text-[#0f0e1a] tracking-tight">Daily Tasks</h1>
              <p className="text-sm text-[#9ca3af] mt-0.5">
                {showAll ? "Showing all classroom tasks from faculty" : "Showing today's tasks from faculty"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-[#6b7280] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="w-4 h-4 rounded accent-[#2563eb]"
              />
              Show all tasks
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] p-5 shadow-sm">
              <div className="text-2xl font-extrabold text-[#0f0e1a]">{todayTasksCount}</div>
              <div className="text-xs text-[#9ca3af] mt-1 font-medium">Tasks Today</div>
            </div>
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] p-5 shadow-sm">
              <div className="text-2xl font-extrabold text-[#10b981]">{completedCount}</div>
              <div className="text-xs text-[#9ca3af] mt-1 font-medium">Completed</div>
            </div>
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] p-5 shadow-sm">
              <div className="text-2xl font-extrabold text-[#f59e0b]">{pendingCount}</div>
              <div className="text-xs text-[#9ca3af] mt-1 font-medium">Pending</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.05)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(37,99,235,0.1)] flex items-center justify-center text-[#2563eb]">
                <ClipboardList size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0f0e1a]">Daily Classroom Tasks</div>
                <div className="text-xs text-[#9ca3af]">Showing today's tasks from faculty</div>
              </div>
            </div>

            {loading && (
              <div className="py-16 flex flex-col items-center gap-3 text-center px-8">
                <div className="text-sm text-[#9ca3af]">Loading daily tasks...</div>
              </div>
            )}
            {!loading && error && (
              <div className="py-12 px-8 text-sm text-red-600 font-medium">{error}</div>
            )}

            {!loading && !error && sortedTasks.length === 0 && (
              <div className="py-16 flex flex-col items-center gap-3 text-center px-8">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(37,99,235,0.08)] flex items-center justify-center text-2xl">
                  📋
                </div>
                <div className="text-[15px] font-semibold text-[#374151]">No tasks for today</div>
                <div className="text-sm text-[#9ca3af] max-w-xs">
                  Your faculty hasn't published any classroom tasks yet. Check back later or browse your courses.
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/courses-available")}
                  className="mt-2 px-5 py-2 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-colors"
                >
                  Browse Courses
                </button>
              </div>
            )}

            {!loading && !error && sortedTasks.length > 0 && (
              <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                {sortedTasks.map((task) => (
                  <article className="px-6 py-4 flex flex-col gap-3" key={task.id}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-bold text-[#0f0e1a]">{task.topic}</h3>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          task.isRegistered
                            ? "bg-[rgba(16,185,129,0.12)] text-[#10b981]"
                            : "bg-[rgba(37,99,235,0.1)] text-[#2563eb]"
                        }`}
                      >
                        {task.isRegistered ? "Enrolled" : "Today"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                      <span className="flex items-center gap-1.5">
                        <UserRound size={14} />
                        {task.facultyName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {new Date(task.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => enrollTask(task)}
                        disabled={task.isRegistered || workingTaskId === task.id || !registerNo}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-[rgba(37,99,235,0.1)] text-[#2563eb] border border-[rgba(37,99,235,0.25)] disabled:opacity-60"
                      >
                        {task.isRegistered ? "Enrolled" : workingTaskId === task.id ? "Enrolling..." : "Enroll"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openClassroom(task)}
                        className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
                      >
                        Open Classroom
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] shadow-sm p-6">
            <div className="text-sm font-bold text-[#0f0e1a] mb-4">Upcoming Deadlines</div>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-[#9ca3af]">No upcoming deadlines yet.</p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div
                    key={`${task.id}-upcoming`}
                    className="flex items-center justify-between rounded-xl border border-[rgba(0,0,0,0.06)] px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#0f0e1a]">{task.topic}</div>
                      <div className="text-xs text-[#9ca3af]">{task.facultyName}</div>
                    </div>
                    <div className="text-xs font-medium text-[#6b7280]">
                      {new Date(task.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
