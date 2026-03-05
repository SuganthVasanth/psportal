import React from "react";

export default function StaffMentorMentees({ data, has }) {
  const { mentees } = data || {};
  const show = has("mentees.view") || (mentees?.length > 0);
  if (!show) return <p className="ud-empty">No mentees assigned. Ask admin to assign mentees and grant mentor accesses.</p>;
  return (
    <section className="ud-card">
      <h3 className="card-title">My Mentees</h3>
      <p className="card-subtitle">Students assigned to you as mentor</p>
      {!mentees?.length ? (
        <p className="sa-muted">No mentees assigned.</p>
      ) : (
        <div>
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
          {has("mentees.courses") && mentees.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary>Course progress by mentee</summary>
              {mentees.map((m) => (
                <div key={m.register_no} style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <strong>{m.name}</strong> ({m.register_no}): {(m.courses_progress || []).length} level(s) in progress
                </div>
              ))}
            </details>
          )}
        </div>
      )}
    </section>
  );
}
