import React from "react";
import StudentLayout from "../components/StudentLayout";

export default function CodeReviewDashboard() {
  return (
    <StudentLayout>
      <div className="dashboard-container-inner">
        <div className="welcome-banner">Code Review Dashboard</div>
        <div className="dashboard-card" style={{ padding: 24, borderRadius: 12 }}>
          <h3 className="card-title">Code Review</h3>
          <p className="card-subtitle">Your code review assignments and feedback will appear here.</p>
        </div>
      </div>
    </StudentLayout>
  );
}
