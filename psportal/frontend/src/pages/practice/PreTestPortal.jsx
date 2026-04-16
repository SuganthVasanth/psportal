import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Loader2,
    ArrowLeft,
    ArrowRight,
    Check,
    GraduationCap,
    BarChart3,
    ShieldCheck,
    History,
} from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import API from "../../services/api";
import "./PreTestPortal.css";

function difficultyLabel(levelIndex, levelName) {
    const n = (levelName || "").toLowerCase();
    if (/advanced|expert|hard/.test(n)) return "ADVANCED";
    if (/beginner|foundation|basic/.test(n)) return "BEGINNER";
    if (/intermediate|1-a|1-b|level\s*[12]/.test(n)) return "INTERMEDIATE";
    if (levelIndex <= 0) return "BEGINNER";
    if (levelIndex === 1) return "INTERMEDIATE";
    return "ADVANCED";
}

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
                const studentRes = await API.get(
                    `/api/dashboard/student?register_no=${encodeURIComponent(registerNo)}`
                );
                setStudentData(studentRes.data.profile);

                const coursesRes = await API.get(
                    `/api/dashboard/my-courses?register_no=${encodeURIComponent(registerNo)}`
                );
                const myCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
                const currentCourse = myCourses.find((c) => String(c.id) === String(courseId));
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

    const durationMin = courseData?.durationMinutes ?? 60;
    const questionCount = courseData?.questionsPerAssessment ?? 5;
    const levelName = courseData?.levelName || "—";
    const courseTitle = courseData?.title || "—";
    const levelIdx = courseData?.levelIndex ?? 0;
    const tier = useMemo(
        () => difficultyLabel(levelIdx, levelName),
        [levelIdx, levelName]
    );

    const avatarSrc = useMemo(() => {
        if (studentData?.avatarUrl) return studentData.avatarUrl;
        const name = encodeURIComponent(studentData?.name || "Student");
        return `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=fff&size=128`;
    }, [studentData?.avatarUrl, studentData?.name]);

    if (loading) {
        return (
            <StudentLayout>
                <div className="apt-loading">
                    <Loader2 className="apt-loading-icon" size={40} strokeWidth={2} />
                    <p>Preparing your assessment preview…</p>
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <div className="apt-error">
                    <h2>Something went wrong</h2>
                    <p>{error}</p>
                    <button type="button" onClick={() => navigate(-1)} className="apt-error-back">
                        <ArrowLeft size={18} strokeWidth={2.2} />
                        Go back
                    </button>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout hideNav>
            <div className="apt-shell">
                <header className="apt-topbar">
                    <button
                        type="button"
                        className="apt-back"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} strokeWidth={2.2} />
                    </button>
                    <h1 className="apt-topbar-title">Assessment Preview</h1>
                    <span className="apt-topbar-spacer" aria-hidden />
                </header>

                <main className="apt-main">
                    <section className="apt-hero-card">
                        <div className="apt-hero-accent" aria-hidden />
                        <div className="apt-hero-inner">
                            <div className="apt-profile-block">
                                <div className="apt-avatar-wrap">
                                    <img src={avatarSrc} alt="" className="apt-avatar" />
                                    <span className="apt-verified" title="Verified" aria-hidden>
                                        <Check size={12} strokeWidth={3} />
                                    </span>
                                </div>
                                <h2 className="apt-student-name">
                                    {(studentData?.name || "Student").toUpperCase()}
                                </h2>
                                <p className="apt-student-id">ID: {registerNo}</p>
                            </div>

                            <div className="apt-detail-stack">
                                <div className="apt-detail-row">
                                    <div className="apt-detail-icon apt-detail-icon--blue">
                                        <GraduationCap size={20} strokeWidth={2} />
                                    </div>
                                    <div className="apt-detail-text">
                                        <span className="apt-detail-label">Course name</span>
                                        <span className="apt-detail-value">{courseTitle}</span>
                                    </div>
                                </div>
                                <div className="apt-detail-row">
                                    <div className="apt-detail-icon apt-detail-icon--teal">
                                        <BarChart3 size={20} strokeWidth={2} />
                                    </div>
                                    <div className="apt-detail-text apt-detail-text--level">
                                        <span className="apt-detail-label">Assessment level</span>
                                        <div className="apt-level-line">
                                            <span className="apt-detail-value">{levelName}</span>
                                            
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="apt-stats-footer">
                                <div className="apt-stat">
                                    <span className="apt-stat-label">Duration</span>
                                    <span className="apt-stat-value">
                                        {durationMin}{" "}
                                        {durationMin === 1 ? "Minute" : "Minutes"}
                                    </span>
                                </div>
                                <div className="apt-stat-divider" aria-hidden />
                                <div className="apt-stat">
                                    <span className="apt-stat-label">Questions</span>
                                    <span className="apt-stat-value">
                                        {questionCount} {questionCount === 1 ? "Item" : "Items"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    

                    <button
                        type="button"
                        className="apt-cta"
                        onClick={() => navigate(`/course/${courseId}?launch=true`)}
                    >
                        <span>Proceed to Assessment</span>
                        <ArrowRight size={20} strokeWidth={2.25} aria-hidden />
                    </button>
                    <p className="apt-disclaimer">
                        By proceeding, you agree to follow the assessment rules and guidelines.
                    </p>
                </main>
            </div>
        </StudentLayout>
    );
}
