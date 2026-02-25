import React, { useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { Filter, Trash2 } from "lucide-react";
import "./MyLeaves.css";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth"
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

const MOCK_LEAVES = [
    {
        id: 1,
        leaveType: "SP",
        type: "Leave",
        fromDate: "Feb 21, 2026",
        toDate: "Feb 25, 2026",
        fromDateFull: "Feb 21, 2026, 04:31 PM",
        toDateFull: "Feb 25, 2026, 08:30 AM",
        gateOut: "-",
        gateIn: "Feb 24, 2026, 06:50 PM",
        duration: "4 days",
        remarks: "family function",
        parentStatus: "Approved",
        status: "Approved",
        wardenApproval: { status: "Approved", by: "AD11116 - PRIYADHARSHNI S" },
        mentorApproval: { status: "Approved", by: "EC10811 - POUSIA S" }
    },
    {
        id: 2,
        leaveType: "Sick Leave",
        type: "Leave",
        fromDate: "Feb 18, 2026",
        toDate: "Feb 19, 2026",
        gateIn: "Feb 18, 2026, 06:37 PM",
        duration: "2 days",
        remarks: "Going to hospital",
        parentStatus: "Rejected",
        status: "Completed"
    },
    {
        id: 3,
        leaveType: "GP",
        type: "Leave",
        fromDate: "Feb 16, 2026",
        toDate: "Feb 17, 2026",
        gateIn: "Feb 16, 2026, 09:39 PM",
        duration: "1 day",
        remarks: "Going for hospital",
        parentStatus: "Pending",
        status: "Completed"
    },
    {
        id: 4,
        leaveType: "SP",
        type: "Leave",
        fromDate: "Feb 16, 2026",
        toDate: "Feb 17, 2026",
        fromDateFull: "Feb 16, 2026, 09:00 AM",
        toDateFull: "Feb 17, 2026, 06:00 PM",
        gateOut: "-",
        gateIn: "Feb 16, 2026, 09:39 PM",
        duration: "1 day",
        remarks: "Going for hospital",
        parentStatus: "Approved",
        status: "Completed",
        wardenApproval: { status: "Approved", by: "AD11116 - PRIYADHARSHNI S" },
        mentorApproval: { status: "Approved", by: "EC10811 - POUSIA S" }
    },
    {
        id: 5,
        leaveType: "GP",
        type: "Leave",
        fromDate: "Feb 7, 2026",
        toDate: "Feb 9, 2026",
        gateIn: "Feb 8, 2026, 06:49 PM",
        duration: "2 days",
        remarks: "Going for a marriage function",
        parentStatus: "Approved",
        status: "Completed"
    },
    {
        id: 6,
        leaveType: "GP",
        type: "Leave",
        fromDate: "Jan 24, 2026",
        toDate: "Jan 27, 2026",
        gateIn: "Jan 26, 2026, 05:02 PM",
        duration: "4 days",
        remarks: "Going Home",
        parentStatus: "Rejected",
        status: "Completed"
    },
    {
        id: 7,
        leaveType: "OnDuty - Technical Competition",
        type: "OD",
        fromDate: "Jan 13, 2026",
        toDate: "Jan 19, 2026",
        fromDateFull: "Jan 13, 2026, 09:00 AM",
        toDateFull: "Jan 19, 2026, 05:00 PM",
        gateOut: "-",
        gateIn: "Jan 18, 2026, 09:36 PM",
        duration: "6 days",
        remarks: "Duty - Technical Competition",
        parentStatus: "Approved",
        status: "Approved",
        wardenApproval: { status: "Approved", by: "AD11116 - PRIYADHARSHNI S" },
        mentorApproval: { status: "Approved", by: "EC10811 - POUSIA S" }
    },
    {
        id: 8,
        leaveType: "Sick Leave",
        type: "Leave",
        fromDate: "Jan 11, 2026",
        toDate: "Jan 11, 2026",
        gateIn: "Jan 11, 2026, 07:53 PM",
        duration: "1 day",
        remarks: "Going to hospital",
        parentStatus: "Pending",
        status: "Completed"
    },
    {
        id: 9,
        leaveType: "Emergency",
        type: "Leave",
        fromDate: "Jan 9, 2026",
        toDate: "Jan 10, 2026",
        gateIn: "Jan 9, 2026, 08:02 PM",
        duration: "1 day",
        remarks: "Going to hospital",
        parentStatus: "Approved",
        status: "Completed"
    },
    {
        id: 10,
        leaveType: "SP",
        type: "Leave",
        fromDate: "Dec 31, 2025",
        toDate: "Jan 5, 2026",
        gateIn: "Jan 4, 2026, 06:08 PM",
        duration: "6 days",
        remarks: "Going home",
        parentStatus: "Approved",
        status: "Completed"
    }
];

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
    const [leaves, setLeaves] = useState(() => [...MOCK_LEAVES]);
    const [searchTerm, setSearchTerm] = useState("");
    const [entriesCount, setEntriesCount] = useState(10);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [form, setForm] = useState({
        leaveType: "Sick Leave",
        fromDateTime: "",
        toDateTime: "",
        remarks: ""
    });

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
        setShowApplyModal(true);
    };

    const closeApplyModal = () => setShowApplyModal(false);
    const openDetailsModal = (leave) => setSelectedLeave(leave);
    const closeDetailsModal = () => setSelectedLeave(null);

    const handleDeleteLeave = (e, leaveId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this leave?")) return;
        setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
        if (selectedLeave?.id === leaveId) closeDetailsModal();
    };

    const handleApplyLeave = (e) => {
        e.preventDefault();
        if (!form.fromDateTime || !form.toDateTime) return;
        const from = new Date(form.fromDateTime);
        const to = new Date(form.toDateTime);
        if (to < from) {
            alert("To date & time must be on or after from date & time.");
            return;
        }
        const isOnDuty = form.leaveType && String(form.leaveType).startsWith("OnDuty");
        const newLeave = {
            id: Date.now(),
            leaveType: form.leaveType,
            type: isOnDuty ? "OD" : "Leave",
            fromDate: formatDate(form.fromDateTime),
            toDate: formatDate(form.toDateTime),
            fromDateFull: formatDateTime(form.fromDateTime),
            toDateFull: formatDateTime(form.toDateTime),
            gateOut: "-",
            gateIn: "-",
            duration: getDurationDays(form.fromDateTime, form.toDateTime),
            remarks: form.remarks || "-",
            parentStatus: "Pending",
            status: "Pending",
            wardenApproval: null,
            mentorApproval: null
        };
        setLeaves((prev) => [newLeave, ...prev]);
        closeApplyModal();
    };

    return (
        <div className="dashboard-layout leaves-layout">
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                    <span>PCDP Portal</span>
                </div>
                <div className="top-nav-profile">
                    <img src={MOCK_PROFILE.avatarUrl} alt="Profile" className="profile-avatar" />
                    <div className="profile-info">
                        <span className="profile-id">{MOCK_PROFILE.register_no}</span>
                        <span className="profile-name">{MOCK_PROFILE.name}</span>
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
                                                setLeaves((prev) => prev.filter((l) => l.id !== selectedLeave.id));
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
                                <button type="button" className="btn-cancel" onClick={closeApplyModal}>Cancel</button>
                                <button type="submit" className="btn-submit-leave">Submit Leave Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
