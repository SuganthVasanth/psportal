import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CalendarCheck, Play, ExternalLink, AlertCircle } from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import API from "../../services/api";
import { isBookingAssessmentActive } from "../../lib/assessmentWindow";
import { USE_ASSESSMENT_HUB } from "../../config/featureFlags";
import "./AssessmentHub.css";

const MOCK_REGISTER = "7376231CS323";

function mergeRows(bookings, myCourses) {
  const byId = new Map();
  for (const c of myCourses) {
    byId.set(String(c.id), { courseId: String(c.id), title: c.title || "Course", levelName: c.levelName || "", booking: null, fromMyCourses: true });
  }
  for (const b of bookings) {
    const cid = String(b.course_id);
    const existing = byId.get(cid);
    if (existing) {
      existing.booking = b;
      existing.title = existing.title || b.course_name || "Course";
    } else {
      byId.set(cid, {
        courseId: cid,
        title: b.course_name || "Course",
        levelName: "",
        booking: b,
        fromMyCourses: false,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => {
    if (a.booking && !b.booking) return -1;
    if (!a.booking && b.booking) return 1;
    return (a.title || "").localeCompare(b.title || "");
  });
}

export default function AssessmentHub() {
  const registerNo = (localStorage.getItem("register_no") || MOCK_REGISTER).trim();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [bookings, setBookings] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [attemptsByBooking, setAttemptsByBooking] = useState({});

  const rows = useMemo(() => mergeRows(bookings, myCourses), [bookings, myCourses]);

  useEffect(() => {
    let cancelled = false;
    if (!registerNo) {
      setErr("No register number. Sign in again.");
      setLoading(false);
      return;
    }

    (async () => {
      setErr("");
      setLoading(true);
      try {
        const [bRes, cRes] = await Promise.all([
          API.get(`/api/my-bookings?register_no=${encodeURIComponent(registerNo)}`),
          API.get(`/api/dashboard/my-courses?register_no=${encodeURIComponent(registerNo)}`).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        const bList = Array.isArray(bRes.data) ? bRes.data : [];
        const cList = Array.isArray(cRes.data) ? cRes.data : [];
        setBookings(bList);
        setMyCourses(cList);

        const attempts = {};
        await Promise.all(
          bList.map(async (b) => {
            const bid = b?.id;
            const cid = b?.course_id;
            if (!bid || !cid) return;
            try {
              const pr = await API.get(
                `/api/courses/${cid}/progress?register_no=${encodeURIComponent(registerNo)}&booking_id=${encodeURIComponent(bid)}`
              );
              attempts[bid] = pr.data?.courseAttempts ?? 0;
            } catch {
              attempts[bid] = 0;
            }
          })
        );
        if (!cancelled) setAttemptsByBooking(attempts);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message || "Could not load assessment data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [registerNo]);

  if (!USE_ASSESSMENT_HUB) {
    return (
      <StudentLayout>
        <div className="ahub-wrap">
          <div className="ahub-card ahub-muted">
            <h1 className="ahub-title">Assessment hub disabled</h1>
            <p>
              Turn it on in <code className="ahub-code">frontend/.env</code>:{" "}
              <code className="ahub-code">VITE_USE_ASSESSMENT_HUB=true</code>, then restart the dev server.
            </p>
            <p>The classic flow is unchanged:</p>
            <ul className="ahub-list">
              <li>
                <Link to="/book-slots">Book Slots</Link>
              </li>
              <li>
                <Link to="/my-courses">My Courses</Link> → open a course
              </li>
            </ul>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="ahub-wrap">
        <header className="ahub-header">
          <h1 className="ahub-title">Assessment hub</h1>
          <p className="ahub-sub">
            One place to see booking and slot status. The classic{" "}
            <Link to="/book-slots" className="ahub-link">
              Book Slots
            </Link>{" "}
            page still works the same.
          </p>
        </header>

        {loading && (
          <div className="ahub-loading">
            <Loader2 className="ahub-spin" size={36} />
            <span>Loading…</span>
          </div>
        )}

        {err && !loading && (
          <div className="ahub-alert" role="alert">
            <AlertCircle size={20} />
            <span>{err}</span>
          </div>
        )}

        {!loading && !err && rows.length === 0 && (
          <div className="ahub-card ahub-muted">
            <p>No courses or bookings yet.</p>
            <Link to="/book-slots" className="ahub-btn ahub-btn-secondary">
              <CalendarCheck size={18} /> Book a slot (classic)
            </Link>
          </div>
        )}

        {!loading && !err && rows.length > 0 && (
          <ul className="ahub-grid">
            {rows.map((row) => {
              const b = row.booking;
              const active = b && isBookingAssessmentActive(b);
              const attempts = b ? (attemptsByBooking[b.id] ?? 0) : 0;
              const canStart = b && active && attempts < 1;

              return (
                <li key={row.courseId} className="ahub-card">
                  <div className="ahub-card-head">
                    <h2 className="ahub-course-title">{row.title}</h2>
                    {row.levelName && <span className="ahub-badge">{row.levelName}</span>}
                  </div>

                  {!b && (
                    <div className="ahub-section">
                      <p className="ahub-muted-text">No active booking for this course.</p>
                      <Link to="/book-slots" className="ahub-btn ahub-btn-secondary">
                        <CalendarCheck size={18} /> Book slot
                      </Link>
                      <Link to={`/course/${row.courseId}`} className="ahub-link-inline">
                        Open course <ExternalLink size={14} />
                      </Link>
                    </div>
                  )}

                  {b && (
                    <div className="ahub-section">
                      <p>
                        <strong>Booking:</strong> {b.venue_label || "—"} · {b.time_label || "—"}
                      </p>
                      {b.date && (
                        <p className="ahub-muted-text">
                          Date: {new Date(b.date).toLocaleDateString()}
                        </p>
                      )}
                      <p className="ahub-status">
                        {active ? (
                          <span className="ahub-pill ahub-pill-live">Window open</span>
                        ) : (
                          <span className="ahub-pill ahub-pill-wait">Outside assessment window</span>
                        )}
                        {attempts >= 1 && (
                          <span className="ahub-pill ahub-pill-done">Submitted for this slot</span>
                        )}
                      </p>

                      <div className="ahub-actions">
                        {canStart && (
                          <>
                            <Link to={`/pre-test/${row.courseId}`} className="ahub-btn ahub-btn-secondary">
                              Pre-test screen
                            </Link>
                            <Link
                              to={`/course/${row.courseId}?launch=true`}
                              className="ahub-btn ahub-btn-primary"
                            >
                              <Play size={18} /> Start assessment
                            </Link>
                          </>
                        )}
                        {!canStart && b && (
                          <Link to={`/course/${row.courseId}`} className="ahub-btn ahub-btn-secondary">
                            Open course
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </StudentLayout>
  );
}
