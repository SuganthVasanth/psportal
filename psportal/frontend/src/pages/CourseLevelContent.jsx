import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import { ChevronDown, ChevronUp, Play, Loader, ArrowLeft } from "lucide-react";
import "./CourseLevelContent.css";

const API_BASE = "http://localhost:5000";

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
        if (mat.type === "file") {
            const url = mat.content || mat.url;
            if (!url) return;
            const link = document.createElement("a");
            link.href = url;
            link.download = mat.name || "material";
            link.click();
        } else {
            if (!mat.url) return;
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
        <StudentLayout>
            <div className="clc-page">
                {/* <header className="clc-header">
                    <button type="button" className="clc-back" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    <div className="clc-headings">
                        <div className="clc-breadcrumb">{course?.name || "Course"}</div>
                        <h1 className="clc-title">{level?.name || `Level ${levelIdx + 1}`}</h1>
                    </div>

                    <div className="clc-header-actions">
                        {selectedMaterial && (
                            <button type="button" className="clc-btn clc-btn-secondary" onClick={() => handleMaterialClick(selectedMaterial)}>
                                <ExternalLink size={16} />
                                Open material
                            </button>
                        )}
                        <button type="button" className="clc-btn clc-btn-primary">
                            <CheckCircle2 size={16} />
                            Mark complete
                        </button>
                    </div>
                </header> */}

                {loading ? (
                    <div className="clc-state">
                        <Loader size={22} className="clc-spin" />
                        <span>Loading course content…</span>
                    </div>
                ) : error ? (
                    <div className="clc-state clc-state-error">
                        <p>{error}</p>
                        <button className="clc-btn clc-btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate(-1)}>
                            <ArrowLeft size={16} />
                            Go back
                        </button>
                    </div>
                ) : (
                    <div className="clc-grid">
                        <section className="clc-viewer">
                            <div className="clc-viewer-top">
                                <div>
                                    <div className="clc-viewer-eyebrow">Now viewing</div>
                                    <h2 className="clc-viewer-title">
                                        {selectedMaterial
                                            ? (selectedMaterial.name || `Material ${materials.indexOf(selectedMaterial) + 1}`)
                                            : (level?.name || `Level ${levelIdx + 1}`)}
                                    </h2>
                                </div>
                                {selectedMaterial && (
                                    <span className="clc-pill">{getMaterialSubtitle(selectedMaterial)}</span>
                                )}
                            </div>

                            {youtubeEmbedUrl ? (
                                <div className="clc-player clc-player-youtube">
                                    <iframe
                                        src={youtubeEmbedUrl}
                                        title={selectedMaterial?.title || "YouTube video"}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <div className="clc-player">
                                    <div className="clc-player-inner">
                                        <div className="clc-code">
                                            <pre>
                                                <code>
                                                    {topics.length > 0
                                                        ? topics.map((t, i) => `${i + 1}. ${t}`).join("\n")
                                                        : `// ${level?.name || "Course content"}\n// Select a material from the right panel →`}
                                                </code>
                                            </pre>
                                        </div>
                                        <button className="clc-play" type="button" aria-label="Play">
                                            <Play size={22} fill="white" color="white" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <aside className="clc-side">
                            {/* <div className="clc-card">
                                <div className="clc-card-title">Level details</div>
                                <div className="clc-card-row">
                                    <span className="clc-muted">Course</span>
                                    <span className="clc-strong">{course?.name || "—"}</span>
                                </div>
                                <div className="clc-card-row">
                                    <span className="clc-muted">Level</span>
                                    <span className="clc-strong">{level?.name || `Level ${levelIdx + 1}`}</span>
                                </div>
                                <div className="clc-card-row">
                                    <span className="clc-muted">Materials</span>
                                    <span className="clc-strong">{materials.length}</span>
                                </div>
                                <button className="clc-btn clc-btn-secondary clc-btn-full" type="button" style={{ marginTop: 12 }}>
                                    Book a slot
                                </button>
                            </div> */}

                            <div className="clc-card">
                                <div className="clc-card-head">
                                    <div>
                                        <div className="clc-card-title">Course materials</div>
                                        <div className="clc-card-sub">
                                            Completed {Object.values(checkedMaterials).filter(Boolean).length} / {materials.length}
                                        </div>
                                    </div>
                                    <button type="button" className="clc-acc-toggle" onClick={() => setAccordionOpen(!accordionOpen)}>
                                        {accordionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                </div>

                                {materials.length === 0 ? (
                                    <div className="clc-empty">No materials uploaded for this level yet.</div>
                                ) : accordionOpen ? (
                                    <div className="clc-mat-list">
                                        {materials.map((mat, i) => (
                                            <button
                                                type="button"
                                                key={i}
                                                className={`clc-mat-item${selectedMaterial === mat ? " is-active" : ""}`}
                                                onClick={() => setSelectedMaterial(mat)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="clc-mat-check"
                                                    checked={!!checkedMaterials[i]}
                                                    onChange={(e) => toggleCheck(i, e)}
                                                />
                                                <div className="clc-mat-text">
                                                    <div className="clc-mat-name">{i + 1}. {mat.name || `Material ${i + 1}`}</div>
                                                    <div className="clc-mat-sub">{getMaterialSubtitle(mat)}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                        </aside>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}