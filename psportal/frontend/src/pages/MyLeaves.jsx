import React, { useState, useEffect } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { Filter, Trash2 } from "lucide-react";
import "./MyLeaves.css";

const API_BASE = "http://localhost:5000";

const FALLBACK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png"
};

// Leave types as per reference (Apply for Leave dropdown)
export const LEAVE_TYPES = [
    "Sick Leave",
    "Emergency Leave",
    "SP",
    "GP",
    "OnDuty - Events",
    "OnDuty - Project Competition",
    "OnDuty - Internship",
    "OnDuty - Paper Presentation",
    "OnDuty - Technical Competition",
    "Leave"
];

// TYPE column: Leave = blue, OD (OnDuty) = purple
function getTypeBadgeClass(typeOrLeaveType) {
    const t = typeOrLeaveType || "";
    if (t === "OD" || String(t).startsWith("OnDuty")) return "badge-purple";
    return "badge-blue";
}

function getTypeDisplay(leave) {
    if (leave.type === "OD") return "OD";
    if (leave.leaveType && String(leave.leaveType).startsWith("OnDuty")) return "OD";
    return leave.type || "Leave";
}

// PARENT STATUS: Approved=green, Rejected=red, Pending=yellow
function getParentStatusBadgeClass(parentStatus) {
    if (!parentStatus) return "badge-yellow";
    const s = String(parentStatus).toLowerCase();
    if (s === "approved") return "badge-green";
    if (s === "rejected") return "badge-red";
    return "badge-yellow";
}

// STATUS column: Approved/Completed=green, Rejected=red, Pending=yellow
function getStatusBadgeClass(status) {
    if (!status) return "badge-yellow";
    const s = String(status).toLowerCase();
    if (s === "approved" || s === "completed") return "badge-green";
    if (s === "rejected") return "badge-red";
    return "badge-yellow";
}

function formatDate(d) {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(datetimeStr) {
    if (!datetimeStr) return "";
    const d = new Date(datetimeStr);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${date}, ${time}`;
}

function getDurationDays(fromStr, toStr) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const diffMs = Math.max(0, to - from);
    const fullDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    if (fullDays < 1) return "1 day";
    return fullDays === 1 ? "1 day" : `${fullDays} days`;
}

export default function MyLeaves() {
    const [registerNo, setRegisterNo] = useState(() => localStorage.getItem("register_no"));
    const studentName = localStorage.getItem("userName") || "";

    const [profile, setProfile] = useState(FALLBACK_PROFILE);
    const [leaves, setLeaves] = useState([]);
    const [leavesLoading, setLeavesLoading] = useState(true);

    // If logged in but register_no missing (e.g. old session), fetch it from /api/auth/me
    useEffect(() => {
        if (registerNo) return;
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data?.register_no) {
                    localStorage.setItem("register_no", data.register_no);
                    setRegisterNo(data.register_no);
                }
            })
            .catch(() => {});
    }, [registerNo]);
    const [searchTerm, setSearchTerm] = useState("");
    const [entriesCount, setEntriesCount] = useState(10);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyError, setApplyError] = useState("");
    const [applySubmitting, setApplySubmitting] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [form, setForm] = useState({
        leaveType: "Sick Leave",
        fromDateTime: "",
        toDateTime: "",
        remarks: ""
    });

    useEffect(() => {
        if (registerNo) {
            fetch(`${API_BASE}/api/dashboard/student?register_no=${encodeURIComponent(registerNo)}`)
                .then((r) => r.ok ? r.json() : null)
                .then((data) => {
                    if (data?.profile) setProfile({ ...FALLBACK_PROFILE, ...data.profile, register_no: data.profile.register_no || registerNo });
                })
                .catch(() => {});
        }
    }, [registerNo]);

    useEffect(() => {
        if (!registerNo) {
            setLeavesLoading(false);
            return;
        }
        setLeavesLoading(true);
        fetch(`${API_BASE}/api/leaves/my-leaves?register_no=${encodeURIComponent(registerNo)}`)
            .then((r) => r.ok ? r.json() : [])
            .then((data) => setLeaves(Array.isArray(data) ? data : []))
            .catch(() => setLeaves([]))
            .finally(() => setLeavesLoading(false));
    }, [registerNo]);

    const filteredLeaves = searchTerm.trim()
        ? leaves.filter(
            (leave) =>
                (leave.leaveType && leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (leave.remarks && leave.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : leaves;
    const displayLeaves = filteredLeaves.slice(0, Number(entriesCount));

    const openApplyModal = () => {
        setForm({ leaveType: "Sick Leave", fromDateTime: "", toDateTime: "", remarks: "" });
        setApplyError("");
        setShowApplyModal(true);
    };

    const closeApplyModal = () => setShowApplyModal(false);
    const openDetailsModal = (leave) => setSelectedLeave(leave);
    const closeDetailsModal = () => setSelectedLeave(null);

    const handleDeleteLeave = async (e, leaveId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this leave?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/leaves/${leaveId}`, { method: "DELETE" });
            if (res.ok) {
                setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
                if (selectedLeave?.id === leaveId) closeDetailsModal();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.message || "Failed to delete leave.");
            }
        } catch (_) {
            alert("Failed to delete leave.");
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        setApplyError("");
        if (!form.fromDateTime || !form.toDateTime) {
            setApplyError("Please select from and to date & time.");
            return;
        }
        const from = new Date(form.fromDateTime);
        const to = new Date(form.toDateTime);
        if (to < from) {
            setApplyError("To date & time must be on or after from date & time.");
            return;
        }
        if (!registerNo) {
            setApplyError("Please log in to apply for leave.");
            return;
        }
        setApplySubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/leaves/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    register_no: registerNo,
                    student_name: studentName,
                    leaveType: form.leaveType,
                    fromDateTime: form.fromDateTime,
                    toDateTime: form.toDateTime,
                    remarks: form.remarks || "",
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setLeaves((prev) => [data, ...prev]);
                closeApplyModal();
            } else {
                setApplyError(data.message || "Failed to apply leave. You may already have a leave for this time period.");
            }
        } catch (_) {
            setApplyError("Could not reach server. Try again.");
        } finally {
            setApplySubmitting(false);
        }
    };

    return (
        <div className="dashboard-layout leaves-layout">
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                    <span>PCDP Portal</span>
                </div>
                <div className="top-nav-profile">
                    <img src={profile.avatarUrl} alt="Profile" className="profile-avatar" />
                    <div className="profile-info">
                        <span className="profile-id">{profile.register_no}</span>
                        <span className="profile-name">{profile.name}</span>
                    </div>
                </div>
            </header>

            <StudentSidebar />

            <main className="dashboard-main-area leaves-main">
                <div className="leaves-container">
                    <div className="leaves-header-row">
                        <h1 className="leaves-page-title">My Leaves</h1>
                        <button type="button" className="apply-leave-btn" onClick={openApplyModal}>Apply Leave</button>
                    </div>

                    <div className="leaves-search-card">
                        <label>Search</label>
                        <input
                            type="text"
                            placeholder="Search by leave type or remarks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="leaves-search-input"
                        />
                    </div>

                    {leavesLoading ? (
                        <p className="leaves-loading">Loading leaves...</p>
                    ) : (
                    <div className="leaves-table-wrapper">
                        <table className="leaves-table">
                            <thead>
                                <tr>
                                    <th>LEAVE TYPE <Filter size={14} className="filter-icon" /></th>
                                    <th>TYPE <Filter size={14} className="filter-icon" /></th>
                                    <th>FROM DATE <Filter size={14} className="filter-icon" /></th>
                                    <th>TO DATE <Filter size={14} className="filter-icon" /></th>
                                    <th>DURATION <Filter size={14} className="filter-icon" /></th>
                                    <th>REMARKS <Filter size={14} className="filter-icon" /></th>
                                    <th>PARENT STATUS</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayLeaves.map((leave) => (
                                    <tr key={leave.id} onClick={() => openDetailsModal(leave)} className="leave-row-clickable">
                                        <td className="leave-type-col">
                                            <span className="chevron-right">&gt;</span> {leave.leaveType}
                                        </td>
                                        <td>
                                            <span className={`leave-status-badge ${getTypeBadgeClass(leave.type || leave.leaveType)}`}>{getTypeDisplay(leave)}</span>
                                        </td>
                                        <td>{leave.fromDate}</td>
                                        <td className="to-date-col">
                                            <div className="date-main">{leave.toDate}</div>
                                            <div className="date-sub">(Gate In: {leave.gateIn})</div>
                                        </td>
                                        <td>{leave.duration}</td>
                                        <td className="remarks-col">{leave.remarks}</td>
                                        <td className="leave-cell-badge">
                                            <span className={`leave-status-badge leave-parent-status ${getParentStatusBadgeClass(leave.parentStatus)}`}>
                                                {leave.parentStatus ?? "Pending"}
                                            </span>
                                        </td>
                                        <td className="leave-cell-badge">
                                            <span className={`leave-status-badge leave-approval-status ${getStatusBadgeClass(leave.status)}`}>
                                                {leave.status ?? "Pending"}
                                            </span>
                                        </td>
                                        <td className="leave-actions-cell" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                className="leave-delete-btn"
                                                onClick={(e) => handleDeleteLeave(e, leave.id)}
                                                title="Delete leave"
                                                aria-label="Delete leave"
                                            >
                                                <Trash2 size={16} />
                                                <span>Delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="leaves-pagination-row">
                            <div className="entries-select">
                                <span>Show </span>
                                <select
                                    value={entriesCount}
                                    onChange={(e) => setEntriesCount(e.target.value)}
                                    className="entries-dropdown"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span> entries</span>
                            </div>

                            <div className="entries-info">
                                Showing 1 to {displayLeaves.length} of {filteredLeaves.length} entries
                            </div>

                            <div className="pagination-controls">
                                <button className="paginate-btn disabled">Previous</button>
                                <button className="paginate-btn active">1</button>
                                <button className="paginate-btn">2</button>
                                <button className="paginate-btn">Next</button>
                            </div>
                        </div>

                    </div>
                    )}
                </div>
            </main>

            {selectedLeave && (
                <div className="leave-modal-overlay" onClick={closeDetailsModal}>
                    <div className="leave-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="leave-details-header">
                            <h2>Leave Details - {selectedLeave.leaveType}</h2>
                            <button type="button" className="leave-details-close" onClick={closeDetailsModal} aria-label="Close">×</button>
                        </div>
                        <div className="leave-details-body">
                            <div className="leave-details-row">
                                <span className="leave-details-label">Leave Type</span>
                                <span className="leave-details-value">{selectedLeave.leaveType}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">Type</span>
                                <span className={`leave-status-badge ${getTypeBadgeClass(selectedLeave.type || selectedLeave.leaveType)}`}>{getTypeDisplay(selectedLeave)}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">From Date</span>
                                <span className="leave-details-value">{selectedLeave.fromDateFull || selectedLeave.fromDate}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">To Date</span>
                                <span className="leave-details-value">{selectedLeave.toDateFull || selectedLeave.toDate}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">Gate Out</span>
                                <span className="leave-details-value">{selectedLeave.gateOut ?? "-"}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">Gate In</span>
                                <span className="leave-details-value">{selectedLeave.gateIn ?? "-"}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">Duration</span>
                                <span className="leave-details-value">{selectedLeave.duration}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">Status</span>
                                <span className={`leave-status-badge ${getStatusBadgeClass(selectedLeave.status)}`}>{selectedLeave.status ?? "Pending"}</span>
                            </div>
                            <div className="leave-details-row">
                                <span className="leave-details-label">Remarks</span>
                                <span className="leave-details-value">{selectedLeave.remarks ?? "-"}</span>
                            </div>
                            {(selectedLeave.status === "Pending" || selectedLeave.parentStatus === "Pending") && (
                                <div className="leave-details-cancel-row">
                                    <button
                                        type="button"
                                        className="leave-cancel-leave-btn"
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to cancel this leave?")) {
                                                handleDeleteLeave({ stopPropagation: () => {} }, selectedLeave.id);
                                                closeDetailsModal();
                                            }
                                        }}
                                    >
                                        Cancel leave
                                    </button>
                                </div>
                            )}
                            <div className="leave-details-approval-section">
                                <div className="leave-details-approval-block">
                                    <span className="leave-details-approval-title">Hostel Warden</span>
                                    {selectedLeave.wardenApproval ? (
                                        <>
                                            <span className={`leave-status-badge ${getParentStatusBadgeClass(selectedLeave.wardenApproval.status)}`}>{selectedLeave.wardenApproval.status}</span>
                                            <span className="leave-details-approval-by">{selectedLeave.wardenApproval.by}</span>
                                            <span className="leave-details-approval-label">Approved by: {selectedLeave.wardenApproval.by}</span>
                                        </>
                                    ) : (
                                        <span className="leave-status-badge badge-yellow">Pending</span>
                                    )}
                                </div>
                                <div className="leave-details-approval-block">
                                    <span className="leave-details-approval-title">Mentor</span>
                                    {selectedLeave.mentorApproval ? (
                                        <>
                                            <span className={`leave-status-badge ${getParentStatusBadgeClass(selectedLeave.mentorApproval.status)}`}>{selectedLeave.mentorApproval.status}</span>
                                            <span className="leave-details-approval-by">{selectedLeave.mentorApproval.by}</span>
                                            <span className="leave-details-approval-label">Approved by: {selectedLeave.mentorApproval.by}</span>
                                        </>
                                    ) : (
                                        <span className="leave-status-badge badge-yellow">Pending</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showApplyModal && (
                <div className="leave-modal-overlay" onClick={closeApplyModal}>
                    <div className="leave-modal leave-apply-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="leave-apply-header">
                            <h2>Apply for Leave</h2>
                            <button type="button" className="leave-details-close" onClick={closeApplyModal} aria-label="Close">×</button>
                        </div>
                        <form className="leave-modal-form" onSubmit={handleApplyLeave}>
                            {applyError && <div className="leave-apply-error">{applyError}</div>}
                            <div className="form-group">
                                <label>Leave Type</label>
                                <select
                                    value={form.leaveType}
                                    onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}
                                    required
                                    className="leave-type-select"
                                >
                                    {LEAVE_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group form-row-datetime">
                                <div className="form-group-inline">
                                    <label>From (Date & Time)</label>
                                    <input
                                        type="datetime-local"
                                        value={form.fromDateTime}
                                        onChange={(e) => setForm((f) => ({ ...f, fromDateTime: e.target.value }))}
                                        required
                                        className="input-datetime"
                                    />
                                </div>
                                <div className="form-group-inline">
                                    <label>To (Date & Time)</label>
                                    <input
                                        type="datetime-local"
                                        value={form.toDateTime}
                                        onChange={(e) => setForm((f) => ({ ...f, toDateTime: e.target.value }))}
                                        required
                                        className="input-datetime"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Remarks</label>
                                <textarea
                                    placeholder="Enter reason for leave"
                                    value={form.remarks}
                                    onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                                    className="input-remarks"
                                />
                            </div>
                            <div className="leave-modal-actions leave-apply-actions">
                                <button type="button" className="btn-cancel" onClick={closeApplyModal} disabled={applySubmitting}>Cancel</button>
                                <button type="submit" className="btn-submit-leave" disabled={applySubmitting}>{applySubmitting ? "Submitting…" : "Submit Leave Request"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
