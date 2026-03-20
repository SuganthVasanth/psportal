import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function StaffSecurityLeaves({ data, selectedRegisterNo }) {
  const all = data?.approved_leaves || [];
  const [query, setQuery] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailLeaves, setDetailLeaves] = useState([]);
  const navigate = useNavigate();

  const filtered = all.filter((l) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (l.register_no || "").toLowerCase().includes(q) ||
      (l.student_name || "").toLowerCase().includes(q) ||
      (l.leaveType || "").toLowerCase().includes(q)
    );
  });

  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // When a specific register number is selected (URL: /dashboard/security/leaves/:regNo),
  // load that student's full leave history for a full-screen detail view.
  useEffect(() => {
    if (!selectedRegisterNo) {
      setDetailLeaves([]);
      setDetailError("");
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setDetailError("");
    fetch(
      `${API_BASE}/api/leaves/my-leaves?register_no=${encodeURIComponent(selectedRegisterNo)}`,
      { headers: authHeaders }
    )
      .then((res) =>
        res.json().then((payload) => {
          if (!res.ok) {
            throw new Error(payload.message || "Failed to load student's leaves");
          }
          return payload;
        })
      )
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        // Security should only see approved leaves in the detail view as well.
        setDetailLeaves(arr.filter((item) => (item.status || "").toLowerCase() === "approved"));
      })
      .catch((err) => {
        setDetailError(err.message || "Failed to load student's leaves");
      })
      .finally(() => {
        setDetailLoading(false);
      });
  }, [selectedRegisterNo, token]);

  if (selectedRegisterNo) {
    const primary = all.find((l) => l.register_no === selectedRegisterNo) || null;
    const displayName = primary?.student_name || "Student";
    const avatarUrl =
      "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png";

    const renderStatusBadge = (value) => {
      const v = (value || "").toString();
      const lower = v.toLowerCase();
      let cls = "sa-badge";
      if (lower === "approved") cls += " sa-badge-success";
      else if (lower === "rejected") cls += " sa-badge-danger";
      else if (lower === "pending") cls += " sa-badge-warning";
      return <span className={cls}>{v || "-"}</span>;
    };

    return (
      <section className="dashboard-card sa-student-detail-full">
        <button
          type="button"
          className="sa-btn"
          style={{ marginBottom: 16 }}
          onClick={() => navigate("/dashboard/security/leaves")}
        >
          ← Back to approved leaves
        </button>

        <div className="sa-student-detail-header">
          <div className="sa-student-detail-profile">
            <img src={avatarUrl} alt={displayName} className="sa-student-detail-avatar" />
            <div>
              <h3 className="sa-student-detail-name">
                {displayName}
              </h3>
              <div className="sa-student-detail-meta">
                <span className="sa-student-detail-reg">Register No: {selectedRegisterNo}</span>
                <span className="sa-badge sa-badge-soft">Approved leaves overview</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sa-student-detail-body">
          {detailLoading ? (
            <p className="sa-muted">Loading leave details...</p>
          ) : detailError ? (
            <p style={{ color: "#b91c1c" }}>{detailError}</p>
          ) : !detailLeaves.length ? (
            <p className="sa-muted">No approved leaves found for this student.</p>
          ) : (
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Leave type</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Parent</th>
                    <th>Mentor</th>
                    <th>Warden</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {detailLeaves.map((l) => (
                    <tr key={l.id}>
                      <td>{l.leaveType}</td>
                      <td>{l.type}</td>
                      <td>{l.fromDateFull}</td>
                      <td>{l.toDateFull}</td>
                      <td>{renderStatusBadge(l.status)}</td>
                      <td>{renderStatusBadge(l.parentStatus)}</td>
                      <td>{renderStatusBadge(l.mentorApproval?.status)}</td>
                      <td>{renderStatusBadge(l.wardenApproval?.status)}</td>
                      <td>{l.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="ud-card">
      <h3 className="card-title">Approved leaves</h3>
      <p className="card-subtitle">Search by name, register no, or leave type. Click a student to view full details.</p>
      <div className="sa-form-group" style={{ maxWidth: 320, marginBottom: 16 }}>
        <input
          type="text"
          className="sa-input"
          placeholder="Search student or leave type..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {!filtered.length ? (
        <p className="sa-muted">No approved leaves found.</p>
      ) : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Register No</th>
                <th>Name</th>
                <th>Leave type</th>
                <th>From – To</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="sa-row-clickable"
                  onClick={() =>
                    navigate(
                      `/dashboard/security/leaves/${encodeURIComponent(l.register_no || "")}`
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>{l.register_no}</td>
                  <td>{l.student_name}</td>
                  <td>{l.leaveType}</td>
                  <td>
                    {l.fromDate ? new Date(l.fromDate).toLocaleDateString() : ""} –{" "}
                    {l.toDate ? new Date(l.toDate).toLocaleDateString() : ""}
                  </td>
                  <td>{l.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

