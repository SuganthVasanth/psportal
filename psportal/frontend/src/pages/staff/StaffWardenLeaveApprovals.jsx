import React, { useState } from "react";
import { X } from "lucide-react";

const API_BASE = "http://localhost:5000";

const TAB_PENDING = "pending";
const TAB_HISTORY = "history";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function StaffWardenLeaveApprovals({ data, has, onRefresh }) {
  const { leave_requests_to_approve, leave_history_warden } = data || {};
  const wardenLeaves = (leave_requests_to_approve || []).filter((l) => (l.approval_type || "warden") === "warden");
  const historyLeaves = (leave_history_warden || []).filter((l) => (l.approval_type || "warden") === "warden");
  const [activeTab, setActiveTab] = useState(TAB_PENDING);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedLeaveHistory, setSelectedLeaveHistory] = useState(false);
  const [actingId, setActingId] = useState(null);
  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const handleAction = async (leaveId, action) => {
    setActingId(leaveId);
    try {
      const res = await fetch(`${API_BASE}/api/leaves/${leaveId}/warden-approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ action }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelectedLeave(null);
        if (typeof onRefresh === "function") await onRefresh();
      } else {
        alert(payload.message || "Action failed");
      }
    } catch (_) {
      alert("Request failed. Try again.");
    } finally {
      setActingId(null);
    }
  };

  const handleGuardedActionClick = (leave, action) => {
    const canAct = leave?.canAct !== false;
    const blockReason =
      leave?.blockReason || "Previous approver in the flow must approve this leave before you can take action.";
    if (!canAct) {
      alert(blockReason);
      return;
    }
    handleAction(leave.id || leave._id, action);
  };

  const show = has("ward_students.leave_approve");
  if (!show) return <p className="ud-empty">You don&apos;t have leave approval access as warden.</p>;

  return (
    <section className="ud-card">
      <h3 className="card-title">Leave approvals (Warden)</h3>
      <p className="card-subtitle">Sick Leave, Emergency Leave, GP — pending your approval as warden</p>

      <div className="mentor-leave-tabs">
        <button
          type="button"
          className={`mentor-leave-tab ${activeTab === TAB_PENDING ? "active" : ""}`}
          onClick={() => setActiveTab(TAB_PENDING)}
        >
          Pending leaves
        </button>
        <button
          type="button"
          className={`mentor-leave-tab ${activeTab === TAB_HISTORY ? "active" : ""}`}
          onClick={() => setActiveTab(TAB_HISTORY)}
        >
          Leaves history
        </button>
      </div>

      {activeTab === TAB_PENDING && (
        !wardenLeaves.length ? (
          <p className="sa-muted">No pending leave requests.</p>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Register no</th>
                  <th>Leave type</th>
                  <th>From - To</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {wardenLeaves.map((l) => (
                  <tr key={l.id || l._id}>
                    <td>{l.student_name || "-"}</td>
                    <td>{l.register_no || "-"}</td>
                    <td>{l.leaveType}</td>
                    <td>{formatDate(l.fromDate)} – {formatDate(l.toDate)}</td>
                    <td>
                      <button type="button" className="sa-btn sa-btn-sm" onClick={() => { setSelectedLeave(l); setSelectedLeaveHistory(false); }}>
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === TAB_HISTORY && (
        !historyLeaves.length ? (
          <p className="sa-muted">No leave history.</p>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Register no</th>
                  <th>Leave type</th>
                  <th>From - To</th>
                  <th>Warden decision</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyLeaves.map((l) => (
                  <tr key={l.id || l._id}>
                    <td>{l.student_name || "-"}</td>
                    <td>{l.register_no || "-"}</td>
                    <td>{l.leaveType}</td>
                    <td>{formatDate(l.fromDate)} – {formatDate(l.toDate)}</td>
                    <td>{l.wardenApproval?.status || "-"}</td>
                    <td>
                      <button type="button" className="sa-btn sa-btn-sm" onClick={() => { setSelectedLeave(l); setSelectedLeaveHistory(true); }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {selectedLeave && (
        <div className="sa-modal-overlay" onClick={() => !actingId && setSelectedLeave(null)}>
          <div className="sa-modal mentor-leave-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>Leave details</h3>
              <button type="button" className="sa-modal-close" onClick={() => !actingId && setSelectedLeave(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="sa-modal-body">
              <dl className="mentor-leave-detail-list">
                <div><dt>Student</dt><dd>{selectedLeave.student_name || "-"}</dd></div>
                <div><dt>Register no</dt><dd>{selectedLeave.register_no || "-"}</dd></div>
                <div><dt>Leave type</dt><dd>{selectedLeave.leaveType || "-"}</dd></div>
                <div><dt>Type</dt><dd>{selectedLeave.type || "Leave"}</dd></div>
                <div><dt>From</dt><dd>{formatDateTime(selectedLeave.fromDate)}</dd></div>
                <div><dt>To</dt><dd>{formatDateTime(selectedLeave.toDate)}</dd></div>
                <div><dt>Remarks</dt><dd>{selectedLeave.remarks || "-"}</dd></div>
                <div><dt>Status</dt><dd>{selectedLeave.status || "Pending"}</dd></div>
                {selectedLeave.mentorApproval?.status && (
                  <div><dt>Mentor approval</dt><dd>{selectedLeave.mentorApproval.status}</dd></div>
                )}
                {selectedLeave.wardenApproval?.status && (
                  <div><dt>Warden approval</dt><dd>{selectedLeave.wardenApproval.status} {selectedLeave.wardenApproval.by ? `by ${selectedLeave.wardenApproval.by}` : ""}</dd></div>
                )}
              </dl>
            </div>
            <div className="sa-modal-footer mentor-leave-modal-footer">
              {selectedLeaveHistory ? (
                <button type="button" className="sa-btn sa-btn-primary" onClick={() => setSelectedLeave(null)}>
                  Close
                </button>
              ) : (
                <>
                  <button type="button" className="sa-btn" onClick={() => setSelectedLeave(null)} disabled={!!actingId}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="sa-btn sa-btn-approve"
                    onClick={() => handleGuardedActionClick(selectedLeave, "Approved")}
                    disabled={!!actingId}
                  >
                    {actingId === (selectedLeave.id || selectedLeave._id) ? "..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    className="sa-btn sa-btn-reject"
                    onClick={() => handleGuardedActionClick(selectedLeave, "Rejected")}
                    disabled={!!actingId}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
