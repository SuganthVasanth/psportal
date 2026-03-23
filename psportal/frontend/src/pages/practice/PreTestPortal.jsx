import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, User, BookOpen, Fingerprint, Play, ArrowLeft } from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import "./PreTestPortal.css";

const API_BASE = "http://localhost:5000";

export default function PreTestPortal() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [error, setError] = useState("");

    const registerNo = (localStorage.getItem("register_no") || "").trim();

    useEffect(() => {
        if (!registerNo || !courseId) {
            setError("Session information missing.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch student profile
                const studentRes = await axios.get(`${API_BASE}/api/dashboard/student?register_no=${encodeURIComponent(registerNo)}`);
                setStudentData(studentRes.data.profile);

                // Fetch specific course to get level/name
                const coursesRes = await axios.get(`${API_BASE}/api/dashboard/my-courses?register_no=${encodeURIComponent(registerNo)}`);
                const myCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
                const currentCourse = myCourses.find(c => String(c.id) === String(courseId));
                setCourseData(currentCourse);

            } catch (err) {
                console.error("Error fetching pre-test data:", err);
                setError("Failed to load portal information.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [registerNo, courseId]);

    if (loading) {
        return (
            <StudentLayout>
                <div className="pre-test-loading">
                    <Loader2 className="animate-spin" size={48} />
                    <p>Preparing your test portal...</p>
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <div className="pre-test-error">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <ArrowLeft size={16} /> Go Back
                    </button>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout hideNav={true}>
            <div className="pre-test-portal-wrapper">
                <div className="pre-test-card-premium">
                    <div className="pre-test-header-accent"></div>

                    <div className="pre-test-content-centered">
                        <div className="student-profile-section-premium">
                            <div className="profile-photo-container-premium">
                                {studentData?.avatarUrl ? (
                                    <img src={studentData.avatarUrl} alt="Student Profile" className="profile-photo-premium" />
                                ) : (
                                    <div className="profile-photo-placeholder-premium">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                            <h1 className="student-name-premium">{studentData?.name || "Student"}</h1>
                            <div className="student-meta-badge-premium">
                                <Fingerprint size={14} />
                                <span>{registerNo}</span>
                            </div>
                        </div>

                        <div className="test-info-section-premium">
                            <div className="test-info-row-premium">
                                <div className="test-info-text-premium">
                                    <span className="test-info-label-premium">Assessment Level</span>
                                    <h2 className="test-info-value-premium">{courseData?.levelName || "Not Found"}</h2>
                                </div>
                            </div>
                            <div className="test-info-row-premium">
                                <div className="test-info-text-premium">
                                    <span className="test-info-label-premium">Course Name</span>
                                    <h2 className="test-info-value-premium">{courseData?.title || "Not Found"}</h2>
                                </div>
                            </div>
                        </div>

                        <div className="pre-test-actions-premium">
                            <button
                                className="start-test-btn-premium"
                                onClick={() => navigate(`/course/${courseId}?launch=true`)}
                            >
                                <Play size={20} />
                                Proceed to Assessment
                            </button>
                            <p className="pre-test-disclaimer-premium">
                                By proceeding, you agree to follow the assessment rules and guidelines.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
