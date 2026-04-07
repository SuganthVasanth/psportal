import React from "react";
import StudentLayout from "../components/StudentLayout";

export default function CodeReviewDashboard() {
  return (
    <StudentLayout>
      <div className="dashboard-container-inner bg-[#f8f7ff] min-h-full">
        <div className="px-8 pt-7 pb-5">
          <h1 className="text-[22px] font-extrabold text-[#0f0e1a] tracking-tight">Code Review</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">Your code review assignments and feedback appear here.</p>
        </div>
        <div className="px-8 pb-8">
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.07)] shadow-sm py-16 flex flex-col items-center gap-3 text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center text-2xl">
              🧪
            </div>
            <div className="text-[15px] font-semibold text-[#374151]">No code review items yet</div>
            <div className="text-sm text-[#9ca3af] max-w-xs">
              New review tasks will show up here once they are assigned by faculty.
            </div>
            <button
              type="button"
              className="mt-2 px-5 py-2 bg-[#2563eb] text-white text-sm font-semibold rounded-xl hover:bg-[#1d4ed8] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
