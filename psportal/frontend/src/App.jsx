import React from 'react';
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
import './App.css'

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

        {/* Course Details Route */}
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />

        {/* Course Level Content Route */}
        <Route
          path="/course/:courseId/level/:levelIndex"
          element={
            <ProtectedRoute>
              <CourseLevelContent />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect to login for undefined routes */}
        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/oauth-success" element={<OAuthSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}