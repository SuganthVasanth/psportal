import React from "react";

export default function StaffWardenWards({ data, has }) {
  const { ward_students } = data || {};
  const show = has("ward_students.view") || (ward_students?.length > 0);
  if (!show) return <p className="ud-empty">No ward students assigned.</p>;
  return (
    <section className="ud-card">
      <h3 className="card-title">My Wards</h3>
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
                <th>Room</th>
                <th>Biometric</th>
              </tr>
            </thead>
            <tbody>
              {ward_students.map((w) => (
                <tr key={w.register_no}>
                  <td>{w.register_no}</td>
                  <td>{w.name}</td>
                  <td>{w.department || "-"}</td>
                  <td>{w.room_number || "-"}</td>
                  <td>{w.biometric_details || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
