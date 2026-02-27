import React, { useState } from "react";
import { Link } from "react-router-dom";
import StudentSidebar from "../components/StudentSidebar";
import { Search, BookOpen, Award, Monitor, Cpu } from "lucide-react";
import "./CoursesAvailable.css";

const MOCK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png"
};

const COURSES = [
    { id: 1, title: 'Advanced Modelling & Simulation', levels: 2, completedLevels: 0, skill: 'Advanced' },
    { id: 2, title: 'Analog Electronics', levels: 15, completedLevels: 0, skill: 'Hardware' },
    { id: 3, title: 'Analog Electronics - Mock Test', levels: 25, completedLevels: 0, skill: 'Hardware' },
    { id: 4, title: 'Aptitude', levels: 14, completedLevels: 6, skill: 'GENERAL Skill' },
    { id: 5, title: 'Biological Manuscript and Reference Management', levels: 2, completedLevels: 0, skill: 'Hardware' },
    { id: 6, title: 'Bioprocess Technology', levels: 3, completedLevels: 0, skill: 'Hardware' },
    { id: 7, title: 'C Programming', levels: 7, completedLevels: 6, skill: 'Software' },
    { id: 8, title: 'Calculus', levels: 1, completedLevels: 0, skill: 'Beginner' },
    { id: 9, title: 'Circuit Debugging', levels: 8, completedLevels: 0, skill: 'Hardware' },
    { id: 10, title: 'Communication', levels: 3, completedLevels: 0, skill: 'GENERAL Skill' },
    { id: 11, title: 'Computer Networking', levels: 5, completedLevels: 0, skill: 'Software' },
    { id: 12, title: 'Construction Management', levels: 1, completedLevels: 0, skill: 'Hardware' }
];

// Placeholder images based on index
const getCourseImage = (idx) => {
    const images = [
        "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=400"
    ];
    return images[idx % images.length];
};

const getSkillIcon = (skillName) => {
    switch (skillName) {
        case 'Advanced': return <Award size={14} className="skill-icon" />;
        case 'Hardware': return <Cpu size={14} className="skill-icon" />;
        case 'Software': return <Monitor size={14} className="skill-icon" />;
        case 'GENERAL Skill': return <Award size={14} className="skill-icon" />;
        case 'Beginner': return <Award size={14} className="skill-icon" />;
        default: return <BookOpen size={14} className="skill-icon" />;
    }
};

export default function CoursesAvailable() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="dashboard-layout">
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                    <span>PCDP Portal</span>
                </div>

                <div className="top-nav-profile">
                    <img
                        src={MOCK_PROFILE.avatarUrl}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <div className="profile-info">
                        <span className="profile-id">{MOCK_PROFILE.register_no}</span>
                        <span className="profile-name">{MOCK_PROFILE.name}</span>
                    </div>
                </div>
            </header>

            <StudentSidebar />

            <main className="dashboard-main-area">
                <div className="courses-container">

                    {/* Header Section */}
                    <div className="page-header">
                        <h1 className="page-title">Courses Available</h1>
                        <p className="page-subtitle">Showing {COURSES.length} of {COURSES.length} courses</p>
                    </div>

                    {/* Main White Card containing Search, Filters and Tabs */}
                    <div className="filters-card">
                        {/* Top Filters Section */}
                        <div className="courses-filters-section">
                            <div className="search-bar-wrapper">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search courses by name or category..."
                                    className="courses-search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-dropdowns">
                                <select className="course-select">
                                    <option>All Categories</option>
                                </select>
                                <select className="course-select">
                                    <option>Sort by Name</option>
                                </select>
                            </div>
                        </div>

                        {/* Tabs / Badges */}
                        <div className="courses-tabs-wrapper">
                            <div className="active-tab">
                                Personalized Skills <span className="tab-badge">71</span>
                            </div>
                        </div>
                    </div>

                    {/* Section Title */}
                    <h2 className="section-title">
                        Personalized Skills <span className="title-count">(71 courses)</span>
                    </h2>

                    {/* Courses Grid */}
                    <div className="courses-grid">
                        {COURSES.map((course, idx) => {
                            const percent = course.levels > 0 ? Math.round((course.completedLevels / course.levels) * 100) : 0;
                            // create array of levels to render the segmented progress bar
                            const levelsArray = Array.from({ length: Math.min(course.levels, 15) }); // cap at 15 segments for UI

                            return (
                                <Link to={`/course/${course.id}`} style={{ textDecoration: 'none', color: 'inherit' }} key={course.id}>
                                    <div className="course-card">
                                        <div className="course-image">
                                            <img src={getCourseImage(idx)} alt={course.title} />
                                        </div>
                                        <div className="course-content">
                                            <h3 className="course-title">{course.title}</h3>

                                            <div className="course-meta">
                                                <div className="meta-item">
                                                    <BookOpen size={14} className="meta-icon" />
                                                    <span>Levels: {course.levels}</span>
                                                </div>
                                                <div className="meta-item skill-type">
                                                    {getSkillIcon(course.skill)}
                                                    <span>{course.skill}</span>
                                                </div>
                                            </div>

                                            <div className="course-progress-container">
                                                <div className="progress-segments">
                                                    {levelsArray.map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`progress-segment ${i < (course.completedLevels > 15 ? 15 : course.completedLevels) ? 'completed' : ''}`}
                                                        ></div>
                                                    ))}
                                                </div>
                                                <div className="progress-text">
                                                    Progress: {course.completedLevels}/{course.levels} levels ({percent}%)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                </div>
            </main>
        </div>
    );
}
