import React, { useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { Filter } from "lucide-react";
import "./MyLeaves.css";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth"
};

const MOCK_LEAVES = [
    {
        id: 1,
        leaveType: "Leave",
        type: "Leave",
        fromDate: "Feb 21, 2026",
        toDate: "Feb 22, 2026",
        gateIn: "Feb 22, 2026, 05:46 PM",
        duration: "2 days",
        remarks: "Going to hospital",
        parentStatus: "Pending",
        status: "Completed"
    },
    {
        id: 2,
        leaveType: "Leave",
        type: "Leave",
        fromDate: "Feb 18, 2026",
        toDate: "Feb 19, 2026",
        gateIn: "Feb 18, 2026, 06:37 PM",
        duration: "2 days",
        remarks: "Going to hospital",
        parentStatus: "Pending",
        status: "Completed"
    },
    {
        id: 3,
        leaveType: "Leave",
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
        leaveType: "Leave",
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
        id: 5,
        leaveType: "Leave",
        type: "Leave",
        fromDate: "Feb 7, 2026",
        toDate: "Feb 9, 2026",
        gateIn: "Feb 8, 2026, 06:49 PM",
        duration: "2 days",
        remarks: "Going for a marriage function",
        parentStatus: "Pending",
        status: "Completed"
    },
    {
        id: 6,
        leaveType: "Leave",
        type: "Leave",
        fromDate: "Jan 24, 2026",
        toDate: "Jan 27, 2026",
        gateIn: "Jan 26, 2026, 05:02 PM",
        duration: "4 days",
        remarks: "Going Home",
        parentStatus: "Pending",
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
        parentStatus: "Pending",
        status: "Completed"
    },
    {
        id: 8,
        leaveType: "Leave",
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
        leaveType: "Leave",
        type: "Leave",
        fromDate: "Jan 9, 2026",
        toDate: "Jan 10, 2026",
        gateIn: "Jan 9, 2026, 08:02 PM",
        duration: "1 day",
        remarks: "Goin to hospital",
        parentStatus: "Pending",
        status: "Completed"
    },
    {
        id: 10,
        leaveType: "Leave",
        type: "Leave",
        fromDate: "Dec 31, 2025",
        toDate: "Jan 5, 2026",
        gateIn: "Jan 4, 2026, 06:08 PM",
        duration: "6 days",
        remarks: "Going home",
        parentStatus: "Pending",
        status: "Completed"
    }
];

export default function MyLeaves() {
    const [searchTerm, setSearchTerm] = useState("");
    const [entriesCount, setEntriesCount] = useState(10);

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
                        <button className="apply-leave-btn">Apply Leave</button>
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
                                {MOCK_LEAVES.map((leave) => (
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
                                            <span className="status-badge badge-yellow">{leave.parentStatus}</span>
                                        </td>
                                        <td>
                                            <span className="status-badge badge-green">{leave.status}</span>
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
                                Showing 1 to 10 of 11 entries
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
        </div>
    );
}
