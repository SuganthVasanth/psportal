import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  GraduationCap,
  CheckCircle2,
  Loader2,
  BookOpen,
  Play,
  AlertCircle,
} from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import "./BookSlots.css";

const API_BASE = "http://localhost:5000";

function isSlotActiveNow(slot_start_time, slot_end_time, slot_date) {
  if (!slot_start_time || !slot_end_time || !slot_date) return false;
  const now = new Date();
  const slotDate = new Date(slot_date);
  if (now.toDateString() !== slotDate.toDateString()) return false;

  const [startH, startM] = slot_start_time.split(":").map(Number);
  const [endH, endM] = slot_end_time.split(":").map(Number);

  const start = new Date(slotDate);
  start.setHours(startH, startM, 0, 0);
  const end = new Date(slotDate);
  end.setHours(endH, endM, 0, 0);

  return now >= start && now < end;
}

function isSlotExpired(slot_date, slot_end_time) {
  if (!slot_date || !slot_end_time) return false;
  const now = new Date();
  const [h, m] = slot_end_time.split(":").map(Number);
  const end = new Date(slot_date);
  end.setHours(h, m, 0, 0);
  return now > end;
}

function openSlotsCount(courseId, courseSlots) {
  const slotsData = courseSlots[courseId] || [];
  if (slotsData.cooldown) return 0;
  const slots = Array.isArray(slotsData) ? slotsData : [];
  const filtered = slots.filter((s) => {
    const endStr = s.endTime || s.timeLabel.split(" – ")[1]?.trim();
    return !isSlotExpired(s.date, endStr);
  });
  return filtered.filter((s) => s.available).length;
}

export default function BookSlots() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseSlots, setCourseSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const registerNo = localStorage.getItem("register_no");
  const studentName = localStorage.getItem("name") || "Student";
  const token = localStorage.getItem("token");

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) || (c.levelName || "").toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  useEffect(() => {
    if (!registerNo) return;

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/my-courses?register_no=${encodeURIComponent(registerNo)}`);
        const data = await res.ok ? await res.json() : [];
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [registerNo]);

  useEffect(() => {
    if (!registerNo) return;
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/my-bookings?register_no=${encodeURIComponent(registerNo)}`);
        const data = await res.ok ? await res.json() : [];
        setMyBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };
    fetchBookings();
  }, [registerNo, submitting]);

  const fetchSlotsForCourse = async (courseId) => {
    if (courseSlots[courseId]) return;

    const courseObj = courses.find((c) => c.id === courseId);
    setLoadingSlots((prev) => ({ ...prev, [courseId]: true }));
    try {
      const res = await fetch(
        `${API_BASE}/api/active-slots?course_id=${courseId}&level_index=${courseObj?.levelIndex || 0}&register_no=${encodeURIComponent(registerNo)}`
      );
      const data = await res.json();
      if (data.cooldownActive) {
        setCourseSlots((prev) => ({ ...prev, [courseId]: { cooldown: true, message: data.message } }));
      } else {
        setCourseSlots((prev) => ({ ...prev, [courseId]: Array.isArray(data) ? data : [] }));
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleDropdownToggle = (courseId) => {
    if (openDropdown === courseId) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(courseId);
      fetchSlotsForCourse(courseId);
    }
  };

  const handleSlotSelect = (courseId, slot) => {
    if (!slot.available) return;
    setSelectedSlots((prev) => ({ ...prev, [courseId]: slot }));
    setOpenDropdown(null);
  };

  const handleConfirm = async (course) => {
    const selectedSlot = selectedSlots[course.id];
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const payload = {
        register_no: registerNo,
        student_name: studentName,
        course_id: course.id,
        course_name: course.title,
        slot_id: selectedSlot.id,
        venue_label: selectedSlot.venueLabel,
        time_label: selectedSlot.timeLabel,
      };

      const res = await fetch(`${API_BASE}/api/book-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Booking confirmed successfully!");
        const updatedRes = await fetch(`${API_BASE}/api/active-slots?course_id=${course.id}`);
        const updatedData = await updatedRes.json();
        setCourseSlots((prev) => ({ ...prev, [course.id]: updatedData }));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to book slot.");
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout theme="booking" searchPlaceholder="Search courses, practice...">
        <div className="loading-state-premium">
          <Loader2 className="animate-spin" size={40} />
          <p>Loading your courses...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      theme="booking"
      searchPlaceholder="Search courses, practice..."
      headerSearch={{ value: searchQuery, onChange: setSearchQuery }}
    >
      <div className="book-slots-page">
        <header className="abk-hero">
          <h1 className="abk-hero__title">Assessment Booking</h1>
          <p className="abk-hero__subtitle">Choose a convenient slot for your registered assessments</p>
        </header>

        {courses.length === 0 ? (
          <div className="abk-empty-state">
            <BookOpen size={48} strokeWidth={1.5} />
            <h2>No registered courses</h2>
            <p>You haven&apos;t registered for any courses yet. Please register to book assessment slots.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="abk-empty-filter">No courses match your search. Try a different keyword.</div>
        ) : (
          <div className="abk-grid">
            {filteredCourses.map((course) => {
              const isLoading = loadingSlots[course.id];
              const selection = selectedSlots[course.id];
              const openCount = openSlotsCount(course.id, courseSlots);

              return (
                <article key={course.id} className="abk-card">
                  <div className="abk-card__head">
                    <div className="abk-card__icon" aria-hidden>
                      <GraduationCap size={24} strokeWidth={2} />
                    </div>
                    <span
                      className={`abk-badge ${course.completed ? "abk-badge--completed" : "abk-badge--progress"}`}
                    >
                      {course.completed ? "Completed" : "In progress"}
                    </span>
                  </div>

                  <h2 className="abk-card__title">{course.title || "Course"}</h2>
                  <p className="abk-card__category">{course.levelName || "Assessment"}</p>
                  <p className="abk-card__meta">
                    {openCount > 0 ? `${openCount} open slot${openCount === 1 ? "" : "s"}` : "Open slots will appear when available"}
                  </p>

                  <div className="abk-card__body">
                    {(() => {
                      const activeBooking = myBookings.find(
                        (b) =>
                          String(b.course_id) === String(course.id) &&
                          !isSlotExpired(b.date, b.endTime || b.time_label?.split(" – ")[1])
                      );

                      if (activeBooking) {
                        const isActive = isSlotActiveNow(
                          activeBooking.startTime,
                          activeBooking.endTime,
                          activeBooking.date
                        );
                        return (
                          <div className="abk-booked anim-fade-in">
                            <div className="abk-booked__header">
                              <CheckCircle2 size={18} strokeWidth={2.5} />
                              <span>Slot booked</span>
                            </div>
                            <div className="abk-booked__grid">
                              <div className="abk-booked__item">
                                <span className="abk-booked__label">Venue</span>
                                <span className="abk-booked__value">{activeBooking.venue_label}</span>
                              </div>
                              <div className="abk-booked__item">
                                <span className="abk-booked__label">Time</span>
                                <span className="abk-booked__value">{activeBooking.time_label}</span>
                              </div>
                              <div className="abk-booked__item">
                                <span className="abk-booked__label">Date</span>
                                <span className="abk-booked__value">
                                  {new Date(activeBooking.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {isActive && (
                              <button
                                type="button"
                                className="abk-btn-launch"
                                onClick={() => navigate(`/pre-test/${course.id}`)}
                              >
                                <Play size={18} fill="currentColor" />
                                Launch test portal
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="abk-dropdown-wrap">
                            <button
                              type="button"
                              className={`abk-slot-trigger ${selection ? "abk-slot-trigger--selected" : ""}`}
                              onClick={() => handleDropdownToggle(course.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 size={20} className="animate-spin" aria-hidden />
                              ) : (
                                <>
                                  <span className="truncate">
                                    {selection
                                      ? `${selection.venueLabel} · ${new Date(selection.date).toLocaleDateString()}`
                                      : "Select assessment slot"}
                                  </span>
                                  <ChevronDown
                                    size={20}
                                    className={`abk-chevron ${openDropdown === course.id ? "abk-chevron--open" : ""}`}
                                    aria-hidden
                                  />
                                </>
                              )}
                            </button>

                            {openDropdown === course.id && (
                              <div className="abk-dropdown-panel anim-fade-in">
                                <div className="abk-dropdown-scroll">
                                  {(() => {
                                    const slotsData = courseSlots[course.id] || [];
                                    if (slotsData.cooldown) {
                                      return (
                                        <div className="abk-cooldown">
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 8,
                                              marginBottom: 8,
                                            }}
                                          >
                                            <AlertCircle size={18} />
                                            Cooldown active
                                          </div>
                                          <div style={{ fontWeight: 500, opacity: 0.95 }}>{slotsData.message}</div>
                                        </div>
                                      );
                                    }
                                    const slots = Array.isArray(slotsData) ? slotsData : [];
                                    const filteredSlots = slots.filter((s) => {
                                      const endStr = s.endTime || s.timeLabel.split(" – ")[1]?.trim();
                                      return !isSlotExpired(s.date, endStr);
                                    });
                                    if (filteredSlots.length === 0) {
                                      return (
                                        <div className="abk-slot-option abk-slot-option--disabled" style={{ cursor: "default" }}>
                                          <span style={{ color: "#64748b", fontSize: 14 }}>No slots opened for this course yet</span>
                                        </div>
                                      );
                                    }
                                    return filteredSlots.map((slot) => (
                                      <div
                                        key={slot.id}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ")
                                            handleSlotSelect(course.id, slot);
                                        }}
                                        className={`abk-slot-option ${selection?.id === slot.id ? "abk-slot-option--active" : ""} ${!slot.available ? "abk-slot-option--disabled" : ""}`}
                                        onClick={() => handleSlotSelect(course.id, slot)}
                                      >
                                        <div className="abk-slot-option__row">
                                          <span>{slot.venueLabel}</span>
                                          {selection?.id === slot.id && (
                                            <CheckCircle2 size={18} style={{ color: "var(--abk-primary)" }} />
                                          )}
                                        </div>
                                        <span className="abk-slot-option__meta">
                                          {new Date(slot.date).toLocaleDateString()} · {slot.timeLabel}
                                        </span>
                                        <span
                                          className={`abk-slot-option__seats ${slot.available ? "abk-slot-option__seats--ok" : "abk-slot-option__seats--full"}`}
                                        >
                                          {slot.available
                                            ? `${slot.capacity - slot.bookedCount} seats left`
                                            : "Slot full"}
                                        </span>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="abk-btn-primary"
                            disabled={!selection || submitting}
                            onClick={() => handleConfirm(course)}
                          >
                            {submitting ? "Confirming…" : "Confirm booking"}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
