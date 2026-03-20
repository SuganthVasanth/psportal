import React, { useState } from "react";

/**
 * Placeholder UI for Security biometric tab.
 * Expects data.security_biometric_logs in future; currently shows empty state.
 */
export default function StaffSecurityBiometric({ data }) {
  const [query, setQuery] = useState("");
  const logs = data?.security_biometric_logs || [];
  const filtered = logs.filter((log) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (log.register_no || "").toLowerCase().includes(q) ||
      (log.student_name || "").toLowerCase().includes(q)
    );
  });

  const isLate = (log) => {
    if (!log.expectedIn || !log.inTime) return false;
    return new Date(log.inTime) > new Date(log.expectedIn);
  };

  return (
    <section className="ud-card">
      <h3 className="card-title">Biometric log</h3>
      <p className="card-subtitle">Student in / out logs during outing days. Late ins are highlighted.</p>
      <div className="sa-form-group" style={{ maxWidth: 320, marginBottom: 16 }}>
        <input
          type="text"
          className="sa-input"
          placeholder="Search by reg. no or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {!filtered.length ? (
        <p className="sa-muted">No biometric logs available yet.</p>
      ) : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Register No</th>
                <th>Name</th>
                <th>Out time</th>
                <th>Expected in</th>
                <th>In time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const late = isLate(log);
                return (
                  <tr key={log.id} style={late ? { backgroundColor: "#fee2e2" } : undefined}>
                    <td>{log.register_no}</td>
                    <td>{log.student_name}</td>
                    <td>{log.outTime ? new Date(log.outTime).toLocaleTimeString() : "-"}</td>
                    <td>{log.expectedIn ? new Date(log.expectedIn).toLocaleTimeString() : "-"}</td>
                    <td>{log.inTime ? new Date(log.inTime).toLocaleTimeString() : "-"}</td>
                    <td>
                      {late && (
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() => {
                            // In future: call backend to send alert to warden/mentor/hostel manager
                            alert("Alert will be sent to warden, mentor and hostel manager (to be wired).");
                          }}
                        >
                          Send
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

