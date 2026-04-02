# PS Portal – Universal Assessment & Learning Platform

A premium, highly-secure MERN-stack application designed to manage the end-to-end lifecycle of academic and programming assessments. PS Portal bridges the gap between complex question design, administrative control, and a proctored student examination experience.

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS & Vanilla CSS (Premium Glassmorphism Design)
- **Editor**: Monaco Editor (The backend of VS Code) for Programming assessments.
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect, useMemo, useCallback)
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **File Storage**: GridFS for persistent binary storage (submissions/images).

---

## 🏛️ Role-Based Features

### 1. 🛡️ Admin (Super Admin)
The nerve center for institutional oversight and course management.
- **Global Dashboard**: Real-time overview of course popularity and student activity.
- **Course Life-Cycle**: Complete CRUD management for courses and their respective levels.
- **Assessment Type Sync**: Seamlessly links course levels to templates built in the Question Form Builder.
- **Approval Workflow**: A dedicated interface to review, approve, or reject question banks submitted by faculty.
- **Slot Management**: Create time-bound assessment windows (slots) that students can book.
- **Booking Oversight**: Monitor and manage student bookings, including manual overrides if necessary.
- **Progress Tracking**: Detailed views of student enrollment status and level-completion history.

### 2. 📝 Faculty (Question Architects)
Empowering educators to build complex, multi-modal assessments.
- **Question Bank Creator**: Manage personalized repositories of questions.
- **Drag-and-Drop Form Builder**: A sophisticated fixed-position canvas to design custom layouts (MCQs, Text, Code Labs).
- **Diverse Component Palette**: 
  - **Programming**: Integrated environment for coding challenges.
  - **MCQ & Checkboxes**: Standard assessment blocks.
  - **Match the Following**: Drag-and-drop pairing logic.
  - **Image & File Upload**: For diagram-based or long-form submissions.
- **Template Preview**: Instant visualization of how the question will appear to the student.
- **Submission Tracking**: Review status updates for pending approvals from the Admin.

### 3. 🎓 Student (The Learner Portal)
A distraction-free, "Premium" workspace for learning and evaluation.
- **Course Discovery**: Browse, filter, and enroll in available academic tracks.
- **Personal Progress Dashboard**: Track level status (In-Progress, Completed, Failed) and attempt history.
- **Self-Service Slot Booking**: Integrated booking system allowing students to pick an assessment time that fits their schedule.
- **Premium Programming Portal (The "LeetCode" Experience)**:
  - **Split-Pane Layout**: Resizable workspace (Problem Description vs. Code Editor).
  - **Integrated IDE**: Monaco Editor with syntax highlighting and auto-save (persists across refreshes).
  - **Native Document Rendering**: High-quality "Stack Layout" for problem descriptions, ensuring perfect readability.
  - **Live Countdown Timer**: Real-time remaining time display with **Auto-Submission** logic when time expires.
  - **Universal Fallback**: Automatically renders standard form-based questions in the side-by-side IDE layout.
- **Distraction-Free Mode**: Immersive full-screen experience for critical assessments.

---

## 🔐 Advanced Proctoring & Security
PS Portal implements multi-layer security to ensure the integrity of the assessment process.
- **Tab-Switch Detection**: Real-time monitoring using the Visibility API. Every instance of leaving the assessment tab is recorded.
- **Security Status Badge**: A professional "Red Alert" status bar that updates live in the header based on student violations.
- **Interaction Restrictions**: 
  - Context Menu (Right-Click) disabled.
  - Copy and Paste disabled (to prevent external sourcing).
  - Browser Refresh detection and logging.
- **Auto-Submit Protocol**: If the session expires or a critical violation threshold is met, the system automatically finalizes the submission.

---

## ✨ Small Features (UX/UI Polish)
- **Glassmorphism Design**: Semi-transparent panels with background blur for a modern "Premium" look.
- **Navy/Indigo Palette**: A curated color scheme used across sidebars, cards, and headers.
- **Live Assessment Clock**: Real-time time synchronization in the assessment header.
- **User Profile Badges**: Professional badges displaying student Name, Register No, and Avatars.
- **Adaptive Draggers**: Smooth, indigo-highlighted resize handles for the secondary panels.
- **Auto-Save Mechanism**: Progress is automatically cached in local storage to prevent data loss during network blips.
- **Responsive Components**: Tailored layouts for the Form Builder components that adapt to different screen sizes.

---

## 🛠️ Installation & Setup
1. **Prerequisites**: Ensure Node.js and MongoDB are installed.
2. **Backend**:
   ```bash
   cd backend
   npm install
   nodemon server.js
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
