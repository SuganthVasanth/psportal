import React from "react";

export default function StaffHostelManagerWardens({ data }) {
  const list = data?.hostel_wardens || [];
  if (!list.length) {
    return (
      <section className="ud-card">
        <h3 className="card-title">Wardens & wards</h3>
        <p className="card-subtitle">Hostel wardens and their assigned students.</p>
        <p className="sa-muted">No wardens or ward students found. Ask admin to map students to wardens.</p>
      </section>
    );
  }
  return (
    <section className="ud-card">
      <h3 className="card-title">Wardens & wards</h3>
      <p className="card-subtitle">Warden details with wards, room and biometric info.</p>
      {list.map((w) => (
        <div key={w.warden_id} style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            {w.warden_name}
          </h4>
          {!w.students?.length ? (
            <p className="sa-muted" style={{ marginBottom: 8 }}>No students mapped.</p>
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
                  {w.students.map((s) => (
                    <tr key={s.register_no}>
                      <td>{s.register_no}</td>
                      <td>{s.name}</td>
                      <td>{s.department || "-"}</td>
                      <td>{s.room_number || "-"}</td>
                      <td>{s.biometric_details || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

