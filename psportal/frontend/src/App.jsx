import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import OAuthSuccess from "./pages/OAuthSuccess";
import CoursesAvailable from "./pages/CoursesAvailable";
import CourseDetails from "./pages/CourseDetails";
import CourseLevelContent from "./pages/CourseLevelContent";
import MyCourses from "./pages/MyCourses";
import PSActivity from "./pages/PSActivity";
import MovementPass from "./pages/MovementPass";
import MyLeaves from "./pages/MyLeaves";
import MyAttendance from "./pages/MyAttendance";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyQuestionBankEditorStandalone from "./pages/FacultyQuestionBankEditorStandalone";
import DailyTasks from "./pages/practice/DailyTasks";
import Practice from "./pages/practice/Practice";
import PracticeProblem from "./pages/practice/PracticeProblem";
import WebPractice from "./pages/practice/WebPractice";
import WebPracticeProblem from "./pages/practice/WebPracticeProblem";
import CodeforcesPractice from "./pages/practice/CodeforcesPractice";
import Leaderboard from "./pages/practice/Leaderboard";
import CodeReviewDashboard from "./pages/CodeReviewDashboard";
import BookSlots from "./pages/practice/BookSlots";
import PreTestPortal from "./pages/practice/PreTestPortal";
import AssessmentHub from "./pages/assessment/AssessmentHub";
import BusTracking from "./pages/staff/BusTracking";
import BusIncharge from "./pages/staff/BusIncharge";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Unified Role Dashboard + staff sub-views (e.g. /dashboard/mentor, /dashboard/warden, /dashboard/faculty) */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Courses Available Route */}
        <Route
          path="/courses-available"
          element={
            <ProtectedRoute>
              <CoursesAvailable />
            </ProtectedRoute>
          }
        />
        {/* Alias: /available-courses → same as /courses-available */}
        <Route
          path="/available-courses"
          element={<Navigate to="/courses-available" replace />}
        />

        {/* My Courses Route */}
        <Route
          path="/my-courses"
          element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          }
        />

        {/* PS Activity Route */}
        <Route
          path="/ps-activity"
          element={
            <ProtectedRoute>
              <PSActivity />
            </ProtectedRoute>
          }
        />

        {/* Movement Pass Route */}
        <Route
          path="/movement-pass"
          element={
            <ProtectedRoute>
              <MovementPass />
            </ProtectedRoute>
          }
        />

        {/* My Leaves Route */}
        <Route
          path="/my-leaves"
          element={
            <ProtectedRoute>
              <MyLeaves />
            </ProtectedRoute>
          }
        />

        {/* My Attendance Route (student) */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <MyAttendance />
            </ProtectedRoute>
          }
        />

        {/* Coding practice routes */}
        <Route
          path="/daily-tasks"
          element={
            <ProtectedRoute>
              <DailyTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/problem/:problemId"
          element={
            <ProtectedRoute>
              <PracticeProblem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/codeforces"
          element={
            <ProtectedRoute>
              <CodeforcesPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/practice/:courseId"
          element={<Navigate to="/practice" replace />}
        />
        <Route
          path="/web-practice"
          element={
            <ProtectedRoute>
              <WebPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/web-practice/:level/:problemId"
          element={
            <ProtectedRoute>
              <WebPracticeProblem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-slots"
          element={
            <ProtectedRoute>
              <BookSlots />
            </ProtectedRoute>
          }
        />
        {/* Optional assessment dashboard; classic /book-slots + /course/:id unchanged */}
        <Route
          path="/assessments"
          element={
            <ProtectedRoute>
              <AssessmentHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pre-test/:courseId"
          element={
            <ProtectedRoute>
              <PreTestPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/code-review"
          element={
            <ProtectedRoute>
              <CodeReviewDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bus-tracking"
          element={
            <ProtectedRoute>
              <BusTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/bus-incharge"
          element={
            <ProtectedRoute>
              <BusIncharge />
            </ProtectedRoute>
          }
        />

        {/* Course Details Route */}
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:courseId/level/:levelIndex"
          element={
            <ProtectedRoute>
              <CourseLevelContent />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard: separate paths for each section (e.g. /admin/courses, /admin/slots) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Faculty question template editor in a new tab (no dashboard chrome) */}
        <Route
          path="/faculty/question-bank-editor/:courseId/:levelIndex/:templateId"
          element={
            <ProtectedRoute>
              <FacultyQuestionBankEditorStandalone />
            </ProtectedRoute>
          }
        />

        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* Catch-all redirect to login for undefined routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}