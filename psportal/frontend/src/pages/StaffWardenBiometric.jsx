import React from "react";

export default function StaffWardenBiometric({ data, has }) {
  const { ward_students } = data || {};
  const show = has("ward_students.biometric") || has("ward_students.view") || (ward_students?.length > 0);
  if (!show)
    return <p className="ud-empty">You do not have access to biometric details. Ask admin to grant warden accesses.</p>;
  return (
    <section className="ud-card">
      <h3 className="card-title">Biometric details</h3>
      <p className="card-subtitle">Ward students and their biometric information</p>
      {!ward_students?.length ? (
        <p className="sa-muted">No ward students assigned.</p>
      ) : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Register No</th>
                <th>Name</th>
                <th>Room</th>
                <th>Biometric details</th>
              </tr>
            </thead>
            <tbody>
              {ward_students.map((w) => (
                <tr key={w.register_no}>
                  <td>{w.register_no}</td>
                  <td>{w.name}</td>
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
