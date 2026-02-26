import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { ChevronDown, X } from "lucide-react";
import "./CourseDetails.css";

const API_BASE = "http://localhost:5000";

const COURSES_MAP = {
  1: { title: "Placement Pre Assessment - Feb 2026 IT", name: "Placement Pre Assessment - Feb 2026 IT" },
  2: { title: "Logical Reasoning - 1A", name: "Logical Reasoning - 1A" },
  3: { title: "Programming Java Level - 4", name: "Programming Java Level - 4" },
  4: { title: "Programming C++ - Level 3", name: "Programming C++ - Level 3" },
  5: { title: "Construction management - Level 0", name: "Construction management - Level 0" },
  6: { title: "New Product Development and Innovations - Level 1D", name: "New Product Development and Innovations - Level 1D" },
};

const MOCK_MATERIALS = [
  { id: 1, label: "Material 1", count: "0/5" },
  { id: 2, label: "Material 2", count: "0/3" },
];

const MOCK_PROFILE = {
  register_no: "7376231CS323",
  name: "SUGANTH R",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth",
};

export default function CourseDetails() {
  const { id } = useParams();
  const courseId = id || "1";
  const course = COURSES_MAP[courseId] || COURSES_MAP[1];

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

  useEffect(() => {
    if (bookSlotOpen) {
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
    }
  }, [bookSlotOpen]);

  const selectedSlot = activeSlots.find((s) => (s.id || s.slot_template_id) === selectedSlotId);
  const slotDropdownRef = useRef(null);

  useEffect(() => {
    if (!slotDropdownOpen) return;
    const onOutside = (e) => {
      if (slotDropdownRef.current && !slotDropdownRef.current.contains(e.target)) setSlotDropdownOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [slotDropdownOpen]);

  useEffect(() => {
    fetch(`${API_BASE}/api/my-bookings?register_no=${encodeURIComponent(registerNo)}`)
      .then((r) => r.json())
      .then((data) => setMyBookings(Array.isArray(data) ? data : []))
      .catch(() => setMyBookings([]));
  }, [registerNo, bookedSlot]);

  const bookingForThisCourse =
    myBookings.find((b) => b.course_id === courseId) ||
    (bookedSlot && bookedSlot.course_id === courseId ? bookedSlot : null);

  const handleBookNow = async () => {
    if (!selectedSlotId) {
      setBookingError("Please select a slot.");
      return;
    }
    const slot = activeSlots.find((s) => s.id === selectedSlotId || s.slot_template_id === selectedSlotId);
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
          course_name: course.name,
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
            <span className="profile-id">{MOCK_PROFILE.register_no}</span>
            <span className="profile-name">{MOCK_PROFILE.name}</span>
          </div>
        </div>
      </header>

      <StudentSidebar />

      <main className="dashboard-main-area cd-main">
        <div className="cd-container">
          <h1 className="cd-page-title">{course.title}</h1>

          <div className="cd-two-col">
            <div className="cd-left">
              <div className="cd-content-card">
                <p className="cd-content-placeholder">Course content / video area</p>
              </div>
            </div>
            <div className="cd-right">
              <div className="cd-details-card">
                <h3 className="cd-card-title">Course Details</h3>
                <p className="cd-course-name">{course.name}</p>
                <button type="button" className="cd-book-slot-btn" onClick={() => setBookSlotOpen(true)}>
                  Book a Slot
                </button>
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
                {MOCK_MATERIALS.map((m) => (
                  <div key={m.id} className="cd-material-row">
                    <span className="cd-material-label">{m.id}. {m.label}</span>
                    <span className="cd-material-count">Materials: {m.count}</span>
                    <ChevronDown size={16} className="cd-material-chevron" />
                  </div>
                ))}
              </div>
            </div>
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
                    {selectedSlot ? (
                      <>
                        <span className="cd-slot-venue">{selectedSlot.venueLabel}</span>
                        <span className="cd-slot-time">{selectedSlot.timeLabel}</span>
                      </>
                    ) : (
                      <span className="cd-slot-placeholder">Select...</span>
                    )}
                  </span>
                  <ChevronDown size={18} className="cd-slot-chevron" />
                </button>
                {slotDropdownOpen && (
                  <div className="cd-slot-dropdown-list">
                    <button
                      type="button"
                      className="cd-slot-option"
                      onClick={() => { setSelectedSlotId(""); setSlotDropdownOpen(false); }}
                    >
                      <span className="cd-slot-venue">Select...</span>
                    </button>
                    {activeSlots.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className={`cd-slot-option ${selectedSlotId === (s.id || s.slot_template_id) ? "cd-slot-option-selected" : ""}`}
                        onClick={() => { setSelectedSlotId(s.id || s.slot_template_id); setSlotDropdownOpen(false); }}
                      >
                        <span className="cd-slot-venue">{s.venueLabel}</span>
                        <span className="cd-slot-time">{s.timeLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {slotsLoadError && <p className="cd-modal-error">{slotsLoadError}</p>}
              {!slotsLoadError && activeSlots.length === 0 && <p className="cd-modal-hint">No active slots. Ask admin to add slots and set status to Active.</p>}
              {bookingError && <p className="cd-modal-error">{bookingError}</p>}
            </div>
            <div className="cd-modal-footer">
              <button type="button" className="cd-btn-secondary" onClick={() => !bookingLoading && setBookSlotOpen(false)}>Cancel</button>
              <button type="button" className="cd-btn-primary" onClick={handleBookNow} disabled={bookingLoading || !selectedSlotId}>
                {bookingLoading ? "Booking…" : "Book now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
