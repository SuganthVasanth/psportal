import React from "react";

export default function WardenDashboard({ data, has }) {
  const { user, ward_students, leave_requests_to_approve } = data || {};
  const wardenLeaves = (leave_requests_to_approve || []).filter((l) => (l.approval_type || "warden") === "warden");

  const showWards = has("ward_students.view") || (ward_students?.length > 0);
  const showLeaves = has("ward_students.leave_approve") && wardenLeaves.length >= 0;

  if (!showWards && !showLeaves) {
    return (
      <div>
        <h1 className="ud-welcome">Warden Dashboard</h1>
        <p className="ud-welcome-sub">Students in your ward and leave approvals.</p>
        <p className="ud-empty">No ward students or leave requests. Ask admin to assign wards and grant warden accesses.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="ud-welcome">Warden Dashboard</h1>
      <p className="ud-welcome-sub">Manage ward students and leave approvals.</p>

      {showWards && (
        <section className="ud-card">
          <h3 className="card-title">My Ward Students</h3>
          <p className="card-subtitle">Students in your ward</p>
          {!ward_students?.length ? (
            <p className="sa-muted">No ward students assigned.</p>
          ) : (
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Register No</th>
                    <th>Name</th>
                    <th>Department</th>
                    {has("ward_students.room") && <th>Room</th>}
                    {has("ward_students.biometric") && <th>Biometric</th>}
                  </tr>
                </thead>
                <tbody>
                  {ward_students.map((w) => (
                    <tr key={w.register_no}>
                      <td>{w.register_no}</td>
                      <td>{w.name}</td>
                      <td>{w.department || "-"}</td>
                      {has("ward_students.room") && <td>{w.room_number || "-"}</td>}
                      {has("ward_students.biometric") && <td>{w.biometric_details || "-"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {showLeaves && (
        <section className="ud-card">
          <h3 className="card-title">Leave requests (Warden approval)</h3>
          <p className="card-subtitle">Pending your approval as warden</p>
          {!wardenLeaves.length ? (
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
                  {wardenLeaves.map((l) => (
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
