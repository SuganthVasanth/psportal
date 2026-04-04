# PS Portal: Professional Skills Assessment Platform

An end-to-end, high-performance assessment ecosystem designed to streamline the lifecycle of professional skills evaluation—from course creation and faculty management to student examination and automated reporting.

## 🚀 End-to-End Workflow

### 1. Admin Layer (Orchestration)
*   **Course Management**: Admins define courses and structure them into sequential levels.
*   **Faculty Assignment**: Assign specific faculty members to oversee individual courses and levels.
*   **Global Monitoring**: Access to the **Assessment Slot Report**, providing a bird’s-eye view of student attempts, registration statuses, and total enrollment progress.

### 2. Faculty Layer (Content Creation)
*   **Question Bank Builder**: A modular, template-based form builder allowing faculty to create complex questions:
    *   **MCQ**: With interactive option builders and modern UI layouts.
    *   **Programming**: Integrated with `Monaco Editor` for problem statements and test case management.
*   **Slot Management**: Define physical venues and time-bound slots for assessments.

### 3. Student Layer (Evaluation)
*   **Registration & Enrollment**: Students enroll in specific levels, adhering to prerequisites.
*   **Slot Booking**: Real-time booking system for physical assessment sessions.
*   **Assessment Portal**: A premium, proctored examination environment:
    *   **LeetCode-Style UI**: Split-pane layout for programming and a modernized, button-based layout for MCQs.
    *   **Proctoring Engine**: Integrated tab-switch detection, fullscreen enforcement, and automatic session termination.
    *   **Real-time Execution**: Immediate feedback for programming challenges via integrated test case runners.

---

## 🛠 Tech Stack

### Frontend (User Interface)
*   **Framework**: [React](https://reactjs.org/) (Vite-based)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a modern, responsive design system.
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) for a professional IDE experience.
*   **State Management**: React Hooks & Context API.

### Backend (Infrastructure)
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) for data modeling.
*   **Authentication**: Custom JWT-based authentication for Admin, Faculty, and Student roles.

---

## 🏛 Architecture Highlights

### Template-Based Question Engine
The project utilizes a `LockedTemplateRenderer` and `TemplateQuestionForm` system. This allows for rapid development of new question types (e.g., Match Pairs, Matrix MCQ) by simply defining a new JSON-based layout and property schema.

### Proctored Assessment Lifecycle
1.  **Launch**: Forced Fullscreen initiation via user gesture.
2.  **Monitoring**: Real-time tab switch tracking stored in local storage and synced to the database.
3.  **Submission**: Automatic answer persistence (drafting) followed by a final submission that evaluates score based on pre-defined answers or test cases.

---

## 📦 Directory Structure
*   `/frontend/src/components/renderer`: Core question rendering components.
*   `/frontend/src/pages/practice`: Student-facing practice and booking modules.
*   `/backend/models`: Database schemas for Assessments, Bookings, and Progress.
*   `/backend/api`: Controller logic for submission evaluation and report generation.
