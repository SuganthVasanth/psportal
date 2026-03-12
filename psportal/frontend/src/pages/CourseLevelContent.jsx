import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { ChevronDown, ChevronUp, Share2, Play, FileText, Link2, Download, Loader } from "lucide-react";
import "./CourseLevelContent.css";

const API_BASE = "http://localhost:5000";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
};

export default function CourseLevelContent() {
    const { courseId, levelIndex } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [level, setLevel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accordionOpen, setAccordionOpen] = useState(true);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [checkedMaterials, setCheckedMaterials] = useState({});

    const toggleCheck = (i, e) => {
        e.stopPropagation();
        setCheckedMaterials(prev => ({ ...prev, [i]: !prev[i] }));
    };

    const getMaterialSubtitle = (mat) => {
        if (mat.type === "file") return "file";
        const url = mat.url || "";
        if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
        if (url.includes("drive.google.com")) return "google drive";
        return "link";
    };

    const registerNo = localStorage.getItem("register_no") || MOCK_PROFILE.register_no;
    const studentName = localStorage.getItem("userName") || MOCK_PROFILE.name;

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/api/superadmin/courses`);
                if (!res.ok) throw new Error("Failed to fetch courses");
                const courses = await res.json();
                const found = courses.find((c) => c.id === courseId || c._id === courseId);
                if (!found) throw new Error("Course not found");
                setCourse(found);
                const idx = parseInt(levelIndex, 10);
                const lvl = Array.isArray(found.levels) ? found.levels[idx] : null;
                if (!lvl) throw new Error("Level not found");
                setLevel(lvl);
                // Auto-select first material if available
                const mats = Array.isArray(lvl.studyMaterials) ? lvl.studyMaterials : [];
                setSelectedMaterial(mats.length > 0 ? mats[0] : null);
            } catch (err) {
                setError(err.message || "Failed to load course content");
            } finally {
                setLoading(false);
            }
        };
        if (courseId && levelIndex !== undefined) fetchCourse();
    }, [courseId, levelIndex]);

    const levelIdx = parseInt(levelIndex, 10);
    const courseLevelName = course && level
        ? `${course.name} – ${level.name || `Level ${levelIdx + 1}`}`
        : "Loading…";

    const materials = Array.isArray(level?.studyMaterials) ? level.studyMaterials : [];
    const topics = Array.isArray(level?.topics) ? level.topics.filter(Boolean) : [];

    const handleMaterialClick = (mat) => {
        if (!mat.url) return;
        if (mat.type === "file") {
            const link = document.createElement("a");
            link.href = mat.url;
            link.download = mat.title || "material";
            link.click();
        } else {
            window.open(mat.url, "_blank", "noopener,noreferrer");
        }
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        // Handle youtu.be/VIDEO_ID
        const shortMatch = url.match(/youtu\.be\/([\w-]{11})/);
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
        // Handle youtube.com/watch?v=VIDEO_ID
        const longMatch = url.match(/[?&]v=([\w-]{11})/);
        if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
        // Handle youtube.com/embed/VIDEO_ID already
        if (url.includes("youtube.com/embed/")) return url;
        return null;
    };

    const youtubeEmbedUrl = selectedMaterial?.type === "link"
        ? getYouTubeEmbedUrl(selectedMaterial.url)
        : null;

    return (
        <div className="dashboard-layout clc-layout">
            {/* Top Navbar */}
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img
                        src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png"
                        alt="Logo"
                        style={{ width: "32px", height: "32px", objectFit: "contain" }}
                    />
                    <span>PCDP Portal</span>
                </div>
                <div className="top-nav-profile">
                    <img src={MOCK_PROFILE.avatarUrl} alt="Profile" className="profile-avatar" />
                    <div className="profile-info">
                        <span className="profile-id">{registerNo}</span>
                        <span className="profile-name">{studentName}</span>
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <StudentSidebar />

            {/* Main Content Area */}
            <main className="dashboard-main-area clc-main">
                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#64748b" }}>
                        <Loader size={24} className="clc-spin" /> Loading course content…
                    </div>
                ) : error ? (
                    <div style={{ padding: 32, color: "#dc2626", textAlign: "center" }}>
                        <p>{error}</p>
                        <button className="clc-btn" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Go back</button>
                    </div>
                ) : (
                    <div className="clc-container">
                        {/* Left Column */}
                        <div className="clc-left-col">
                            <h2 className="clc-topic-title">
                                {selectedMaterial
                                    ? (selectedMaterial.title || `Material ${materials.indexOf(selectedMaterial) + 1}`)
                                    : (level?.name || `Level ${levelIdx + 1}`)}
                            </h2>

                            {/* Topics list */}
                            {/* {topics.length > 0 && (
                                <div className="clc-topics-list">
                                    <h4 className="clc-topics-heading">Topics covered</h4>
                                    <ul>
                                        {topics.map((t, i) => (
                                            <li key={i}>{t}</li>
                                        ))}
                                    </ul>
                                </div>
                            )} */}

                            {/* Video area — real YouTube embed or placeholder */}
                            {youtubeEmbedUrl ? (
                                <div className="clc-video-wrapper clc-youtube-embed">
                                    <iframe
                                        width="100%"
                                        height="500"
                                        src={youtubeEmbedUrl}
                                        title={selectedMaterial?.title || "YouTube video"}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="clc-yt-iframe"
                                    />
                                </div>
                            ) : (
                                <div className="clc-video-wrapper">
                                    <div className="clc-video-header">
                                        <div className="clc-video-title-left">
                                            <div className="clc-video-avatar"></div>
                                            <span className="clc-video-title-text">{level?.name || `Level ${levelIdx + 1}`}</span>
                                        </div>
                                        <button className="clc-video-share">
                                            <Share2 size={18} color="white" />
                                            <span>Share</span>
                                        </button>
                                    </div>
                                    <div className="clc-video-content">
                                        <div className="clc-code-placeholder">
                                            <pre><code>
                                                {topics.length > 0
                                                    ? topics.map((t, i) => `${i + 1}. ${t}`).join("\n")
                                                    : `// ${level?.name || "Course content"}\n// Select a material from the panel →`}
                                            </code></pre>
                                        </div>
                                        <button className="clc-play-btn">
                                            <Play size={24} fill="white" color="white" />
                                        </button>
                                    </div>
                                    <div className="clc-video-footer">
                                        <span className="clc-watch-on">Powered by</span>
                                        <span className="clc-youtube-logo">PCDP Portal</span>
                                    </div>
                                </div>
                            )}

                            <div className="clc-action-bar">
                                <button className="clc-btn clc-btn-complete">Mark as Complete</button>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="clc-right-col">
                            {/* Course Details Card */}
                            <div className="clc-sidebar-card">
                                {/* <div className="clc-card-subtitle"> */}
                                    <h3 className="clc-card-subtitle">Course Details</h3>
                                {/* </div> */}
                                <h3 className="clc-card-title">{level?.name || `Level ${levelIdx + 1}`}</h3>
                                
                                <button className="clc-btn clc-btn-full" style={{ marginTop: "16px" }}>
                                    Book a Slot
                                </button>
                            </div>

                            {/* Course Materials Card */}
                            <div className="clc-sidebar-card clc-materials-card">
                                <div className="clc-materials-heading">Course Materials</div>
                                <hr className="clc-divider" />

                                {materials.length === 0 ? (
                                    <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 10 }}>
                                        No materials uploaded for this level yet.
                                    </p>
                                ) : (
                                    <div className="clc-mat-accordion">
                                        {/* Accordion header */}
                                        <div
                                            className="clc-mat-acc-header"
                                            onClick={() => setAccordionOpen(!accordionOpen)}
                                        >
                                            <div className="clc-mat-acc-left">
                                                <span className="clc-mat-acc-title">1. Material</span>
                                                <span className="clc-mat-acc-meta">
                                                    Materials: {Object.values(checkedMaterials).filter(Boolean).length} / {materials.length}
                                                </span>
                                            </div>
                                            <button className="clc-accordion-toggle">
                                                {accordionOpen
                                                    ? <ChevronUp size={18} color="#64748b" />
                                                    : <ChevronDown size={18} color="#64748b" />}
                                            </button>
                                        </div>

                                        {/* Scrollable items */}
                                        {accordionOpen && (
                                            <div className="clc-mat-list-wrap">
                                                {materials.map((mat, i) => (
                                                    <div key={i}>
                                                        <div
                                                            className={`clc-mat-row${selectedMaterial === mat ? " clc-mat-row--active" : ""}`}
                                                            onClick={() => setSelectedMaterial(mat)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="clc-mat-checkbox"
                                                                checked={!!checkedMaterials[i]}
                                                                onChange={(e) => toggleCheck(i, e)}
                                                            />
                                                            <div className="clc-mat-info">
                                                                <span className="clc-mat-name">
                                                                    {i + 1}. {mat.title || `Material ${i + 1}`}
                                                                </span>
                                                                <span className="clc-mat-sub">{getMaterialSubtitle(mat)}</span>
                                                            </div>
                                                        </div>
                                                        {i < materials.length - 1 && <hr className="clc-mat-divider" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
