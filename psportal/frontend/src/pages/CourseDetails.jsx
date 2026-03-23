import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import TemplateQuestionForm from "../components/renderer/TemplateQuestionForm";
import { BookOpen, Award, ChevronDown, X, Play, ArrowLeft } from "lucide-react";
import "./CourseDetails.css";

const API_BASE = "http://localhost:5000";

/** True if current local time (HH:mm) is within [slot_start_time, slot_end_time) on the correct date. */
function isSlotActiveNow(slot_start_time, slot_end_time, slot_date) {
  if (!slot_start_time || !slot_end_time || !slot_date) return false;
  
  const now = new Date();
  const slotDate = new Date(slot_date);
  
  // Check date
  if (now.toDateString() !== slotDate.toDateString()) return false;

  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return nowStr >= slot_start_time && nowStr < slot_end_time;
}

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
  const courseId = id;
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [courseAttempts, setCourseAttempts] = useState(0);
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
  const [examView, setExamView] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState("");
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  
  const registerNo = localStorage.getItem("register_no") || MOCK_PROFILE.register_no;
  const studentName = localStorage.getItem("userName") || MOCK_PROFILE.name;
  const proctorKey = `proctor_${id}_${registerNo}`;

  const [tabSwitchCount, setTabSwitchCount] = useState(() => {
    return parseInt(localStorage.getItem(proctorKey) || "0", 10);
  });
  const [proctorWarning, setProctorWarning] = useState(() => {
    const count = parseInt(localStorage.getItem(proctorKey) || "0", 10);
    return count > 0 ? `Warning: We detected ${count} tab switch(es) or page refresh(es).` : "";
  });
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
        r.ok ? r.json() : { progress: [], courseAttempts: 0 }
      ),
    ])
      .then(([courseData, progressData]) => {
        setCourse(courseData);
        const list = Array.isArray(progressData) ? progressData : (progressData?.progress ?? []);
        const attempts = Array.isArray(progressData) ? 0 : (progressData?.courseAttempts ?? 0);
        setProgress(list);
        setCourseAttempts(attempts);
      })
      .catch((e) => {
        setError(e.message || "Failed to load course");
        setCourse(null);
        setProgress([]);
        setCourseAttempts(0);
      })
      .finally(() => setLoading(false));
  }, [id, registerNo]);

  const launchParam = params.get("launch");

  // Auto-launch portal if ?launch=true is present
  useEffect(() => {
    if (loading || !course || launchParam !== "true" || examView) return;
    
    if (courseAttempts < 1) {
      handleLaunchPortal();
    }
  }, [loading, course, courseAttempts, examView, launchParam]);

  // Proctoring security logic
  useEffect(() => {
    if (!examView) return;

    let unloadFired = false;

    const handleVisibilityChange = () => {
      if (document.hidden && !unloadFired) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          localStorage.setItem(proctorKey, newCount.toString());
          setProctorWarning(`Warning: You have switched tabs or refreshed ${newCount} time(s). This is a violation of assessment rules.`);
          return newCount;
        });
      }
    };

    const handleBeforeUnload = (e) => {
      unloadFired = true;
      const currentCount = parseInt(localStorage.getItem(proctorKey) || "0", 10);
      localStorage.setItem(proctorKey, (currentCount + 1).toString());
      // Showing the standard browser warning for reload during exam
      e.preventDefault();
      e.returnValue = '';
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    
    // Disable text selection via CSS
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.body.style.userSelect = "auto";
      document.body.style.webkitUserSelect = "auto";
    };
  }, [examView, proctorKey]);

  // Auto fullscreen
  useEffect(() => {
    if (examView) {
      const docElm = document.documentElement;
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen().catch((err) => console.warn("Fullscreen failed:", err));
      } else if (docElm.webkitRequestFullscreen) {
        docElm.webkitRequestFullscreen().catch((err) => console.warn(err));
      } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen().catch((err) => console.warn(err));
      }

      return () => {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch((err) => console.warn(err));
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen().catch((err) => console.warn(err));
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen().catch((err) => console.warn(err));
          }
        }
      };
    }
  }, [examView]);

  // Load active slots when opening the booking modal
  useEffect(() => {
    if (!bookSlotOpen) return;
    setSlotsLoadError("");
    fetch(`${API_BASE}/api/active-slots?course_id=${id}`) // id is courseId from useParams
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

  const bookingForThisCourse =
    myBookings.find((b) => String(b.course_id) === String(courseId)) ||
    (bookedSlot && String(bookedSlot.course_id) === String(courseId) ? bookedSlot : null);
  const activeBookingForCourse =
    bookingForThisCourse &&
    isSlotActiveNow(bookingForThisCourse.slot_start_time, bookingForThisCourse.slot_end_time, bookingForThisCourse.date);

  const handleBookNow = async () => {
    if (!selectedSlotId) {
      setBookingError("Please select a slot.");
      return;
    }
    const slot = activeSlots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setBookingError("Invalid slot.");
      return;
    }
    if (!slot.available) {
      setBookingError("Slot is full. Please select another one.");
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
          slot_id: slot.id,
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

  const handleLaunchPortal = () => {
    setExamError("");
    setExamSubmitted(false);
    setExamLoading(true);
    setExamView(true);
    
    // Do not clear the existing tabSwitchCount here, so it persists if they refresh and re-enter.
    
    fetch(`${API_BASE}/api/question-banks/approved-for-course/${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error("No approved questions for this course.");
        return r.json();
      })
      .then((data) => {
        setExamQuestions(Array.isArray(data.questions) ? data.questions : []);
        setExamAnswers({});
        setExamLoading(false);
      })
      .catch((e) => {
        setExamError(e.message || "Failed to load exam");
        setExamQuestions([]);
        setExamLoading(false);
      });
  };

  const handleExamAnswerChange = (questionNumber, value) => {
    setExamAnswers((prev) => ({ ...prev, [questionNumber]: value }));
  };

  const handleSubmitAttempt = async () => {
    setExamSubmitting(true);
    setExamError("");
    try {
      const questions = examQuestions.map((q) => ({
        questionNumber: q.questionNumber,
        template_id: q.template_id,
        value: examAnswers[q.questionNumber] ?? q.value ?? {},
      }));
      const res = await fetch(`${API_BASE}/api/question-banks/submit-attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          register_no: registerNo,
          course_id: courseId,
          booking_id: bookingForThisCourse?.id || undefined,
          questions,
        }),
      });
      const data = await res.json();
      if (res.status === 403) {
        setCourseAttempts(1);
        throw new Error(data.message || "You have already attempted this test once.");
      }
      if (!res.ok) throw new Error(data.message || "Submit failed");
      setExamSubmitted(true);
      setCourseAttempts((prev) => prev + 1);
      localStorage.removeItem(proctorKey); // Clear tracking on successful submit
    } catch (e) {
      setExamError(e.message || "Submit failed");
    } finally {
      setExamSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="cd-container cd-main">
          <p className="cd-content-placeholder">Loading course…</p>
        </div>
      </StudentLayout>
    );
  }

  // Exam / Portal view (when slot is active and user launched)
  if (examView) {
    return (
      <StudentLayout hideNav={true}>
        <div className="cd-container cd-main">
            <div className="cd-exam-header">
              <button type="button" className="cd-back-btn" onClick={() => { setExamView(false); setExamError(""); setExamSubmitted(false); }}>
                <ArrowLeft size={18} /> Back to course
              </button>
              <h1 className="cd-exam-title">Portal – {course?.name || courseName}</h1>
            </div>
            
            {proctorWarning && (
              <div className="cd-proctor-warning">
                <span>{proctorWarning}</span>
                <button type="button" onClick={() => setProctorWarning("")} className="cd-proctor-close">
                   <X size={16} />
                </button>
              </div>
            )}
            {tabSwitchCount > 0 && (
              <div className="cd-tab-switch-counter">
                 Tab Switches Detected: {tabSwitchCount}
              </div>
            )}

            {examLoading && <p className="cd-content-placeholder">Loading questions…</p>}
            {examError && <p className="cd-modal-error">{examError}</p>}
            {examSubmitted && <p className="cd-success-msg">Your attempt has been submitted successfully.</p>}
            {!examLoading && !examError && examQuestions.length > 0 && !examSubmitted && (
              <>
                <div className="cd-questions-list">
                  {examQuestions.map((q) => (
                    <div key={q.questionNumber} className="cd-question-block">
                      <h3 className="cd-question-heading">Question {q.questionNumber}</h3>
                      <TemplateQuestionForm
                        templateId={q.template_id}
                        value={{ ...(q.value || {}), ...(examAnswers[q.questionNumber] || {}) }}
                        onChange={(value) => handleExamAnswerChange(q.questionNumber, value)}
                        studentMode={true}
                      />
                    </div>
                  ))}
                </div>
                <div className="cd-exam-footer">
                  <button
                    type="button"
                    className="cd-btn-primary"
                    onClick={handleSubmitAttempt}
                    disabled={examSubmitting}
                  >
                    {examSubmitting ? "Submitting…" : "Submit attempt"}
                  </button>
                </div>
              </>
            )}
        </div>
      </StudentLayout>
    );
  }

  if (error || !course) {
    return (
      <StudentLayout>
        <div className="cd-container cd-main">
          <p className="cd-modal-error">{error || "Course not found"}</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="cd-container cd-main">
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

          {activeBookingForCourse && (
            <div className="cd-portal-banner">
              {courseAttempts >= 1 ? (
                <span className="cd-already-attempted">You have already attempted this test. Only one attempt is allowed.</span>
              ) : (
                <>
                  <span>Your slot is active. You can attempt the assessment now.</span>
                  <button type="button" className="cd-launch-portal-btn" onClick={handleLaunchPortal}>
                    <Play size={18} /> Launch Portal
                  </button>
                </>
              )}
            </div>
          )}

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
                        <span className="cd-badge attempt-badge">Attempts: {courseAttempts}</span>
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
                    {activeBookingForCourse && courseAttempts < 1 && (
                      <button type="button" className="cd-launch-portal-btn" onClick={handleLaunchPortal}>
                        <Play size={18} /> Launch Portal
                      </button>
                    )}
                    {activeBookingForCourse && courseAttempts >= 1 && (
                      <p className="cd-already-attempted-small">Already attempted (1 attempt allowed).</p>
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
                        activeSlots.find((s) => s.id === selectedSlotId) || null;
                      if (!selected) return <span className="cd-slot-placeholder">Select...</span>;
                      return (
                        <>
                          <span className="cd-slot-venue">{selected.venueLabel}</span>
                          <span className="cd-slot-time">
                            {new Date(selected.date).toLocaleDateString()} | {selected.timeLabel}
                          </span>
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
                      const idVal = s.id;
                      return (
                        <button
                          type="button"
                          key={idVal}
                          className={`cd-slot-option ${selectedSlotId === idVal ? "cd-slot-option-selected" : ""} ${!s.available ? "cd-slot-option-disabled" : ""}`}
                          disabled={!s.available}
                          onClick={() => {
                            setSelectedSlotId(idVal);
                            setSlotDropdownOpen(false);
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <span className="cd-slot-venue">{s.venueLabel}</span>
                            {!s.available && <span style={{ fontSize: "11px", color: "#ef4444" }}>FULL</span>}
                          </div>
                          <span className="cd-slot-time">
                            {new Date(s.date).toLocaleDateString()} | {s.timeLabel}
                            {s.available && <span style={{ marginLeft: "8px", color: "#10b981", fontSize: "11px" }}>({s.capacity - s.bookedCount} left)</span>}
                          </span>
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
    </StudentLayout>
  );
}
