import React, { useState } from "react";
import "./AttendanceDetails.css";

const AttendanceDetails = ({ attendance }) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const convertRecordDateToISO = (recordDate) => {
        if (!recordDate) return "";
        // E.g., "02 Mar 2026"
        const parts = recordDate.split(" ");
        if (parts.length !== 3) return recordDate;
        const [day, monthStr, year] = parts;
        const monthIndex = months.indexOf(monthStr) + 1;
        const month = String(monthIndex).padStart(2, "0");
        return `${year}-${month}-${day.padStart(2, "0")}`;
    };

    // Determine today in YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayString = `${yyyy}-${mm}-${dd}`;

    // On mount, default to today
    let initialDate = todayString;

    const [selectedDate, setSelectedDate] = useState(initialDate);

    if (!attendance) {
        return <div className="text-gray.500">No attendance data available.</div>;
    }

    const formatDateForRecord = (dateStringYYYYMMDD) => {
        if (!dateStringYYYYMMDD) return "";
        const [y, m, d] = dateStringYYYYMMDD.split('-');
        return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
    };

    let filteredRecords = attendance.records.filter(
        r => convertRecordDateToISO(r.date) === selectedDate
    );

    // If selected date lacks records (e.g., future or unrecorded past holidays), show all as "Absent"
    if (filteredRecords.length === 0) {
        const standardSessions = [
            { time: "Biometric - FN", shift: "Forenoon", status: "Absent" },
            { time: "Biometric - AN", shift: "Afternoon", status: "Absent" },
            { time: "08:45 Am to 09:35 Am", shift: "Forenoon", status: "Absent" },
            { time: "09:35 Am to 10:25 Am", shift: "Forenoon", status: "Absent" },
            { time: "10:40 Am to 11:30 Am", shift: "Forenoon", status: "Absent" },
            { time: "11:30 Am to 12:20 Pm", shift: "Forenoon", status: "Absent" },
            { time: "01:30 Pm to 02:20 Pm", shift: "Afternoon", status: "Absent" },
            { time: "02:20 Pm to 03:10 Pm", shift: "Afternoon", status: "Absent" },
            { time: "03:25 Pm to 04:25 Pm", shift: "Afternoon", status: "Absent" }
        ];

        filteredRecords = [{
            date: selectedDate,
            sessions: standardSessions
        }];
    }

    const targetDateFormatted = formatDateForRecord(selectedDate);

    return (
        <div className="attendance-details-container">
            {/* Top Stat Cards */}
            <div className="attendance-stats-grid">
                <div className="attendance-stat-card">
                    <div className="stat-value highlight-purple">
                        {attendance.percentage}<span className="percent-sign">%</span>
                    </div>
                    <div className="stat-label">Attendance</div>
                </div>
                <div className="attendance-stat-card">
                    <div className="stat-value highlight-purple">{attendance.presentDays}</div>
                    <div className="stat-label">Present</div>
                </div>
                <div className="attendance-stat-card">
                    <div className="stat-value highlight-purple">{attendance.absentDays}</div>
                    <div className="stat-label">Absent</div>
                </div>
            </div>

            {/* Attendance Records List */}
            <div className="attendance-records-list">
                <div className="attendance-day-group">
                    <div className="attendance-date-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{targetDateFormatted}</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #edf2f7',
                                color: '#4a5568',
                                fontSize: '14px',
                                outline: 'none',
                                cursor: 'pointer',
                                background: '#f7fafc',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => (
                            <div key={index} className="sessions-list">
                                {record.sessions.map((session, sIdx) => (
                                    <div key={sIdx} className="session-card">
                                        <div className="session-main-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div className="session-info-left">
                                                <div className="session-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                </div>
                                                <div className="session-details">
                                                    <div className="session-time-col">
                                                        <div className="session-time">{session.time}</div>
                                                        <div className="session-shift">{session.shift}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="session-status-right">
                                                <span className={`session-badge ${session.status.toLowerCase()}`}>
                                                    <span className="dot">●</span> {session.status}
                                                </span>
                                            </div>
                                        </div>

                                        {session.markedBy && (
                                            <div className="session-marked-by">
                                                <span className="marked-label">Marked by:</span>
                                                <span className="marked-name">{session.markedBy}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#718096', fontSize: '14px', background: '#ffffff', borderRadius: '12px', border: '1px solid #edf2f7', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                            No attendance records found for this date.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceDetails;
