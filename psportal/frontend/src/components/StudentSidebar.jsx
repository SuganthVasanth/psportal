import React, { useMemo } from "react";
import {
  LayoutDashboard,
  SquareLibrary,
  GraduationCap,
  Layers,
  CodeXml,
  ClipboardCheck,
  ListTodo,
  FileCode,
  Globe,
  Trophy,
  Bus,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";
import SmartSidebar from "./SmartSidebar";
import { USE_ASSESSMENT_HUB } from "../config/featureFlags";

export default function StudentSidebar({ collapsed = false, onToggle, surface }) {
  const sections = useMemo(
    () => [
      {
        title: "MAIN",
        items: [
          { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { name: "Daily Tasks", path: "/daily-tasks", icon: ListTodo },
        ],
      },
      {
        title: "LEARN",
        items: [
          { name: "Courses Available", path: "/courses-available", icon: SquareLibrary },
          { name: "My Courses", path: "/my-courses", icon: GraduationCap },
          { name: "Web Practice", path: "/web-practice", icon: Globe },
          { name: "Codeforces Practice", path: "/practice/codeforces", icon: FileCode },
        ],
      },
      {
        title: "COMPETE",
        items: [
          ...(USE_ASSESSMENT_HUB
            ? [{ name: "Assessment hub", path: "/assessments", icon: ClipboardList }]
            : []),
          { name: "Book Slots", path: "/book-slots", icon: CalendarCheck },
          { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
          { name: "Attendance", path: "/attendance", icon: ClipboardCheck },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          { name: "PS Activity", path: "/ps-activity", icon: Layers },
          { name: "Code Review", path: "/code-review", icon: CodeXml },
          { name: "Bus Tracking", path: "/bus-tracking", icon: Bus },
        ],
      },
    ],
    [USE_ASSESSMENT_HUB]
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <SmartSidebar
      sections={sections}
      collapsed={collapsed}
      onToggle={onToggle}
      profileName={localStorage.getItem("name") || "Student"}
      profileRole="Student"
      onLogout={handleLogout}
      surface={surface || "dark"}
    />
  );
}
