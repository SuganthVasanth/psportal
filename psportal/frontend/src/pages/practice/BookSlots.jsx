import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Laptop, ChevronDown, CheckCircle2, Loader2, BookOpen, Play } from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import "./BookSlots.css";

const API_BASE = "http://localhost:5000";

function isSlotActiveNow(slot_start_time, slot_end_time, slot_date) {
  if (!slot_start_time || !slot_end_time || !slot_date) return false;
  const now = new Date();
  const slotDate = new Date(slot_date);
  if (now.toDateString() !== slotDate.toDateString()) return false;
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  // For simplicity, we assume the student's dynamic duration is already reflected in slot_end_time if possible, 
  // but here we just check if it's within the window.
  return nowStr >= slot_start_time && nowStr < slot_end_time;
}

export default function BookSlots() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [courseSlots, setCourseSlots] = useState({}); // { [courseId]: slots[] }
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState({}); // { [courseId]: boolean }
  const [selectedSlots, setSelectedSlots] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  const registerNo = localStorage.getItem("register_no");
  const studentName = localStorage.getItem("name") || "Student";
  const token = localStorage.getItem("token");

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
    if (courseSlots[courseId]) return; // Already loaded

    const courseObj = courses.find(c => c.id === courseId);
    setLoadingSlots(prev => ({ ...prev, [courseId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/active-slots?course_id=${courseId}&level_index=${courseObj?.levelIndex || 0}`);
      const data = await res.ok ? await res.json() : [];
      setCourseSlots(prev => ({ ...prev, [courseId]: data }));
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(prev => ({ ...prev, [courseId]: false }));
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
    setSelectedSlots(prev => ({ ...prev, [courseId]: slot }));
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
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Booking confirmed successfully!");
        // Refresh slots for this course to update bookedCount
        const updatedRes = await fetch(`${API_BASE}/api/active-slots?course_id=${course.id}`);
        const updatedData = await updatedRes.json();
        setCourseSlots(prev => ({ ...prev, [course.id]: updatedData }));
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
      <StudentLayout>
        <div className="loading-state-premium">
          <Loader2 className="animate-spin" size={40} />
          <p>Loading your courses...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="book-slots-container">
        <div className="page-header-premium">
          <div className="breadcrumb-premium">
            <span className="breadcrumb-item">Compete</span>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-item active">Book Slots</span>
          </div>
          <h1 className="page-title-premium">Assessment Booking</h1>
          <p className="page-subtitle-premium">Choose a convenient slot for your registered assessments</p>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state-premium">
              <BookOpen size={48} />
              <h2>No Registered Courses</h2>
              <p>You haven't registered for any courses yet. Please register to book assessment slots.</p>
          </div>
        ) : (
          <div className="slots-grid-premium">
            {courses.map((course) => {
              const allSlots = courseSlots[course.id] || [];
              const currentSlots = allSlots.filter(slot => {
                // Check if student has ANY booking at the same time and date
                const hasClash = myBookings.some(b => 
                  new Date(b.date).toDateString() === new Date(slot.date).toDateString() &&
                  b.startTime === slot.startTime
                );
                return !hasClash;
              });
              const isLoading = loadingSlots[course.id];
              const selection = selectedSlots[course.id];

              return (
                <div key={course.id} className="slot-card-premium">
                  <div className="card-top-info">
                      <div className="category-icon-wrapper">
                          <Laptop size={24} />
                      </div>
                      <div className="slots-count-badge">
                          {currentSlots.filter(s => s.available).length} MATCHES
                      </div>
                  </div>

                  <div className="card-content-premium">
                      <h2 className="category-title-premium">{course.levelName}</h2>
                      <div className="category-meta-premium">
                          <span className="meta-text-bold">{course.title || "Course"}</span>
                          <div className="meta-divider"></div>
                          <span className="meta-text-light">{course.completed ? "COMPLETED" : "IN PROGRESS"}</span>
                      </div>

                      {(() => {
                        const existingBooking = myBookings.find(b => String(b.course_id) === String(course.id));
                        if (existingBooking) {
                          const isActive = isSlotActiveNow(existingBooking.startTime, existingBooking.endTime, existingBooking.date);
                          return (
                            <div className="booked-slot-details-premium anim-fade-in">
                                <div className="booked-status-header">
                                    <CheckCircle2 size={18} />
                                    <span>Slot Booked</span>
                                </div>
                                <div className="booked-info-grid">
                                    <div className="booked-info-item">
                                        <span className="booked-info-label">Venue</span>
                                        <span className="booked-info-value">{existingBooking.venue_label}</span>
                                    </div>
                                    <div className="booked-info-item">
                                        <span className="booked-info-label">Time</span>
                                        <span className="booked-info-value">{existingBooking.time_label}</span>
                                    </div>
                                    <div className="booked-info-item">
                                        <span className="booked-info-label">Date</span>
                                        <span className="booked-info-value">{new Date(existingBooking.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {isActive && (
                                  <button 
                                    className="launch-portal-btn-premium"
                                    onClick={() => navigate(`/pre-test/${course.id}`)}
                                  >
                                    <Play size={16} />
                                    Launch Test Portal
                                  </button>
                                )}
                            </div>
                          );
                        }

                        return (
                          <div className="custom-dropdown-container">
                            <button 
                                className={`dropdown-trigger-premium ${selection ? 'has-selection' : ''}`}
                                onClick={() => handleDropdownToggle(course.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <>
                                    <span>{selection ? `${selection.venueLabel} (${new Date(selection.date).toLocaleDateString()})` : "Select Assessment Slot"}</span>
                                    <ChevronDown size={18} className={`chevron-icon ${openDropdown === course.id ? 'open' : ''}`} />
                                  </>
                                )}
                            </button>

                            {openDropdown === course.id && (
                                <div className="dropdown-menu-premium anim-fade-in">
                                    <div className="dropdown-options-list">
                                        {currentSlots.length === 0 ? (
                                            <div className="dropdown-option-premium disabled">No slots opened for this course yet</div>
                                        ) : (
                                          currentSlots.map((slot) => (
                                              <div 
                                                  key={slot.id} 
                                                  className={`dropdown-option-premium ${selection?.id === slot.id ? 'active' : ''} ${!slot.available ? 'disabled' : ''}`}
                                                  onClick={() => handleSlotSelect(course.id, slot)}
                                                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", padding: "10px 12px" }}
                                              >
                                                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontWeight: "600" }}>
                                                      <span>{slot.venueLabel}</span>
                                                      {selection?.id === slot.id && <CheckCircle2 size={14} className="check-icon" />}
                                                  </div>
                                                  <div style={{ fontSize: "12px", opacity: 0.8 }}>
                                                      {new Date(slot.date).toLocaleDateString()} | {slot.timeLabel}
                                                  </div>
                                                  <div style={{ fontSize: "11px", marginTop: "4px", color: slot.available ? "#10b981" : "#ef4444" }}>
                                                      {slot.available ? `${slot.capacity - slot.bookedCount} seats left` : "Slot full"}
                                                  </div>
                                              </div>
                                          ))
                                        )}
                                    </div>
                                </div>
                            )}
                          </div>
                        );
                      })()}

                      {selection && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b", backgroundColor: "#f8fafc", padding: "8px", borderRadius: "6px" }}>
                          Selected: <strong>{selection.timeLabel}</strong> at <strong>{selection.venueLabel}</strong> on <strong>{new Date(selection.date).toLocaleDateString()}</strong>
                        </div>
                      )}

                      {!myBookings.find(b => String(b.course_id) === String(course.id)) && (
                        <button 
                            className="confirm-booking-btn-premium"
                            disabled={!selection || submitting}
                            onClick={() => handleConfirm(course)}
                        >
                            {submitting ? "CONFIRMING..." : "CONFIRM BOOKING"}
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

function Search({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  );
}
