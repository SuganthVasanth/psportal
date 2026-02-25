import React, { useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { Filter } from "lucide-react";
import "./MyLeaves.css";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth"
};

// Leave types: SP (Special), GP (General Purpose), Sick Leave, etc.
export const LEAVE_TYPES = ["SP", "GP", "Sick Leave", "Emergency", "Leave"];

function getParentStatusBadgeClass(parentStatus) {
    if (!parentStatus) return "badge-yellow";
    const s = parentStatus.toLowerCase();
    if (s === "approved") return "badge-green";
    if (s === "rejected") return "badge-red";
    return "badge-yellow"; // Pending or unknown
}

const MOCK_LEAVES = [
    {
        id: 1,
        leaveType: "Sick Leave",
        type: "Leave",
        fromDate: "Feb 21, 2026",
        toDate: "Feb 22, 2026",
        gateIn: "Feb 22, 2026, 05:46 PM",
        duration: "2 days",
        remarks: "Going to hospital",
        parentStatus: "Approved",
        status: "Completed"
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
        gateIn: "Feb 16, 2026, 09:39 PM",
        duration: "1 day",
        remarks: "Going for hospital",
        parentStatus: "Approved",
        status: "Completed"
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
        leaveType: "GP",
        type: "Leave",
        fromDate: "Jan 13, 2026",
        toDate: "Jan 19, 2026",
        gateIn: "Jan 18, 2026, 09:36 PM",
        duration: "6 days",
        remarks: "Going home",
        parentStatus: "Approved",
        status: "Completed"
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

function getDurationDays(fromStr, toStr) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const diff = Math.max(0, Math.ceil((to - from) / (24 * 60 * 60 * 1000))) + 1;
    return diff === 1 ? "1 day" : `${diff} days`;
}

export default function MyLeaves() {
    const [leaves, setLeaves] = useState(() => [...MOCK_LEAVES]);
    const [searchTerm, setSearchTerm] = useState("");
    const [entriesCount, setEntriesCount] = useState(10);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [form, setForm] = useState({
        leaveType: "GP",
        fromDate: "",
        toDate: "",
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
        setForm({ leaveType: "GP", fromDate: "", toDate: "", remarks: "" });
        setShowApplyModal(true);
    };

    const closeApplyModal = () => setShowApplyModal(false);

    const handleApplyLeave = (e) => {
        e.preventDefault();
        if (!form.fromDate || !form.toDate) return;
        const from = new Date(form.fromDate);
        const to = new Date(form.toDate);
        if (to < from) {
            alert("To date must be on or after from date.");
            return;
        }
        const newLeave = {
            id: Date.now(),
            leaveType: form.leaveType,
            type: "Leave",
            fromDate: formatDate(form.fromDate),
            toDate: formatDate(form.toDate),
            gateIn: "-",
            duration: getDurationDays(form.fromDate, form.toDate),
            remarks: form.remarks || "-",
            parentStatus: "Pending",
            status: "Pending"
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
                                </tr>
                            </thead>
                            <tbody>
                                {displayLeaves.map((leave) => (
                                    <tr key={leave.id}>
                                        <td className="leave-type-col">
                                            <span className="chevron-right">&gt;</span> {leave.leaveType}
                                        </td>
                                        <td>
                                            <span className="status-badge badge-blue">{leave.type}</span>
                                        </td>
                                        <td>{leave.fromDate}</td>
                                        <td className="to-date-col">
                                            <div className="date-main">{leave.toDate}</div>
                                            <div className="date-sub">(Gate In: {leave.gateIn})</div>
                                        </td>
                                        <td>{leave.duration}</td>
                                        <td className="remarks-col">{leave.remarks}</td>
                                        <td>
                                            <span className={`status-badge ${getParentStatusBadgeClass(leave.parentStatus)}`}>
                                                {leave.parentStatus || "Pending"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${leave.status === "Completed" ? "badge-green" : "badge-yellow"}`}>
                                                {leave.status}
                                            </span>
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

            {showApplyModal && (
                <div className="leave-modal-overlay" onClick={closeApplyModal}>
                    <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Apply Leave</h2>
                        <form className="leave-modal-form" onSubmit={handleApplyLeave}>
                            <div className="form-group">
                                <label>Leave Type</label>
                                <select
                                    value={form.leaveType}
                                    onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}
                                    required
                                >
                                    {LEAVE_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    value={form.fromDate}
                                    onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    value={form.toDate}
                                    onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Remarks</label>
                                <textarea
                                    placeholder="Reason for leave..."
                                    value={form.remarks}
                                    onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                                />
                            </div>
                            <div className="leave-modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeApplyModal}>Cancel</button>
                                <button type="submit" className="btn-submit">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
