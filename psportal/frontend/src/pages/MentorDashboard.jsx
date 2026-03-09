import React from "react";

export default function MentorDashboard({ data, has }) {
  const { user, mentees, leave_requests_to_approve } = data || {};
  const mentorLeaves = (leave_requests_to_approve || []).filter((l) => (l.approval_type || "mentor") === "mentor");

  const showMentees = has("mentees.view") || (mentees?.length > 0);
  const showLeaves = has("mentees.leave_approve") && mentorLeaves.length >= 0;

  if (!showMentees && !showLeaves) {
    return (
      <div>
        <h1 className="ud-welcome">Mentor Dashboard</h1>
        <p className="ud-welcome-sub">Students assigned to you as mentor and leave approvals.</p>
        <p className="ud-empty">No mentees or leave requests. Ask admin to assign mentees and grant mentor accesses.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="ud-welcome">Mentor Dashboard</h1>
      <p className="ud-welcome-sub">Manage your mentees and leave approvals.</p>

      {showMentees && (
        <section className="ud-card">
          <h3 className="card-title">My Mentees</h3>
          <p className="card-subtitle">Students assigned to you as mentor</p>
          {!mentees?.length ? (
            <p className="sa-muted">No mentees assigned.</p>
          ) : (
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Register No</th>
                    <th>Name</th>
                    <th>Department</th>
                    {has("mentees.activity_points") && <th>Activity points</th>}
                    {has("mentees.attendance") && <th>Attendance %</th>}
                  </tr>
                </thead>
                <tbody>
                  {mentees.map((m) => (
                    <tr key={m.register_no}>
                      <td>{m.register_no}</td>
                      <td>{m.name}</td>
                      <td>{m.department || "-"}</td>
                      {has("mentees.activity_points") && <td>{m.total_activity ?? m.activity_points ?? 0}</td>}
                      {has("mentees.attendance") && <td>{m.attendance_percent ?? "-"}%</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {has("mentees.courses") && mentees?.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary>Course progress by mentee</summary>
              {mentees.map((m) => (
                <div key={m.register_no} style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <strong>{m.name}</strong> ({m.register_no}): {(m.courses_progress || []).length} level(s) in progress
                </div>
              ))}
            </details>
          )}
        </section>
      )}

      {showLeaves && (
        <section className="ud-card">
          <h3 className="card-title">Leave requests (Mentor approval)</h3>
          <p className="card-subtitle">Pending your approval as mentor</p>
          {!mentorLeaves.length ? (
            <p className="sa-muted">No pending leave requests.</p>
          ) : (
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Leave type</th>
                    <th>From – To</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorLeaves.map((l) => (
                    <tr key={l.id || l._id}>
                      <td>{l.student_name || l.register_no}</td>
                      <td>{l.leaveType}</td>
                      <td>{l.fromDate ? new Date(l.fromDate).toLocaleDateString() : ""} – {l.toDate ? new Date(l.toDate).toLocaleDateString() : ""}</td>
                      <td>{l.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
