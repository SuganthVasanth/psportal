import React, { useState, useEffect } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { Clock, X } from "lucide-react";
import "./MovementPass.css";

const MOCK_PROFILE = {
    _id: "S_7376231CS323", // Matches backend format usually for tests
    register_no: "7376231CS323",
    name: "SUGANTH R",
    dept: "Computer Science and Engineering",
    avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png"
};

const MovementPass = () => {
    const [passes, setPasses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPass, setSelectedPass] = useState(null);
    const [newPassForm, setNewPassForm] = useState({
        startTime: "",
        purpose: ""
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPasses();
    }, []);

    const fetchPasses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/movement-pass/student/${MOCK_PROFILE._id}`);
            if (res.ok) {
                const data = await res.json();
                setPasses(data);
            }
        } catch (error) {
            console.error("Failed to fetch passes:", error);
        } finally {
            setLoading(false);
        }
    };

    const timeToMinutes = (timeStr) => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        let [hours, minutes] = timeStr.split(':');
        if (minutes.toLowerCase().includes('pm')) {
            hours = parseInt(hours);
            if (hours !== 12) hours += 12;
            minutes = parseInt(minutes);
        } else if (minutes.toLowerCase().includes('am')) {
            hours = parseInt(hours);
            if (hours === 12) hours = 0;
            minutes = parseInt(minutes);
        }
        return parseInt(hours) * 60 + parseInt(minutes);
    };

    // Dynamically check and update pass expiration every minute on the frontend
    useEffect(() => {
        const interval = setInterval(() => {
            setPasses(prevPasses => prevPasses.map(pass => {
                if (pass.status === 'Expired') return pass;

                const now = new Date();
                // Check if the pass is from today (or earlier, which backend handles, but to be sure)
                const todayStr = now.toDateString();
                const passDateStr = new Date(pass.date).toDateString();

                if (passDateStr !== todayStr) return { ...pass, status: 'Expired' };

                const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
                const expireMinutes = timeToMinutes(pass.endTime);

                if (currentTotalMinutes >= expireMinutes) {
                    return { ...pass, status: 'Expired' };
                }

                return pass;
            }));
        }, 10000); // Check every 10 seconds for a snappy UI response

        return () => clearInterval(interval);
    }, []);

    const handleCreatePass = async (e) => {
        e.preventDefault();
        setError(null);

        // Time Validation: must be strictly greater than current time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        const [selectedHours, selectedMinutes] = newPassForm.startTime.split(':').map(Number);

        if (selectedHours < currentHours || (selectedHours === currentHours && selectedMinutes <= currentMinutes)) {
            setError("Time should be greater than the current time");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/movement-pass/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: MOCK_PROFILE._id,
                    startTime: newPassForm.startTime,
                    purpose: newPassForm.purpose
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Failed to create pass.");
                return;
            }

            // Immediately close and refresh list
            setIsModalOpen(false);
            setNewPassForm({ startTime: "", purpose: "" });
            fetchPasses();

        } catch (error) {
            setError("Network error. Please try again.");
            console.error(error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: '2-digit',
            month: 'short'
        }); // e.g. "26 Feb"
    };

    const formatFullDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }); // e.g. "26 Feb 2025"
    };

    return (
        <div className="dashboard-layout">
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

            <main className="dashboard-main-area">
                <div className="courses-container mp-container">

                    <div className="mp-header-row">
                        <h1 className="mp-page-title">Movement Pass</h1>
                        <button className="mp-create-btn" onClick={() => setIsModalOpen(true)}>
                            Create New Pass
                        </button>
                    </div>

                    <div className="mp-passes-grid">
                        {loading ? (
                            <p>Loading passes...</p>
                        ) : passes.length === 0 ? (
                            <p className="no-passes-text">No movement passes found.</p>
                        ) : (
                            passes.map(pass => (
                                <div className="mp-pass-card" key={pass._id} onClick={() => setSelectedPass(pass)}>
                                    <div className="mp-pass-time">
                                        {formatDate(pass.date)} - {pass.startTime} to {pass.endTime}
                                    </div>
                                    <div className="mp-pass-purpose">
                                        {pass.purpose.length > 60 ? pass.purpose.slice(0, 60) + '...' : pass.purpose}
                                    </div>

                                    <div className="mp-pass-footer">
                                        <span className={`mp-status-badge ${pass.status === 'Expired' ? 'expired' : 'active'}`}>
                                            {pass.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Create Movement Pass</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePass} className="modal-body">

                            <div className="form-group">
                                <label>Select Time</label>
                                <div className="time-input-wrapper">
                                    <input
                                        type="time"
                                        required
                                        value={newPassForm.startTime}
                                        onChange={(e) => setNewPassForm({ ...newPassForm, startTime: e.target.value })}
                                    />
                                    <Clock size={16} className="clock-icon" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Purpose</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newPassForm.purpose}
                                    onChange={(e) => setNewPassForm({ ...newPassForm, purpose: e.target.value })}
                                />
                            </div>

                            {error && <div className="modal-error">{error}</div>}

                            <div className="modal-actions">
                                <button type="submit" className="submit-btn">
                                    Create Pass
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedPass && (
                <div className="modal-overlay">
                    <div className="modal-content details-modal">
                        <div className="modal-header">
                            <div className="details-header-title">
                                <h2>Movement Pass</h2>
                                <span className={`mp-status-badge ${selectedPass.status === 'Expired' ? 'expired' : 'active'}`}>
                                    {selectedPass.status}
                                </span>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedPass(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body details-body">
                            <div className="detail-row">
                                <span className="detail-label">User Id:</span>
                                <span className="detail-value">{MOCK_PROFILE.register_no}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{MOCK_PROFILE.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Dept:</span>
                                <span className="detail-value">{MOCK_PROFILE.dept}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date:</span>
                                <span className="detail-value">{formatFullDate(selectedPass.date)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Timing:</span>
                                <span className="detail-value">{selectedPass.startTime} to {selectedPass.endTime}</span>
                            </div>

                            <hr className="detail-divider" />

                            <div className="detail-reason-section">
                                <span className="detail-label">Reason:</span>
                                <p className="detail-purpose">{selectedPass.purpose}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovementPass;
