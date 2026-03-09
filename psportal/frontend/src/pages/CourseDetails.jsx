import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { BookOpen, Award, ChevronDown, X } from "lucide-react";
import "./CourseDetails.css";

const API_BASE = "http://localhost:5000";

const MOCK_PROFILE = {
  register_no: "7376231CS323",
  name: "SUGANTH R",
  avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
};

const getLevelActionLabel = (courseName, level, index) => {
  const name = (level.name || `Level ${index}`).trim();
  if (index === 0) return `Start ${name}`;
  return `Enroll for ${name}`;
};

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registeringLevel, setRegisteringLevel] = useState(null);
  const [registerError, setRegisterError] = useState("");
  const [completingLevel, setCompletingLevel] = useState(null);
  const [bookSlotOpen, setBookSlotOpen] = useState(false);
  const [activeSlots, setActiveSlots] = useState([]);
  const [slotsLoadError, setSlotsLoadError] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [slotDropdownOpen, setSlotDropdownOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookedSlot, setBookedSlot] = useState(null);
  const [myBookings, setMyBookings] = useState([]);

  const registerNo = localStorage.getItem("register_no") || MOCK_PROFILE.register_no;
  const studentName = localStorage.getItem("userName") || MOCK_PROFILE.name;
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const levelFilterName = params.get("level");
  const slotDropdownRef = useRef(null);

  useEffect(() => {
    if (!id) {
      setError("Course not found");
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${API_BASE}/api/courses/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Course not found")))),
      fetch(`${API_BASE}/api/courses/${id}/progress?register_no=${encodeURIComponent(registerNo)}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([courseData, progressData]) => {
        setCourse(courseData);
        setProgress(Array.isArray(progressData) ? progressData : []);
      })
      .catch((e) => {
        setError(e.message || "Failed to load course");
        setCourse(null);
        setProgress([]);
      })
      .finally(() => setLoading(false));
  }, [id, registerNo]);

  // Load active slots when opening the booking modal
  useEffect(() => {
    if (!bookSlotOpen) return;
    setSlotsLoadError("");
    fetch(`${API_BASE}/api/active-slots`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load slots");
        return r.json();
      })
      .then((data) => setActiveSlots(Array.isArray(data) ? data : []))
      .catch((e) => {
        setActiveSlots([]);
        setSlotsLoadError(e.message || "Could not load slots. Is the backend running on port 5000?");
      });
    setSelectedSlotId("");
    setBookingError("");
    setSlotDropdownOpen(false);
  }, [bookSlotOpen]);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    if (!slotDropdownOpen) return;
    const onOutside = (e) => {
      if (slotDropdownRef.current && !slotDropdownRef.current.contains(e.target)) setSlotDropdownOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [slotDropdownOpen]);

  // Load existing bookings so we can hide the button after booking
  useEffect(() => {
    if (!registerNo) return;
    fetch(`${API_BASE}/api/my-bookings?register_no=${encodeURIComponent(registerNo)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMyBookings(Array.isArray(data) ? data : []))
      .catch(() => setMyBookings([]));
  }, [registerNo, bookedSlot]);

  const handleRegisterLevel = async (levelIndex) => {
    setRegisterError("");
    setRegisteringLevel(levelIndex);
    try {
      const res = await fetch(`${API_BASE}/api/courses/${id}/register-level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ register_no: registerNo, level_index: levelIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setProgress((prev) => [...prev.filter((p) => p.level_index !== levelIndex), { level_index: levelIndex, status: "enrolled" }]);
    } catch (e) {
      setRegisterError(e.message || "Could not register");
    } finally {
      setRegisteringLevel(null);
    }
  };

  const handleCompleteLevel = async (levelIndex) => {
    setCompletingLevel(levelIndex);
    try {
      const res = await fetch(`${API_BASE}/api/courses/${id}/complete-level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ register_no: registerNo, level_index: levelIndex }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setProgress((prev) => [...prev.filter((p) => p.level_index !== levelIndex), { level_index: levelIndex, status: "completed" }]);
    } catch (e) {
      setRegisterError(e.message || "Could not mark complete");
    } finally {
      setCompletingLevel(null);
    }
  };

  const completedLevelIndices = new Set(progress.filter((p) => p.status === "completed").map((p) => p.level_index));
  const enrolledLevelIndices = new Set(progress.filter((p) => p.status === "enrolled").map((p) => p.level_index));

  const allLevels = course?.levels || [];
  const levels =
    levelFilterName && allLevels.length
      ? allLevels.filter((l) => (l.name || "").toLowerCase() === levelFilterName.toLowerCase())
      : allLevels;
  const courseName = course?.name || "Course";

  const courseId = id;
  const bookingForThisCourse =
    myBookings.find((b) => b.course_id === courseId) ||
    (bookedSlot && bookedSlot.course_id === courseId ? bookedSlot : null);

  const handleBookNow = async () => {
    if (!selectedSlotId) {
      setBookingError("Please select a slot.");
      return;
    }
    const slot = activeSlots.find((s) => (s.id || s.slot_template_id) === selectedSlotId);
    if (!slot) {
      setBookingError("Invalid slot.");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    try {
      const res = await fetch(`${API_BASE}/api/book-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          register_no: registerNo,
          student_name: studentName,
          course_id: courseId,
          course_name: courseName,
          slot_template_id: slot.id || slot.slot_template_id,
          venue_label: slot.venueLabel || "",
          time_label: slot.timeLabel || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      setBookedSlot(data);
      setBookSlotOpen(false);
    } catch (e) {
      setBookingError(e.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout cd-layout">
        <header className="top-navbar">
          <div className="top-nav-brand">
            <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
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
        <main className="dashboard-main-area cd-main">
          <div className="cd-container">
            <p className="cd-content-placeholder">Loading course…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="dashboard-layout cd-layout">
        <header className="top-navbar">
          <div className="top-nav-brand">
            <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
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
        <main className="dashboard-main-area cd-main">
          <div className="cd-container">
            <p className="cd-modal-error">{error || "Course not found"}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout cd-layout">
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

      <main className="dashboard-main-area cd-main">
        <div className="cd-container">
          <div className="cd-header-card">
            <div className="cd-header-info">
              <h1 className="cd-title">{courseName}</h1>
              {course.description && <p className="cd-course-name" style={{ marginBottom: 12 }}>{course.description}</p>}
              <div className="cd-meta">
                <div className="cd-meta-item">
                  <BookOpen size={18} className="cd-meta-icon" />
                  <span>Levels: {levels.length}</span>
                </div>
                <div className="cd-meta-item cd-skill-type">
                  <Award size={18} className="cd-meta-icon" />
                  <span>{course.type || "Course"}</span>
                </div>
              </div>
            </div>
            {course.course_logo && (
              <div className="cd-header-image">
                <img src={course.course_logo} alt={courseName} />
              </div>
            )}
          </div>

          {registerError && <p className="cd-modal-error" style={{ marginBottom: 16 }}>{registerError}</p>}

          <div className={levelFilterName ? "cd-two-col" : ""}>
            <div className="cd-left">
              {levels.length === 0 ? (
                <p className="cd-content-placeholder">No levels defined for this course yet. Check back later.</p>
              ) : (
                <div className="cd-levels-list">
                  {levels.map((level, index) => {
                const prereqIndices = Array.isArray(level.prerequisiteLevelIndices) && level.prerequisiteLevelIndices.length > 0
                  ? level.prerequisiteLevelIndices
                  : (level.prerequisiteLevelIndex != null && level.prerequisiteLevelIndex >= 0 ? [level.prerequisiteLevelIndex] : []);
                const prereqCleared = prereqIndices.length === 0 || prereqIndices.every((i) => completedLevelIndices.has(i));
                const prereqLabel = prereqIndices.length === 0 ? "No" : prereqIndices.map((i) => `${i + 1}. ${levels[i]?.name || `Level ${i}`}`).join(", ");
                const isEnrolled = enrolledLevelIndices.has(index);
                const isCompleted = completedLevelIndices.has(index);
                const canRegister = prereqCleared && !isEnrolled && !isCompleted;
                const actionLabel = getLevelActionLabel(courseName, level, index);

                return (
                  <div key={index} className="cd-level-card">
                    <div className="cd-level-top">
                      <div className="cd-level-title-group">
                        <div className="cd-level-number">{index + 1}</div>
                        <span className="cd-level-title">{courseName} – {level.name || `Level ${index}`}</span>
                      </div>
                      <div className="cd-level-badges">
                        <span className="cd-badge attempt-badge">Attempts: {progress.find((p) => p.level_index === index)?.attempts ?? 0}</span>
                        {isCompleted && <span className="cd-badge completed-badge">Completed</span>}
                        {isEnrolled && !isCompleted && <span className="cd-badge">Enrolled</span>}
                      </div>
                    </div>
                    <div className="cd-level-content">
                      <div className="cd-topics-column">
                        <strong className="cd-detail-label">Topics</strong>
                        {(level.topics && level.topics.length) ? (
                          level.topics.map((topic, i) => (
                            <div key={i} className="cd-topic-item">
                              {topic}
                            </div>
                          ))
                        ) : (
                          <div className="cd-topic-item">No topics listed</div>
                        )}
                      </div>
                      <div className="cd-details-column">
                        <div className="cd-detail-item">
                          <span className="cd-detail-label">With rewards</span>
                          <span className="cd-detail-value medal-value">
                            <Award size={16} className="medal-icon" />
                            {level.rewardPoints ?? 0} pts
                          </span>
                        </div>
                        <div className="cd-detail-item">
                          <span className="cd-detail-label">Prerequisite</span>
                          <span className="cd-detail-value">{prereqLabel}</span>
                        </div>
                        <div className="cd-detail-item">
                          <span className="cd-detail-label">Assessment type</span>
                          <span className="cd-detail-value">{level.assessmentType || "MCQ"}</span>
                        </div>
                        <div className="cd-level-action">
                          {canRegister ? (
                            <button
                              type="button"
                              className="cd-register-btn"
                              onClick={() => handleRegisterLevel(index)}
                              disabled={registeringLevel !== null}
                            >
                              {registeringLevel === index ? "Registering…" : actionLabel}
                            </button>
                          ) : !prereqCleared ? (
                            <button
                              type="button"
                              className="cd-register-btn"
                              disabled
                              style={{ opacity: 0.7, cursor: "not-allowed" }}
                            >
                              Complete prerequisite first
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </div>

            {levelFilterName && (
              <div className="cd-right">
                <div className="cd-details-card">
                  <h3 className="cd-card-title">Course Details</h3>
                  <p className="cd-course-name">{levels[0]?.name || courseName}</p>
                  {!bookingForThisCourse && (
                    <button type="button" className="cd-book-slot-btn" onClick={() => setBookSlotOpen(true)}>
                      Book a Slot
                    </button>
                  )}
                </div>

                {bookingForThisCourse && (
                  <div className="cd-booked-card">
                    <h3 className="cd-card-title">Slot Booked</h3>
                    <p><strong>Venue:</strong> {bookingForThisCourse.venue_label}</p>
                    <p><strong>Time:</strong> {bookingForThisCourse.time_label}</p>
                    {bookingForThisCourse.booked_at && (
                      <p><strong>Booked at:</strong> {new Date(bookingForThisCourse.booked_at).toLocaleString()}</p>
                    )}
                  </div>
                )}

                <div className="cd-materials-card">
                  <h3 className="cd-card-title">Course Materials</h3>
                  <div className="cd-material-row">
                    <span className="cd-material-label">1. Materials</span>
                    <span className="cd-material-count">Materials: 0 / 0</span>
                    <ChevronDown size={16} className="cd-material-chevron" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {bookSlotOpen && (
        <div className="cd-modal-overlay" onClick={() => !bookingLoading && setBookSlotOpen(false)}>
          <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cd-modal-header">
              <h3>Book Slot</h3>
              <button type="button" className="cd-modal-close" onClick={() => !bookingLoading && setBookSlotOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="cd-modal-body">
              <label className="cd-modal-label">Slot Timings</label>
              <div className="cd-slot-dropdown-wrap" ref={slotDropdownRef}>
                <button
                  type="button"
                  className="cd-slot-dropdown-trigger"
                  onClick={() => !bookingLoading && setSlotDropdownOpen((o) => !o)}
                  disabled={bookingLoading}
                >
                  <span className="cd-slot-dropdown-content">
                    {(() => {
                      const selected =
                        activeSlots.find((s) => (s.id || s.slot_template_id) === selectedSlotId) || null;
                      if (!selected) return <span className="cd-slot-placeholder">Select...</span>;
                      return (
                        <>
                          <span className="cd-slot-venue">{selected.venueLabel}</span>
                          <span className="cd-slot-time">{selected.timeLabel}</span>
                        </>
                      );
                    })()}
                  </span>
                  <ChevronDown size={18} className="cd-slot-chevron" />
                </button>
                {slotDropdownOpen && (
                  <div className="cd-slot-dropdown-list">
                    <button
                      type="button"
                      className="cd-slot-option"
                      onClick={() => {
                        setSelectedSlotId("");
                        setSlotDropdownOpen(false);
                      }}
                    >
                      <span className="cd-slot-venue">Select...</span>
                    </button>
                    {activeSlots.map((s) => {
                      const idVal = s.id || s.slot_template_id;
                      return (
                        <button
                          type="button"
                          key={idVal}
                          className={`cd-slot-option ${selectedSlotId === idVal ? "cd-slot-option-selected" : ""}`}
                          onClick={() => {
                            setSelectedSlotId(idVal);
                            setSlotDropdownOpen(false);
                          }}
                        >
                          <span className="cd-slot-venue">{s.venueLabel}</span>
                          <span className="cd-slot-time">{s.timeLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {slotsLoadError && <p className="cd-modal-error">{slotsLoadError}</p>}
              {!slotsLoadError && activeSlots.length === 0 && (
                <p className="cd-modal-hint">No active slots. Ask admin to add slots and set status to Active.</p>
              )}
              {bookingError && <p className="cd-modal-error">{bookingError}</p>}
            </div>
            <div className="cd-modal-footer">
              <button
                type="button"
                className="cd-btn-secondary"
                onClick={() => !bookingLoading && setBookSlotOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cd-btn-primary"
                onClick={handleBookNow}
                disabled={bookingLoading || !selectedSlotId}
              >
                {bookingLoading ? "Booking…" : "Book now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
