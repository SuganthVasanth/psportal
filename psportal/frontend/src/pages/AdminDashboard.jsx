import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Shield,
  BookOpen,
  Calendar,
  FileText,
  Code,
  BarChart3,
  Plus,
  Pencil,
  X,
  Users,
  UserPlus,
  Upload,
  List,
  BookMarked,
  ClipboardList,
  LayoutTemplate,
  MapPin,
  Clock,
  CalendarDays,
  GitBranch,
  UserCheck,
  TrendingUp,
  PieChart,
  CalendarCheck,
  BarChart2,
  Bus,
  Trash2,
  PlusCircle,
  CheckCircle,
  Terminal,
  ChevronRight,
  Search,
  Bell,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Bar as RechartsBar,
  LabelList,
} from "recharts";
import * as XLSX from "xlsx";
import "./SuperAdminDashboard.css";
import "../components/SidebarPremium.css";
import ChatModal from "../components/ChatModal";
import QuestionTemplateBuilder from "./admin/QuestionTemplateBuilder";
import QuestionBankSubmissionView from "./admin/QuestionBankSubmissionView";
import AdminAnalyticsSuite from "../components/admin/AdminAnalyticsSuite";
import TimePicker12h from "../components/TimePicker12h";
import { templateApi } from "../services/templateApi";
import SmartSidebar from "../components/SmartSidebar";
import ProfileDetailsModal from "../components/ProfileDetailsModal";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const API_BASE = "http://localhost:5000";

const NAV = [
  {
    id: "rbac",
    label: "RBAC",
    icon: Shield,
    sub: [
      { id: "roles", label: "Roles", icon: Shield, path: "roles" },
      { id: "users-list", label: "Users", icon: Users, path: "users" },
      { id: "create-user", label: "Create user", icon: UserPlus, path: "create-user" },
    ],
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    sub: [
      { id: "course-upload", label: "Create", icon: Upload, path: "courses" },
      { id: "course-completion", label: "Course Completion", icon: BarChart3, path: "course-completion" },
      // { id: "course-points", label: "Details", icon: List, path: "course-details" },
      // { id: "ps-courses", label: "PS Courses", icon: BookMarked, path: "ps-courses" },
      { id: "question-banks", label: "Question banks", icon: ClipboardList, path: "question-banks" },
      { id: "question-form-builder", label: "Question form builder", icon: FileText, path: "question-form-builder" },
      { id: "question-template-builder", label: "Question Template Builder", icon: LayoutTemplate, path: "question-template-builder" },
    ],
  },
  {
    id: "slots",
    label: "Slots",
    icon: Calendar,
    sub: [
      { id: "venue", label: "Venue", icon: MapPin, path: "venues" },
      { id: "time", label: "Time", icon: Clock, path: "time-slots" },
      { id: "slots-list", label: "Slots (venue, time)", icon: CalendarDays, path: "slots" },
      { id: "assessment-slots", label: "Assessment Slots", icon: CalendarCheck, path: "assessment-slots" },
    ],
  },
  {
    id: "leave",
    label: "Leaves",
    icon: FileText,
    sub: [
      { id: "leave-flow", label: "Leave Flow", icon: GitBranch, path: "leave-flow" },
      { id: "all-leave-types", label: "All Leave Types", icon: FileText, path: "leave-types" },
    ],
  },
  {
    id: "code-review",
    label: "Code review",
    icon: Code,
    sub: [
      { id: "code-access", label: "Assign Faculty", icon: UserCheck, path: "code-access" },
      { id: "code-students", label: "Students Applied", icon: Users, path: "code-students" },
    ],
  },
  {
    id: "stats",
    label: "Reports",
    icon: BarChart3,
    sub: [
      { id: "stats-course", label: "Students applied per course", icon: TrendingUp, path: "reports" },
      // { id: "stats-slot", label: "Slot used most often", icon: PieChart, path: "reports-slots" },
      // { id: "stats-weekly", label: "Weekly clearing %", icon: BarChart2, path: "reports-weekly" },
      // { id: "stats-registered", label: "Course registered/attended", icon: CalendarCheck, path: "reports-registered" },
    ],
  },
  {
    id: "buses",
    label: "Buses",
    icon: Bus,
    sub: [
      { id: "bus-list", label: "Manage Buses", icon: List, path: "bus-list" },
      { id: "bus-assign", label: "Assign Students", icon: Users, path: "bus-assign" },
    ],
  },
  {
    id: "classroom",
    label: "Classroom",
    icon: BookOpen,
    sub: [{ id: "classrooms-list", label: "Classrooms", icon: List, path: "classrooms" }],
  },
];

const PATH_TO_SECTION = {};
NAV.forEach((sec) => {
  (sec.sub || []).forEach((sub) => {
    if (sub.path) PATH_TO_SECTION[sub.path] = { openNav: sec.id, activeSub: sub.id };
  });
});
PATH_TO_SECTION[""] = PATH_TO_SECTION["overview"] = { openNav: "rbac", activeSub: "roles" };
PATH_TO_SECTION["assessment-slot-report"] = { openNav: "slots", activeSub: "assessment-slot-report" };
PATH_TO_SECTION["question-bank-submissions-view"] = { openNav: "academic", activeSub: "question-bank-submissions-view" };

// Role access options: admin selects what each role can see/do in the user dashboard
const ACCESS_OPTIONS = [
  // Mentor
  { id: "mentees.view", label: "List of mentees", group: "Mentor" },
  { id: "mentees.courses", label: "Mentees' completed & ongoing courses", group: "Mentor" },
  { id: "mentees.reward_points", label: "Mentees' reward points", group: "Mentor" },
  { id: "mentees.activity_points", label: "Mentees' activity points", group: "Mentor" },
  { id: "mentees.leave_approve", label: "Leave approvals (mentor)", group: "Mentor" },
  { id: "mentees.attendance", label: "Mentees' attendance %", group: "Mentor" },

  // Warden
  { id: "ward_students.view", label: "Students in their wards", group: "Warden" },
  { id: "ward_students.room", label: "Room numbers", group: "Warden" },
  { id: "ward_students.biometric", label: "Biometric details", group: "Warden" },
  { id: "ward_students.leave_approve", label: "Leave approvals (warden)", group: "Warden" },

  // Technical faculty
  { id: "faculty.courses_assigned", label: "Assigned courses (admin assigns)", group: "Technical faculty" },
  { id: "faculty.question_bank", label: "Submit question banks to admin", group: "Technical faculty" },
  { id: "faculty.student_answers", label: "View student answers (if granted)", group: "Technical faculty" },
  { id: "faculty.answer_key", label: "View answer key (if granted)", group: "Technical faculty" },

  // Hostel manager
  { id: "hostel.manage", label: "Wardens & wards (hostel manager view)", group: "Hostel manager" },

  // Security
  { id: "security.leaves", label: "Approved leaves list (security)", group: "Security" },
];

// Known roles use fixed colors; any other role gets a stable color from the palette (hash of name)
const ROLE_TAG_STYLES = {
  student: { backgroundColor: "#e0f2fe", color: "#0369a1" },
  mentor: { backgroundColor: "#d1fae5", color: "#047857" },
  warden: { backgroundColor: "#fef3c7", color: "#b45309" },
  "hostel manager": { backgroundColor: "#dbeafe", color: "#1e3a8a" },
  security: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  admin: { backgroundColor: "#cffafe", color: "#0e7490" },
  super_admin: { backgroundColor: "#e2e8f0", color: "#334155" },
  parents: { backgroundColor: "#fce7f3", color: "#9d174d" },
};
const ROLE_TAG_PALETTE = [
  { backgroundColor: "#f1f5f9", color: "#475569" },
  { backgroundColor: "#ede9fe", color: "#5b21b6" },
  { backgroundColor: "#ffedd5", color: "#c2410c" },
  { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  { backgroundColor: "#ccfbf1", color: "#0f766e" },
  { backgroundColor: "#fef9c3", color: "#a16207" },
  { backgroundColor: "#dbeafe", color: "#1e40af" },
  { backgroundColor: "#fed7aa", color: "#ea580c" },
  { backgroundColor: "#dbeafe", color: "#1e40af" },
  { backgroundColor: "#d1fae5", color: "#059669" },
  { backgroundColor: "#fecdd3", color: "#be123c" },
  { backgroundColor: "#e0f2fe", color: "#0284c7" },
  { backgroundColor: "#fae8ff", color: "#a21caf" },
  { backgroundColor: "#fef3c7", color: "#d97706" },
  { backgroundColor: "#c7d2fe", color: "#3730a3" },
  { backgroundColor: "#a7f3d0", color: "#047857" },
  { backgroundColor: "#fbcfe8", color: "#9d174d" },
  { backgroundColor: "#bae6fd", color: "#0369a1" },
  { backgroundColor: "#ddd6fe", color: "#5b21b6" },
];

function hashRole(s) {
  let h = 0;
  const str = (s || "").toString().toLowerCase();
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getRoleTagStyle(role) {
  const r = (role || "").toLowerCase().trim();
  if (ROLE_TAG_STYLES[r]) return ROLE_TAG_STYLES[r];
  return ROLE_TAG_PALETTE[hashRole(role) % ROLE_TAG_PALETTE.length];
}

const emptyLists = {
  roles: [],
  users: [],
  courses: [],
  venues: [],
  timeSlots: [],
  slots: [],
  leaveTypes: [],
  leaveWorkflows: [],
};

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openNav, setOpenNav] = useState("rbac");
  const [activeSub, setActiveSub] = useState("roles");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const raw = (location.pathname || "").replace(/^\/admin\/?/, "").replace(/^\/+/, "");
    const seg = raw || "overview";
    if (raw === "") {
      navigate("/admin/roles", { replace: true });
      return;
    }
    
    let querySeg = seg;
    let dynamicId = null;
    let bankSubId = null;
    if (seg.startsWith("question-template-builder/")) {
      querySeg = "question-template-builder";
      dynamicId = seg.substring("question-template-builder/".length);
    } else if (seg.startsWith("question-bank-submissions/")) {
      querySeg = "question-bank-submissions-view";
      bankSubId = seg.substring("question-bank-submissions/".length);
    } else if (seg.startsWith("assessment-slots/") && seg.endsWith("/report")) {
      querySeg = "assessment-slot-report";
      const parts = seg.split("/");
      dynamicId = parts[1];
    }
    
    const sec = PATH_TO_SECTION[querySeg] || PATH_TO_SECTION["overview"];
    setOpenNav(sec.openNav);
    setActiveSub(sec.activeSub);
    
    if (querySeg === "question-template-builder") {
      setTemplateIdToEditForBuilder(dynamicId || null);
    } else if (querySeg === "question-bank-submissions-view") {
      setBankSubmissionIdView(bankSubId || null);
    } else if (querySeg === "assessment-slot-report") {
      setSelectedReportSlotId(dynamicId || null);
    }
  }, [location.pathname, navigate]);

  const [bankSubmissionIdView, setBankSubmissionIdView] = useState(null);
  const [rolesList, setRolesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [venuesList, setVenuesList] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [assessmentSlots, setAssessmentSlots] = useState([]);
  const [leaveTypesList, setLeaveTypesList] = useState([]);
  const [leaveWorkflowList, setLeaveWorkflowList] = useState([]);
  const [leaveApprovalSteps, setLeaveApprovalSteps] = useState("mentor, warden, hostel_manager");
  const [leaveFlowSelectedType, setLeaveFlowSelectedType] = useState("");
  const [leaveFlowSteps, setLeaveFlowSteps] = useState([""]);
  const [createUserForm, setCreateUserForm] = useState({ email: "", name: "", roles: [] });
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [facultyAssignUserId, setFacultyAssignUserId] = useState("");
  const [facultyAssignCourseId, setFacultyAssignCourseId] = useState("");
  const [facultyAssignLevelIndex, setFacultyAssignLevelIndex] = useState(0);
  const [facultyAssignTemplateId, setFacultyAssignTemplateId] = useState("");
  const [facultyAssignQuestionCount, setFacultyAssignQuestionCount] = useState(10);
  const [facultyAssignSortBy, setFacultyAssignSortBy] = useState("user");
  const [facultyAssignSortDir, setFacultyAssignSortDir] = useState("asc");
  const [facultyAssignSearch, setFacultyAssignSearch] = useState("");
  const [questionBankSubmissions, setQuestionBankSubmissions] = useState([]);
  const [questionBankFilterCourse, setQuestionBankFilterCourse] = useState("");
  const [courseOverviewSearch, setCourseOverviewSearch] = useState("");
  const [psCoursesList, setPsCoursesList] = useState([]);
  const [psCourseSearch, setPsCourseSearch] = useState("");
  const [psCourseStatusFilter, setPsCourseStatusFilter] = useState("");
  const [psCourseSelectedIds, setPsCourseSelectedIds] = useState([]);
  const [psCourseExpandedId, setPsCourseExpandedId] = useState(null);
  const [questionTemplatesList, setQuestionTemplatesList] = useState([]);
  const [templateIdToEditForBuilder, setTemplateIdToEditForBuilder] = useState(null);
  const [templatesForAssign, setTemplatesForAssign] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWithUserId, setChatWithUserId] = useState(null);
  const [chatWithUserName, setChatWithUserName] = useState("");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [openSlotSelectedCourses, setOpenSlotSelectedCourses] = useState({}); // { [id]: [levelIndices] }
  const [openSlotDate, setOpenSlotDate] = useState("");
  const [openSlotVenueId, setOpenSlotVenueId] = useState("");
  const [openSlotStartTime, setOpenSlotStartTime] = useState("");
  const [openSlotCapacity, setOpenSlotCapacity] = useState(30);
  const [isOpeningSlots, setIsOpeningSlots] = useState(false);
  const [assessmentSlotCourseSearch, setAssessmentSlotCourseSearch] = useState("");
  const [assessmentSlotsTableQuery, setAssessmentSlotsTableQuery] = useState("");
  const [courseCompletionData, setCourseCompletionData] = useState([]);
  const [courseCompletionLoading, setCourseCompletionLoading] = useState(false);
  const [completionSelectedCourseId, setCompletionSelectedCourseId] = useState("");
  const [completionMinAttempts, setCompletionMinAttempts] = useState("");
  const [completionMaxAttempts, setCompletionMaxAttempts] = useState("");
  const [completionFilterDept, setCompletionFilterDept] = useState("");
  const [completionFilterYear, setCompletionFilterYear] = useState("");
  const [completionCourseSearchQuery, setCompletionCourseSearchQuery] = useState("");

  const exportAssessmentSlots = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const rows = (assessmentSlots || []).map((row) => {
      const allowed = (row.allowedCourses || [])
        .map((ac) => `${ac.courseName} (Levels: ${(ac.levelIndices || []).map((i) => i + 1).join(", ")})`)
        .join(" | ");

      const start = row.startTime ? formatTime(row.startTime) : "";
      const end = row.startTime ? calculateSlotEndTime(row.startTime, row.allowedCourses) : "";

      return {
        id: row.id,
        date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "",
        venue: row.venueLabel || "",
        time: start && end ? `${start} – ${end}` : start || "",
        capacity: Number(row.capacity || 0),
        booked: Number(row.bookedCount || 0),
        allowedCoursesLevels: allowed,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "AssessmentSlots");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([{ exportedAt: new Date().toISOString(), count: rows.length }]),
      "Meta",
    );

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `assessment-slots-${stamp}.xlsx`);
  }, [assessmentSlots]);

  // Bus management (Admin -> Buses)
  const [busesList, setBusesList] = useState([]);
  const [dayscholarsList, setDayscholarsList] = useState([]);
  const [busMgmtLoading, setBusMgmtLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkAssignBusId, setBulkAssignBusId] = useState("none");
  const [classroomsList, setClassroomsList] = useState([]);
  const [classroomLoading, setClassroomLoading] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedClassroomMeta, setSelectedClassroomMeta] = useState(null);
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [classroomStudentsLoading, setClassroomStudentsLoading] = useState(false);
  
  // Slot Report State
  const [selectedReportSlotId, setSelectedReportSlotId] = useState(null);
  const [slotReportData, setSlotReportData] = useState(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editModal, setEditModal] = useState({
    open: false,
    section: "",
    itemId: null,
    item: {},
  });

  const busOptions = useMemo(
    () => [
      { value: "none", label: "None" },
      ...(busesList || []).map((bus) => ({
        value: bus._id,
        label: `${bus.busNumber} - ${bus.route}`,
      })),
    ],
    [busesList]
  );

  const filteredDayscholarsForBusAssign = useMemo(() => {
    const q = (studentSearchQuery || "").trim().toLowerCase();
    return (dayscholarsList || []).filter((s) => {
      const matchesSearch =
        !q ||
        String(s.register_no || "").toLowerCase().includes(q) ||
        String(s.name || "").toLowerCase().includes(q);
      const matchesDept = !studentDeptFilter || s.department === studentDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [dayscholarsList, studentSearchQuery, studentDeptFilter]);

  const allFilteredSelected =
    filteredDayscholarsForBusAssign.length > 0 &&
    selectedStudentIds.length === filteredDayscholarsForBusAssign.length;

  const facultyCandidates = usersList.filter((u) =>
    (u.roles || []).some((r) => r.toLowerCase().includes("faculty") || r.toLowerCase().includes("mentor"))
  );
  const facultyList = facultyCandidates.length ? facultyCandidates : usersList;
  const getFacultyAssignmentDisplayName = (a) =>
    a.user_name ||
    a.user_email ||
    (usersList.find((u) => u.id === a.user_id)?.name) ||
    (usersList.find((u) => u.id === a.user_id)?.email) ||
    a.user_id ||
    "—";
  const sortedFacultyAssignments = useMemo(() => {
    const q = facultyAssignSearch.trim().toLowerCase();
    const filtered = q
      ? facultyAssignments.filter((a) => {
          const displayName = getFacultyAssignmentDisplayName(a);
          return (
            String(displayName).toLowerCase().includes(q) ||
            String(a.course_name || a.course_id || "").toLowerCase().includes(q) ||
            String(a.template_name || "").toLowerCase().includes(q)
          );
        })
      : facultyAssignments;
    const dir = facultyAssignSortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      if (facultyAssignSortBy === "qty") {
        return (((a.question_count || 0) - (b.question_count || 0)) || 0) * dir;
      }
      const aVal =
        facultyAssignSortBy === "course"
          ? String(a.course_name || a.course_id || "")
          : facultyAssignSortBy === "template"
            ? String(a.template_name || "")
            : String(getFacultyAssignmentDisplayName(a));
      const bVal =
        facultyAssignSortBy === "course"
          ? String(b.course_name || b.course_id || "")
          : facultyAssignSortBy === "template"
            ? String(b.template_name || "")
            : String(getFacultyAssignmentDisplayName(b));
      return aVal.localeCompare(bVal, undefined, { sensitivity: "base", numeric: true }) * dir;
    });
  }, [facultyAssignments, facultyAssignSearch, facultyAssignSortBy, facultyAssignSortDir, usersList]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [roles, users, courses, venues, timeSlots, slotTemplates, assessmentSlotsData, leaveTypes, leaveWorkflows, settings, assignments, qbSubmissions, templates] = await Promise.all([
          fetch(`${API_BASE}/api/superadmin/roles`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/users`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/courses`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/venues`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/time-slots`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/slot-templates`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/assessment-slots`).then((r) => r.json()).catch(() => []),
          fetch(`${API_BASE}/api/superadmin/leave-types`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/leave-workflows`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/settings`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/faculty-assignments`).then((r) => r.json()).catch(() => []),
          fetch(`${API_BASE}/api/superadmin/question-bank-submissions`).then((r) => r.json()).catch(() => []),
          fetch(`${API_BASE}/api/templates`).then((r) => r.json()).catch(() => []),
        ]);
        setRolesList(Array.isArray(roles) ? roles : []);
        setUsersList(Array.isArray(users) ? users : []);
        setCoursesList(Array.isArray(courses) ? courses : []);
        setVenuesList(Array.isArray(venues) ? venues : []);
        setTimeSlotsList(Array.isArray(timeSlots) ? timeSlots : []);
        setSlotsList(Array.isArray(slotTemplates) ? slotTemplates : []);
        setAssessmentSlots(Array.isArray(assessmentSlotsData) ? assessmentSlotsData : []);
        setLeaveTypesList(Array.isArray(leaveTypes) ? leaveTypes : []);
        setLeaveWorkflowList(Array.isArray(leaveWorkflows) ? leaveWorkflows : []);
        setFacultyAssignments(Array.isArray(assignments) ? assignments : []);
        setQuestionBankSubmissions(Array.isArray(qbSubmissions) ? qbSubmissions : []);
        setTemplatesForAssign(Array.isArray(templates) ? templates : []);
        if (settings && typeof settings === "object") {
          if (settings.leaveApprovalSteps != null) setLeaveApprovalSteps(settings.leaveApprovalSteps);
        }
      } catch (err) {
        setLoadError(err.message || "Failed to load dashboard data. Run backend and seed: node scripts/seedSuperAdminData.js");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (activeSub !== "course-upload" && activeSub !== "course-completion") return;
    let cancelled = false;

    const fetchCourseCompletion = async () => {
      setCourseCompletionLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/superadmin/courses/completion-by-level`);
        const data = await res.json();
        if (cancelled) return;
        setCourseCompletionData(Array.isArray(data) ? data : []);
      } catch (_) {
        if (!cancelled) setCourseCompletionData([]);
      } finally {
        if (!cancelled) setCourseCompletionLoading(false);
      }
    };

    fetchCourseCompletion();
    return () => {
      cancelled = true;
    };
  }, [activeSub, coursesList]);

  useEffect(() => {
    if (activeSub !== "ps-courses") return;
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (psCourseStatusFilter) params.set("status", psCourseStatusFilter);
    const q = params.toString() ? `?${params.toString()}` : "";
    fetch(`${API_BASE}/api/ps-courses${q}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPsCoursesList(Array.isArray(data) ? data : []))
      .catch(() => setPsCoursesList([]));
  }, [activeSub, psCourseStatusFilter]);

  const refetchQuestionTemplates = useCallback(() => {
    templateApi
      .getAll()
      .then((data) => setQuestionTemplatesList(Array.isArray(data) ? data : []))
      .catch(() => setQuestionTemplatesList([]));
  }, []);

  useEffect(() => {
    if (activeSub !== "question-form-builder" && activeSub !== "course-upload") return;
    refetchQuestionTemplates();
  }, [activeSub, refetchQuestionTemplates]);

  // Bus management data
  useEffect(() => {
    if (activeSub !== "bus-list" && activeSub !== "bus-assign") return;
    let cancelled = false;
    const load = async () => {
      setBusMgmtLoading(true);
      try {
        const [busesRes, daysRes] = await Promise.all([
          fetch(`${API_BASE}/api/buses`).then((r) => r.json()).catch(() => []),
          fetch(`${API_BASE}/api/buses/dayscholars`).then((r) => r.json()).catch(() => []),
        ]);
        if (cancelled) return;
        setBusesList(Array.isArray(busesRes) ? busesRes : []);
        setDayscholarsList(Array.isArray(daysRes) ? daysRes : []);
      } catch (_) {
        if (!cancelled) {
          setBusesList([]);
          setDayscholarsList([]);
        }
      } finally {
        if (!cancelled) setBusMgmtLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeSub]);

  // Classroom management data for admin
  useEffect(() => {
    if (activeSub !== "classrooms-list") return;
    let cancelled = false;
    const load = async () => {
      setClassroomLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/tasks/classrooms`).then((r) => r.json()).catch(() => []);
        if (cancelled) return;
        const list = Array.isArray(res) ? res : [];
        setClassroomsList(list);
        setSelectedClassroomId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev;
          return list[0]?.id || "";
        });
      } catch (_) {
        if (!cancelled) {
          setClassroomsList([]);
          setSelectedClassroomId("");
        }
      } finally {
        if (!cancelled) setClassroomLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeSub]);

  useEffect(() => {
    if (activeSub !== "classrooms-list" || !selectedClassroomId) {
      setClassroomStudents([]);
      setSelectedClassroomMeta(null);
      return;
    }
    let cancelled = false;
    const loadStudents = async () => {
      setClassroomStudentsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/tasks/classrooms/${selectedClassroomId}/students`)
          .then((r) => r.json())
          .catch(() => ({}));
        if (cancelled) return;
        setClassroomStudents(Array.isArray(res?.students) ? res.students : []);
        setSelectedClassroomMeta(res?.classroom || null);
      } catch (_) {
        if (!cancelled) {
          setClassroomStudents([]);
          setSelectedClassroomMeta(null);
        }
      } finally {
        if (!cancelled) setClassroomStudentsLoading(false);
      }
    };
    loadStudents();
    return () => {
      cancelled = true;
    };
  }, [activeSub, selectedClassroomId]);

  // Combined list for PS Courses page: all Admin (Course details) + all PS courses
  const psCoursesCombinedList = useMemo(() => {
    const adminRows = (coursesList || []).map((c) => ({ ...c, _source: "Admin", _rowId: `admin-${c.id}` }));
    const psRows = (psCoursesList || []).map((c) => ({ ...c, _source: "PS", _rowId: `ps-${c.id}` }));
    return [...adminRows, ...psRows].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base", numeric: true }));
  }, [coursesList, psCoursesList]);

  const userRole = localStorage.getItem("role") || "admin";
  const userName = localStorage.getItem("userName") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const openEdit = (section, item) => {
    setEditModal({ open: true, section, itemId: item.id, item: { ...item } });
  };
  const openAdd = (section, defaultItem) => {
    setEditModal({ open: true, section, itemId: null, item: defaultItem });
  };
  const closeEdit = () => setEditModal({ open: false, section: "", itemId: null, item: {} });
  const setEditField = (key, value) => {
    setEditModal((prev) => ({ ...prev, item: { ...prev.item, [key]: value } }));
  };
  const setEditFieldRoles = (roles) => {
    setEditModal((prev) => ({ ...prev, item: { ...prev.item, roles } }));
  };
  const uploadAdminFile = async (file) => {
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.url) throw new Error(data?.message || "File upload failed");
    return {
      url: data.url.startsWith("http") ? data.url : `${API_BASE}${data.url}`,
      file_name: data.file_name || file.name,
    };
  };

  const saveEdit = async () => {
    const { section, itemId, item } = editModal;
    const base = `${API_BASE}/api/superadmin`;
    try {
      if (section === "roles") {
        const url = itemId ? `${base}/roles/${itemId}` : `${base}/roles`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: item.role, description: item.description, accesses: item.accesses }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save role");
        if (itemId) setRolesList((prev) => prev.map((r) => (r.id === itemId ? data : r)));
        else setRolesList((prev) => [...prev, data]);
      } else if (section === "users") {
        const url = itemId ? `${base}/users/${itemId}` : `${base}/users`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: item.email, name: item.name, roles: item.roles || [] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save user");
        if (itemId) setUsersList((prev) => prev.map((u) => (u.id === itemId ? data : u)));
        else setUsersList((prev) => [...prev, data]);
      } else if (section === "courses") {
        const url = itemId ? `${base}/courses/${itemId}` : `${base}/courses`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            description: item.description || "",
            status: item.status,
            type: item.type || "",
            course_logo: item.course_logo || "",
            level: item.level || "",
            activityPoints: Number(item.activityPoints || 0),
            rewardPoints: Number(item.rewardPoints || 0),
            faculty: item.faculty || "",
            cooldownEnabled: item.cooldownEnabled !== false,
            prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
            levels: Array.isArray(item.levels) ? item.levels.map((l) => ({
              ...l,
              studyMaterials: Array.isArray(l.studyMaterials) ? l.studyMaterials : [],
            })) : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save course");
        if (itemId) setCoursesList((prev) => prev.map((c) => (c.id === itemId ? data : c)));
        else setCoursesList((prev) => [...prev, data]);
      } else if (section === "venues") {
        const url = itemId ? `${base}/venues/${itemId}` : `${base}/venues`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: item.name, location: item.location }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save venue");
        if (itemId) setVenuesList((prev) => prev.map((v) => (v.id === itemId ? data : v)));
        else setVenuesList((prev) => [...prev, data]);
      } else if (section === "time") {
        const url = itemId ? `${base}/time-slots/${itemId}` : `${base}/time-slots`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startTime: item.startTime, endTime: item.endTime }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save time slot");
        if (itemId) setTimeSlotsList((prev) => prev.map((t) => (t.id === itemId ? data : t)));
        else setTimeSlotsList((prev) => [...prev, data]);
      } else if (section === "slots") {
        const url = itemId ? `${base}/slot-templates/${itemId}` : `${base}/slot-templates`;
        const status = (item.status === "Inactive" ? "Inactive" : "Active");
        const body = { venue_id: item.venueId, time_slot_id: item.timeId, status };
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save slot");
        if (itemId) setSlotsList((prev) => prev.map((s) => (s.id === itemId ? data : s)));
        else setSlotsList((prev) => [...prev, data]);
      } else if (section === "leave-types") {
        const url = itemId ? `${base}/leave-types/${itemId}` : `${base}/leave-types`;
        const status = item.status === "Inactive" ? "Inactive" : "Active";
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: item.type, code: item.code, status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save leave type");
        if (itemId) setLeaveTypesList((prev) => prev.map((l) => (l.id === itemId ? data : l)));
        else setLeaveTypesList((prev) => [...prev, data]);

        // Also save/update workflow for this leave type if provided
        const wfStr = (item.workflow || "").trim();
        if (wfStr) {
          const existing = leaveWorkflowList.find((w) => w.leaveType === data.type);
          const wfUrl = existing ? `${base}/leave-workflows/${existing.id}` : `${base}/leave-workflows`;
          const resWf = await fetch(wfUrl, {
            method: existing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leaveType: data.type, workflow: wfStr }),
          });
          const wfData = await resWf.json();
          if (!resWf.ok) throw new Error(wfData.message || "Failed to save workflow");
          if (existing) setLeaveWorkflowList((prev) => prev.map((w) => (w.id === existing.id ? wfData : w)));
          else setLeaveWorkflowList((prev) => [...prev, wfData]);
        }
      } else if (section === "leave-workflow") {
        const url = itemId ? `${base}/leave-workflows/${itemId}` : `${base}/leave-workflows`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaveType: item.leaveType, workflow: item.workflow }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save workflow");
        if (itemId) setLeaveWorkflowList((prev) => prev.map((w) => (w.id === itemId ? data : w)));
        else setLeaveWorkflowList((prev) => [...prev, data]);
      } else if (section === "buses") {
        const url = itemId ? `${API_BASE}/api/buses/${itemId}` : `${API_BASE}/api/buses`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            busNumber: item.busNumber,
            route: item.route,
            incharge_id: item.incharge_id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save bus");
        if (itemId) setBusesList((prev) => prev.map((b) => (b._id === itemId ? data : b)));
        else setBusesList((prev) => [...prev, data]);
      } else if (section === "ps-courses") {
        const token = localStorage.getItem("token");
        const url = itemId ? `${API_BASE}/api/ps-courses/${itemId}` : `${API_BASE}/api/ps-courses`;
        const res = await fetch(url, {
          method: itemId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            name: (item.name || "").trim(),
            description: (item.description || "").trim(),
            status: item.status || "Active",
            level: !!item.level,
            parentCourse: (item.parentCourse || "").trim(),
            prereq: Array.isArray(item.prereq) ? item.prereq : [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save");
        const out = { id: data.id || itemId, name: data.name, description: data.description, status: data.status, level: data.level, parentCourse: data.parentCourse, prereq: data.prereq || [] };
        if (itemId) setPsCoursesList((prev) => prev.map((c) => (c.id === itemId ? out : c)));
        else setPsCoursesList((prev) => [...prev, out]);
      }
      closeEdit();
    } catch (err) {
      alert(err.message || "Save failed");
    }
  };

  const deleteItem = (section, itemId) => {
    if (!window.confirm("Remove this item?")) return;
    if (section === "roles") setRolesList((prev) => prev.filter((r) => r.id !== itemId));
    else if (section === "users") setUsersList((prev) => prev.filter((u) => u.id !== itemId));
    else if (section === "courses") setCoursesList((prev) => prev.filter((c) => c.id !== itemId));
    else if (section === "venues") setVenuesList((prev) => prev.filter((v) => v.id !== itemId));
    else if (section === "time") setTimeSlotsList((prev) => prev.filter((t) => t.id !== itemId));
    else if (section === "slots") setSlotsList((prev) => prev.filter((s) => s.id !== itemId));
    else if (section === "leave-types") setLeaveTypesList((prev) => prev.filter((l) => l.id !== itemId));
    else if (section === "leave-workflow") setLeaveWorkflowList((prev) => prev.filter((w) => w.id !== itemId));
    else if (section === "buses") {
      fetch(`${API_BASE}/api/buses/${itemId}`, { method: "DELETE" })
        .then(() => setBusesList((prev) => prev.filter((b) => b._id !== itemId)))
        .catch((err) => alert(err.message));
    }
    closeEdit();
  };

  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = String(t).split(":");
    const hh = parseInt(h, 10);
    const am = hh < 12;
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return `${h12}:${m || "00"} ${am ? "AM" : "PM"}`;
  };

  const calculateSlotEndTime = (startTimeStr, allowedCourses) => {
    if (!startTimeStr) return "";
    let maxDuration = 0;
    (allowedCourses || []).forEach(ac => {
      const course = coursesList.find(c => c.id === ac.courseId);
      if (course && Array.isArray(course.levels)) {
        ac.levelIndices.forEach(idx => {
          const lvl = course.levels[idx];
          if (lvl) {
            maxDuration = Math.max(maxDuration, lvl.durationMinutes || 60);
          }
        });
      }
    });
    if (maxDuration === 0) maxDuration = 60;
    const [h, m] = startTimeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + maxDuration);
    const endH = date.getHours();
    const endM = date.getMinutes();
    const ampm = endH >= 12 ? 'PM' : 'AM';
    const displayH = endH % 12 || 12;
    const displayM = endM.toString().padStart(2, '0');
    return `${displayH}:${displayM} ${ampm}`;
  };

  const statsCourseChart = useMemo(() => {
    const labels = coursesList.length ? coursesList.map((c) => c.name) : ["PS Activity 101", "Advanced PS"];
    const counts = coursesList.length ? [320, 280, 150].slice(0, labels.length) : [320, 280, 150];
    return {
      labels,
      datasets: [{ label: "Applications", data: counts, backgroundColor: ["#2563eb", "#06b6d4", "#10b981"] }],
    };
  }, [coursesList]);
  const statsSlotChart = useMemo(() => {
    const labels = slotsList.length ? slotsList.map((s) => `${s.venueLabel} (${s.timeLabel})`) : ["Hall A (09:00–10:30)", "Lab 2 (14:00–15:30)", "Hall B (11:00–12:30)"];
    const bookings = slotsList.length ? [450, 320, 280].slice(0, labels.length) : [450, 320, 280];
    return {
      labels,
      datasets: [{ label: "Bookings", data: bookings, backgroundColor: ["#2563eb", "#06b6d4", "#10b981"] }],
    };
  }, [slotsList]);
  const statsWeeklyChart = useMemo(() => ({
    labels: ["Week 1 (Feb 17-23)", "Week 2 (Feb 24-Mar 2)", "Week 3 (Mar 3-9)"],
    datasets: [
      { label: "Cleared %", data: [85, 92, 78], borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", tension: 0.3 },
    ],
  }), []);
  const statsRegisteredChart = useMemo(() => ({
    labels: ["PS Activity 101", "Advanced PS", "Elective X"],
    datasets: [
      { label: "Registered", data: [600, 200, 50], backgroundColor: "rgba(139,92,246,0.6)", stack: "stack1" },
      { label: "Attended", data: [580, 195, 42], backgroundColor: "rgba(6,182,212,0.6)", stack: "stack1" },
    ],
  }), []);
  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" }, title: { display: !!title, text: title } },
  });

  /** One row per courseId (avoids duplicate labels if the API ever repeats). */
  const completionCoursesDeduped = useMemo(() => {
    const list = courseCompletionData || [];
    const seen = new Map();
    for (const c of list) {
      if (!c || c.courseId == null || c.courseId === "") continue;
      const id = String(c.courseId);
      if (!seen.has(id)) seen.set(id, c);
    }
    return Array.from(seen.values()).sort((a, b) =>
      String(a.courseName || "").localeCompare(String(b.courseName || ""), undefined, { sensitivity: "base", numeric: true })
    );
  }, [courseCompletionData]);

  const completionCoursesFiltered = useMemo(() => {
    const q = (completionCourseSearchQuery || "").trim().toLowerCase();
    if (!q) return completionCoursesDeduped;
    return completionCoursesDeduped.filter((c) => String(c.courseName || "").toLowerCase().includes(q));
  }, [completionCoursesDeduped, completionCourseSearchQuery]);

  const selectedCourseCompletion = useMemo(
    () => completionCoursesDeduped.find((c) => c.courseId === completionSelectedCourseId) || null,
    [completionCoursesDeduped, completionSelectedCourseId]
  );

  const completionLevelChartData = useMemo(() => {
    const c = selectedCourseCompletion;
    if (!c || !Array.isArray(c.levels)) return [];
    return c.levels.map((lvl) => {
      const enrolled = Number(lvl.enrolledCount || 0);
      const completed = Number(lvl.completedCount ?? (lvl.completedStudents || []).length ?? 0);
      const percentage = enrolled > 0 ? Number(((completed / enrolled) * 100).toFixed(1)) : 0;
      return {
        name: lvl.level || `Level ${lvl.levelIndex + 1}`,
        levelIndex: lvl.levelIndex,
        enrolled,
        completed,
        percentage,
        completionLabel: `${completed} / ${enrolled} students`,
      };
    });
  }, [selectedCourseCompletion]);

  const completionDeptOptions = useMemo(() => {
    const set = new Set();
    (selectedCourseCompletion?.levels || []).forEach((lvl) => {
      (lvl.completedStudents || []).forEach((s) => {
        if (s.dept) set.add(s.dept);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [selectedCourseCompletion]);

  const completionYearOptions = useMemo(() => {
    const set = new Set();
    (selectedCourseCompletion?.levels || []).forEach((lvl) => {
      (lvl.completedStudents || []).forEach((s) => {
        if (s.year) set.add(String(s.year));
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
  }, [selectedCourseCompletion]);

  const filterCompletionStudents = useCallback(
    (list) => {
      if (!Array.isArray(list)) return [];
      return list.filter((s) => {
        const att = Number(s.attempts ?? 0);
        if (completionMinAttempts !== "" && !Number.isNaN(Number(completionMinAttempts)) && att < Number(completionMinAttempts)) {
          return false;
        }
        if (completionMaxAttempts !== "" && !Number.isNaN(Number(completionMaxAttempts)) && att > Number(completionMaxAttempts)) {
          return false;
        }
        if (completionFilterDept && String(s.dept || "") !== completionFilterDept) return false;
        if (completionFilterYear && String(s.year || "") !== completionFilterYear) return false;
        return true;
      });
    },
    [completionMinAttempts, completionMaxAttempts, completionFilterDept, completionFilterYear]
  );

  useEffect(() => {
    setCompletionMinAttempts("");
    setCompletionMaxAttempts("");
    setCompletionFilterDept("");
    setCompletionFilterYear("");
  }, [completionSelectedCourseId]);

  const handleDownloadLevelExcel = useCallback((course, level, studentRows) => {
    const rows = (studentRows || []).map((student) => ({
      "Student Name": student.name || "",
      Regno: student.regno || "",
      Dept: student.dept || "",
      Year: student.year || "",
      Attempts: Number(student.attempts ?? 0),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Completed");

    const safeCourse = String(course?.courseName || "Course").replace(/[^a-zA-Z0-9]+/g, "_");
    const safeLevel = String(level?.level || "Level").replace(/[^a-zA-Z0-9]+/g, "");
    XLSX.writeFile(wb, `${safeCourse}_${safeLevel}_completed.xlsx`);
  }, []);

  const handleDownloadAllFilteredExcel = useCallback(
    (course) => {
      if (!course) return;
      const rows = [];
      (course.levels || []).forEach((lvl) => {
        const filtered = filterCompletionStudents(lvl.completedStudents || []);
        filtered.forEach((s) => {
          rows.push({
            Level: lvl.level || `Level ${(lvl.levelIndex ?? 0) + 1}`,
            "Student Name": s.name || "",
            Regno: s.regno || "",
            Dept: s.dept || "",
            Year: s.year || "",
            Attempts: Number(s.attempts ?? 0),
          });
        });
      });
      if (rows.length === 0) {
        alert("No rows match the current filters.");
        return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Filtered");
      const safeCourse = String(course.courseName || "Course").replace(/[^a-zA-Z0-9]+/g, "_");
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${safeCourse}_completion_filtered_${stamp}.xlsx`);
    },
    [filterCompletionStudents]
  );

  const assessmentSlotFilteredCourses = useMemo(() => {
    const q = (assessmentSlotCourseSearch || "").trim().toLowerCase();
    const sorted = [...(coursesList || [])].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base", numeric: true })
    );
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        String(c.name || "").toLowerCase().includes(q) ||
        String(c.type || "").toLowerCase().includes(q)
    );
  }, [coursesList, assessmentSlotCourseSearch]);

  const filteredAssessmentSlotsList = useMemo(() => {
    const q = (assessmentSlotsTableQuery || "").trim().toLowerCase();
    if (!q) return assessmentSlots || [];
    return (assessmentSlots || []).filter((row) => {
      const courses = (row.allowedCourses || []).map((ac) => ac.courseName || "").join(" ");
      const d = row.date ? new Date(row.date).toLocaleDateString("en-GB") : "";
      return (
        courses.toLowerCase().includes(q) ||
        String(row.venueLabel || "").toLowerCase().includes(q) ||
        d.toLowerCase().includes(q) ||
        String(row.startTime || "").toLowerCase().includes(q)
      );
    });
  }, [assessmentSlots, assessmentSlotsTableQuery]);

  const openSlotStep1Done = Object.keys(openSlotSelectedCourses).length > 0;
  const openSlotStep2Done =
    !!openSlotDate && !!openSlotVenueId && !!openSlotStartTime && Number(openSlotCapacity) > 0;
  const openSlotVenueName = (venuesList || []).find((v) => v.id === openSlotVenueId)?.name || "";

  const userInitials = userName.split(' ').map(n => n[0]).join('');

  return (
    <div className="dashboard-layout premium-layout admin-dashboard-layout">
      <SmartSidebar
        shell="light"
        subtitle="Admin Console"
        sections={NAV.map((section) => ({
          title: section.label,
          items: section.sub.map((sub) => {
            const baseUrl = `/admin/${sub.path || sub.id}`;
            return {
              id: sub.id,
              label: sub.label,
              // Map question-banks highlight for submissions view
              path: (activeSub === "question-bank-submissions-view" && sub.id === "question-banks") ? location.pathname : baseUrl,
              icon: sub.icon || section.icon,
              end: (sub.path || sub.id) === "overview",
            };
          }),
        }))}
        profileName={userName}
        profileRole="Admin"
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      <div className={`main-container-premium ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <header className="top-navbar-premium">
          <div className="search-bar-premium">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search for courses, slots, etc." />
          </div>

          <div className="top-nav-actions-premium">
            <button className="nav-btn-premium" title="Notifications">
              <Bell size={20} />
              <span className="badge-premium"></span>
            </button>
            <div className="header-profile-premium" onClick={() => setProfileModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setProfileModalOpen(true)}>
              <div className="avatar-minimal-premium">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        <main className="content-area-premium">
          <div className="dashboard-container-inner" style={{ padding: '24px' }}>
            {/* <div className="sa-welcome-banner" style={{ marginBottom: '24px' }}>
              <span className="sa-breadcrumb">
                <span className="highlight">Admin</span>
                <span className="sa-breadcrumb-sep">/</span>
                {NAV.find((s) => s.id === openNav)?.label}
                <span className="sa-breadcrumb-sep">/</span>
                <span className="sa-breadcrumb-current">{NAV.flatMap((s) => s.sub).find((s) => s.id === activeSub)?.label || "Overview"}</span>
              </span>
            </div> */}

          {loading && <div className="sa-loading">Loading dashboard data…</div>}
          {loadError && <div className="sa-error">{loadError}</div>}

          {!loading && !loadError && <>
          {/* Nav 1: Role based access */}
          {activeSub === "roles" && (
            <>
              {(() => {
                const totalRoles = rolesList.length;
                const totalPermissions = rolesList.reduce((sum, r) => {
                  const parts = (r.accesses || "").split(",").map((s) => s.trim()).filter(Boolean);
                  return sum + parts.length;
                }, 0);
                const totalUsers = usersList.length;
                const activeRoles = rolesList.filter((r) => String(r.status || "").toLowerCase() !== "inactive").length || totalRoles;
                return (
                  <>
                    <div className="dashboard-card sa-roles-hero">
                      <div className="sa-roles-hero-header">
                        <div>
                          <h2 className="sa-roles-title">Admin Dashboard — Roles</h2>
                          <p className="sa-roles-subtitle">
                            Manage system roles and their permissions. Create roles, assign access levels, and control what each user can do.
                          </p>
                        </div>
                      </div>
                      <div className="sa-roles-metrics">
                        <div className="sa-roles-metric-card sa-roles-metric-total">
                          <div className="sa-roles-metric-label">Total Roles</div>
                          <div className="sa-roles-metric-value">{totalRoles}</div>
                        </div>
                        <div className="sa-roles-metric-card sa-roles-metric-permissions">
                          <div className="sa-roles-metric-label">Permissions</div>
                          <div className="sa-roles-metric-value">{totalPermissions}</div>
                        </div>
                        <div className="sa-roles-metric-card sa-roles-metric-users">
                          <div className="sa-roles-metric-label">Assigned Users</div>
                          <div className="sa-roles-metric-value">{totalUsers}</div>
                        </div>
                        <div className="sa-roles-metric-card sa-roles-metric-active">
                          <div className="sa-roles-metric-label">Active Roles</div>
                          <div className="sa-roles-metric-value">{activeRoles}</div>
                        </div>
                      </div>
                      <div className="sa-roles-actions-row">
                        <button
                          type="button"
                          className="sa-btn sa-btn-primary"
                          onClick={() => openAdd("roles", { role: "", description: "", accesses: "" })}
                        >
                          <Plus size={16} /> Create New Role
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-ghost"
                          onClick={() => navigate("/admin/roles")}
                        >
                          Manage Permissions
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-ghost"
                          onClick={() => navigate("/admin/create-user")}
                        >
                          Assign Users
                        </button>
                      </div>
                    </div>

                    <div className="dashboard-card sa-roles-table-card">
                      <div className="sa-roles-table-header">
                        <div>
                          <h3 className="card-title">Roles — Create new and assign accesses</h3>
                          <p className="card-subtitle">Search, filter and edit system roles.</p>
                        </div>
                        <div className="sa-roles-table-controls">
                          <div className="sa-roles-search">
                            <input
                              type="text"
                              className="sa-roles-search-input"
                              placeholder="Search roles..."
                              // (UI only for now)
                            />
                          </div>
                          <button type="button" className="sa-btn sa-btn-secondary">
                            Filter
                          </button>
                        </div>
                      </div>
                      <table className="sa-table">
                        <thead>
                          <tr>
                            <th>Role</th>
                            <th>Description</th>
                            <th>Users</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rolesList.map((row) => {
                            const roleTagStyle = getRoleTagStyle(row.role);
                            const usersForRole = usersList.filter((u) =>
                              Array.isArray(u.roles) ? u.roles.includes(row.role) : false
                            ).length;
                            return (
                              <tr key={row.id}>
                                <td>
                                  <div className="sa-roles-role-cell">
                                    <div
                                      className="sa-roles-role-icon"
                                      aria-hidden
                                      style={roleTagStyle}
                                    >
                                      {row.role?.[0]?.toUpperCase() || "R"}
                                    </div>
                                    <div className="sa-roles-role-text">
                                      <div className="sa-roles-role-name">{row.role}</div>
                                      <div className="sa-roles-role-chip">{row.status || "Active"}</div>
                                    </div>
                                  </div>
                                </td>
                                <td>{row.description}</td>
                                <td>
                                  <span className="sa-roles-users-count">
                                    {usersForRole}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="sa-btn sa-btn-icon"
                                    onClick={() => openEdit("roles", row)}
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {activeSub === "users-list" && (
            <div className="dashboard-card">
              <h3 className="card-title">List of users and their roles</h3>
              <p className="card-subtitle">View and edit user role assignments.</p>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Roles</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.email}</td>
                      <td>{row.name}</td>
                      <td><span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{row.roles?.map((r) => <span key={r} className="sa-tag" style={getRoleTagStyle(r)}>{r}</span>)}</span></td>
                      <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("users", row)}><Pencil size={14} /> Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "create-user" && (
            <div className="dashboard-card sa-create-user-card">
              <div className="sa-create-user-hero">
                <div>
                  <h3 className="sa-create-user-title">Create New User</h3>
                  <p className="sa-create-user-subtitle">
                    Add user with email and assign one or more roles. Selected roles will be highlighted with colours.
                  </p>
                </div>
              </div>

              <div className="sa-create-user-body">
                <div className="sa-form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="sa-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={createUserForm.name}
                    onChange={(e) => setCreateUserForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="sa-form-group sa-create-user-roles-group">
                  <div className="sa-create-user-roles-header">
                    <label>Assign Roles *</label>
                    <span className="sa-create-user-roles-count">
                      {createUserForm.roles.length} selected
                    </span>
                  </div>
                  <div className="sa-create-user-roles-grid">
                    {rolesList.map((r) => {
                      const roleName = r.role;
                      const checked = createUserForm.roles.includes(roleName);
                      const tagStyle = getRoleTagStyle(roleName);
                      const cardStyle = checked
                        ? {
                            borderColor: tagStyle.backgroundColor,
                            backgroundColor: tagStyle.backgroundColor,
                          }
                        : {};
                      return (
                        <label
                          key={r.id || roleName}
                          className={`sa-create-role-card ${checked ? "sa-create-role-card--selected" : ""}`}
                          style={cardStyle}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setCreateUserForm((p) => ({
                                ...p,
                                roles: e.target.checked
                                  ? [...p.roles, roleName]
                                  : p.roles.filter((x) => x !== roleName),
                              }))
                            }
                          />
                          <div className="sa-create-role-icon" aria-hidden style={tagStyle}>
                            {roleName?.[0]?.toUpperCase() || "R"}
                          </div>
                          <div className="sa-create-role-text">
                            <div className="sa-create-role-name">{roleName}</div>
                            {r.description && (
                              <div className="sa-create-role-desc">{r.description}</div>
                            )}
                          </div>
                          {checked && <div className="sa-create-role-check" aria-hidden>✓</div>}
                        </label>
                      );
                    })}
                  </div>
                  <p className="sa-create-user-tip">
                    Tip: You can assign multiple roles to a user. Selected roles will be shown below.
                  </p>
                </div>

                <div className="sa-create-user-selected">
                  <div className="sa-create-user-selected-title">Selected Roles</div>
                  <div className="sa-create-user-selected-tags">
                    {createUserForm.roles.length === 0 && (
                      <span className="sa-muted">No roles selected yet.</span>
                    )}
                    {createUserForm.roles.map((role) => {
                      const tagStyle = getRoleTagStyle(role);
                      return (
                        <span key={role} className="sa-create-user-chip" style={tagStyle}>
                          <span className="sa-create-user-chip-label">{role}</span>
                          <button
                            type="button"
                            className="sa-create-user-chip-close"
                            onClick={() =>
                              setCreateUserForm((p) => ({
                                ...p,
                                roles: p.roles.filter((x) => x !== role),
                              }))
                            }
                            aria-label={`Remove ${role}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="sa-create-user-footer">
                <button
                  type="button"
                  className="sa-btn sa-btn-primary"
                  onClick={async () => {
                    if (!createUserForm.email?.trim() || !createUserForm.name?.trim()) return;
                    try {
                      const res = await fetch(`${API_BASE}/api/superadmin/users`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: createUserForm.email.trim(),
                          name: createUserForm.name.trim() || "",
                          roles: createUserForm.roles,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || "Failed to create user");
                      setUsersList((prev) => [...prev, data]);
                      setCreateUserForm({ email: "", name: "", roles: [] });
                    } catch (e) {
                      alert(e.message || "Create failed");
                    }
                  }}
                >
                  <Plus size={16} /> Create User
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn-ghost"
                  onClick={() => setCreateUserForm({ email: "", name: "", roles: [] })}
                >
                  Clear Form
                </button>
                <span className="sa-create-user-footer-hint">
                  Fill all required fields to continue
                </span>
              </div>
            </div>
          )}

          {/* Nav 2: Courses (Admin view as cards, like student dashboard) */}
          {activeSub === "course-upload" && (
            <>
              <div className="dashboard-card sa-roles-hero">
                {/* <div className="sa-roles-hero-header">
                  <div>
                    <h2 className="sa-roles-title">Admin Dashboard — Courses</h2>
                    <p className="sa-roles-subtitle">
                      Create, manage, and monitor all courses available on the portal. Update content, prerequisites, and reward structures.
                    </p>
                  </div>
                </div> */}
                <div className="sa-roles-metrics">
                  <div className="sa-roles-metric-card sa-roles-metric-total">
                    <div className="sa-roles-metric-label">Total Courses</div>
                    <div className="sa-roles-metric-value">{coursesList.length}</div>
                  </div>
                  <div className="sa-roles-metric-card sa-roles-metric-active">
                    <div className="sa-roles-metric-label">Active Courses</div>
                    <div className="sa-roles-metric-value">{coursesList.filter((c) => c.status === "Active").length}</div>
                  </div>
                  {/* <div className="sa-roles-metric-card sa-roles-metric-users">
                    <div className="sa-roles-metric-label">PS Courses Integration</div>
                    <div className="sa-roles-metric-value">{psCoursesList.length}</div>
                  </div> */}
                  {/* <div className="sa-roles-metric-card sa-roles-metric-permissions">
                    <div className="sa-roles-metric-label">Content Uploads</div>
                    <div className="sa-roles-metric-value">{coursesList.reduce((acc, c) => acc + (Array.isArray(c.levels) ? c.levels.length : 0), 0)} Levels</div>
                  </div> */}
                </div>
                <div className="sa-roles-actions-row">
                  <button
                    type="button"
                    className="sa-btn sa-btn-primary"
                    onClick={() =>
                      openAdd("courses", {
                        name: "",
                        type: "",
                        course_logo: "",
                        level: "",
                        status: "Active",
                        activityPoints: 0,
                        rewardPoints: 0,
                        faculty: "",
                        prerequisites: [],
                        levels: [],
                      })
                    }
                  >
                    <Plus size={16} /> Create New Course
                  </button>
                  <button
                    type="button"
                    className="sa-btn sa-btn-ghost"
                    onClick={() => navigate("/admin/course-details")}
                  >
                    Manage Course Details
                  </button>
                </div>
              </div>

              <div className="dashboard-card sa-roles-table-card">
                <div className="sa-roles-table-header">
                  <div>
                    <h3 className="card-title">Course Overview Gallery</h3>
                    <p className="card-subtitle">Browsing {coursesList.length} total available courses in the system.</p>
                  </div>
                  <div className="sa-roles-table-controls">
                    <div className="sa-roles-search">
                      <input
                        type="text"
                        className="sa-roles-search-input"
                        placeholder="Search courses..."
                        value={courseOverviewSearch}
                        onChange={(e) => setCourseOverviewSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="courses-grid-premium">
                  {coursesList
                    .filter((c) => !courseOverviewSearch || (c.name || "").toLowerCase().includes(courseOverviewSearch.toLowerCase()) || (c.type || "").toLowerCase().includes(courseOverviewSearch.toLowerCase()))
                    .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base", numeric: true }))
                    .map((row) => (
                    <div className="course-card-premium" key={row.id}>
                      <div className="course-card-image-wrapper">
                        {row.course_logo ? (
                          <img
                            src={row.course_logo}
                            alt={row.name}
                            className="course-card-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="course-image-placeholder-premium">
                            <BookOpen size={48} style={{ color: "rgba(255,255,255,0.6)" }} />
                          </div>
                        )}
                        <div className="course-card-badge type-badge">{row.type || "Course"}</div>
                        <div className={`course-card-badge status-badge ${row.status === "Active" ? "status-active" : "status-inactive"}`}>
                          {row.status}
                        </div>
                      </div>
                      <div className="course-card-body-premium">
                        <h3 className="course-card-title-premium">{row.name}</h3>
                        <div className="course-card-meta-premium">
                          <div className="meta-pill">
                            <BookMarked size={14} /> {row.level || "General"}
                          </div>
                          {Array.isArray(row.levels) && row.levels.length > 0 && (
                            <div className="meta-pill">
                              <List size={14} />{row.levels.length} Level{row.levels.length !== 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                        <div className="course-card-footer-premium">
                          <button
                            type="button"
                            className="sa-btn sa-btn-ghost btn-full"
                            onClick={() => openEdit("courses", row)}
                          >
                            <Pencil size={14} /> Edit Course
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {coursesList.length === 0 ? (
                    <div className="courses-empty-premium">
                      <div className="empty-icon-wrapper"><BookOpen size={48} /></div>
                      <h4>No Courses Found</h4>
                      <p>Get started by creating your first course format.</p>
                      <button
                        type="button"
                        className="sa-btn sa-btn-primary"
                        onClick={() => openAdd("courses", {
                          name: "", type: "", course_logo: "", level: "", status: "Active",
                          activityPoints: 0, rewardPoints: 0, faculty: "", prerequisites: [], levels: []
                        })}
                      >
                        Create Course
                      </button>
                    </div>
                  ) : coursesList.filter((c) => !courseOverviewSearch || (c.name || "").toLowerCase().includes(courseOverviewSearch.toLowerCase()) || (c.type || "").toLowerCase().includes(courseOverviewSearch.toLowerCase())).length === 0 ? (
                    <div className="courses-empty-premium" style={{ borderStyle: "solid", background: "transparent" }}>
                      <div className="empty-icon-wrapper" style={{ background: "transparent", color: "#cbd5e1" }}><Search size={48} /></div>
                      <h4>No Matches Found</h4>
                      <p>Try adjusting your search query.</p>
                      <button type="button" className="sa-btn sa-btn-ghost" onClick={() => setCourseOverviewSearch("")}>Clear Search</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}

          {activeSub === "course-points" && (
            <div className="dashboard-card">
              <h3 className="card-title">Course details</h3>
              <p className="card-subtitle">Configure levels, activity points, reward points, faculty, and prerequisites per course. Click a row to edit.</p>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Course name</th>
                    <th>Level</th>
                    <th>Activity points</th>
                    <th>Reward points</th>
                    <th>Faculty</th>
                    <th>Prerequisites</th>
                    <th>Levels</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursesList.map((row) => {
                    const facultyUser = facultyList.find((u) => u.id === row.faculty);
                    const levels = Array.isArray(row.levels) ? row.levels : [];
                    const prereqNames = Array.isArray(row.prerequisites)
                      ? row.prerequisites.map((id) => coursesList.find((c) => c.id === id)?.name).filter(Boolean)
                      : [];
                    const expanded = row._levelsExpanded;
                    return (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td><strong>{row.name}</strong></td>
                          <td>{row.level || "—"}</td>
                          <td>{row.activityPoints ?? 0}</td>
                          <td>{row.rewardPoints ?? 0}</td>
                          <td>{facultyUser ? facultyUser.name || facultyUser.email : "—"}</td>
                          <td>{prereqNames.length ? prereqNames.join(", ") : "—"}</td>
                          <td>
                            {levels.length > 0 ? (
                              <button
                                type="button"
                                className="sa-details-levels-toggle"
                                onClick={() => {
                                  setCoursesList((prev) => prev.map((c) => c.id === row.id ? { ...c, _levelsExpanded: !c._levelsExpanded } : { ...c, _levelsExpanded: false }));
                                }}
                              >
                                {expanded ? "Hide" : "View"} {levels.length} level{levels.length !== 1 ? "s" : ""}
                                <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
                              </button>
                            ) : (
                              <span className="sa-muted">—</span>
                            )}
                          </td>
                          <td>
                            <button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("courses", row)}>
                              <Pencil size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                        {levels.length > 0 && expanded && (
                          <tr>
                            <td colSpan={8} style={{ padding: "0 12px 12px 12px", verticalAlign: "top" }}>
                              <div className="sa-details-levels-body">
                                {levels.map((lev, idx) => {
                                  const prereqIndices = Array.isArray(lev.prerequisiteLevelIndices) ? lev.prerequisiteLevelIndices : (lev.prerequisiteLevelIndex != null && lev.prerequisiteLevelIndex >= 0 ? [lev.prerequisiteLevelIndex] : []);
                                  const prereqText = prereqIndices.length === 0 ? "No" : prereqIndices.map((i) => `Level ${i + 1}`).join(", ");
                                  return (
                                    <div key={idx} className="sa-details-level-card">
                                      <div className="sa-details-level-info">
                                        <h4>{idx + 1}. {lev.name || `Level ${idx}`}</h4>
                                        <div className="sa-details-level-meta">
                                          {Array.isArray(lev.topics) && lev.topics.length ? lev.topics.join(" · ") : "No topics"}
                                        </div>
                                      </div>
                                      <div className="sa-details-level-meta" style={{ textAlign: "right" }}>
                                        <div><strong>{lev.rewardPoints ?? 0} pts</strong></div>
                                        <div>Prereq: {prereqText}</div>
                                        <div>{lev.assessmentType || "MCQ"}</div>
                                        <div>Materials: {Array.isArray(lev.studyMaterials) ? lev.studyMaterials.length : 0}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "course-completion" && (
            <>
              <div className="dashboard-card sa-roles-table-card completion-course-page">
                <div className="sa-roles-table-header">
                  <div>
                    <h3 className="card-title">Course completion</h3>
                    <p className="card-subtitle">Search and select a course to view per-level completion, attempts, and export filtered data.</p>
                  </div>
                </div>

                {courseCompletionLoading && <div className="sa-loading">Loading course completion data…</div>}

                {!courseCompletionLoading && completionCoursesDeduped.length > 0 && (
                  <div className="completion-course-picker">
                    <div className="completion-course-picker__toolbar">
                      <label htmlFor="completion-course-search" className="completion-course-picker__label">
                        Find a course
                      </label>
                      <div className="completion-course-picker__search-wrap">
                        <Search className="completion-course-picker__search-icon" size={18} aria-hidden />
                        <input
                          id="completion-course-search"
                          type="search"
                          className="completion-course-picker__search-input"
                          placeholder="Type to filter by course name…"
                          value={completionCourseSearchQuery}
                          onChange={(e) => setCompletionCourseSearchQuery(e.target.value)}
                          autoComplete="off"
                        />
                        {completionCourseSearchQuery ? (
                          <button
                            type="button"
                            className="completion-course-picker__search-clear"
                            onClick={() => setCompletionCourseSearchQuery("")}
                            aria-label="Clear search"
                          >
                            <X size={16} />
                          </button>
                        ) : null}
                      </div>
                      <p className="completion-course-picker__count">
                        Showing <strong>{completionCoursesFiltered.length}</strong> of <strong>{completionCoursesDeduped.length}</strong> courses
                        {completionSelectedCourseId && selectedCourseCompletion ? (
                          <>
                            {" · "}
                            <span className="completion-course-picker__selected-pill">
                              Current: {selectedCourseCompletion.courseName}
                            </span>
                            <button
                              type="button"
                              className="completion-course-picker__clear-course sa-btn sa-btn-ghost"
                              onClick={() => {
                                setCompletionSelectedCourseId("");
                                setCompletionCourseSearchQuery("");
                              }}
                            >
                              Clear selection
                            </button>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="completion-course-picker__list-scroll" role="listbox" aria-label="Courses">
                      {completionCoursesFiltered.length === 0 ? (
                        <div className="completion-course-picker__empty">No courses match “{completionCourseSearchQuery}”. Try another search.</div>
                      ) : (
                        completionCoursesFiltered.map((c) => {
                          const isSelected = completionSelectedCourseId === c.courseId;
                          return (
                            <button
                              key={c.courseId}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`completion-course-picker__row ${isSelected ? "is-selected" : ""}`}
                              onClick={() => {
                                setCompletionSelectedCourseId(c.courseId);
                              }}
                            >
                              <span className="completion-course-picker__row-name">{c.courseName || "Untitled course"}</span>
                              <span className="completion-course-picker__row-meta">
                                {Number(c.completedCount || 0)} / {Number(c.enrolledCount || 0)} completed
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {!courseCompletionLoading && !completionSelectedCourseId && completionCoursesDeduped.length > 0 && (
                  <p className="completion-course-picker__hint sa-muted">Select a course in the list above to load charts and tables.</p>
                )}

                {!courseCompletionLoading && completionSelectedCourseId && selectedCourseCompletion && (
                  <>
                    <div className="dashboard-card sa-roles-table-card" style={{ marginTop: 0 }}>
                      <div className="sa-roles-table-header">
                        <div>
                          <h3 className="card-title">Completion by level — {selectedCourseCompletion.courseName}</h3>
                          <p className="card-subtitle">
                            Overall: {selectedCourseCompletion.completedCount} / {selectedCourseCompletion.enrolledCount} students completed at least one level · Per bar: completed / enrolled at that level
                          </p>
                        </div>
                      </div>
                      <div style={{ width: "100%", height: 320 }}>
                        {completionLevelChartData.length === 0 ? (
                          <p className="sa-muted">No level data for this course.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={completionLevelChartData} margin={{ top: 24, right: 16, left: 8, bottom: 56 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={70} />
                              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                              <RechartsTooltip
                                formatter={(value, _name, item) => [`${value}%`, `${item?.payload?.completionLabel || ""}`]}
                                labelFormatter={(label) => `Level: ${label}`}
                              />
                              <RechartsBar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]}>
                                <LabelList dataKey="completionLabel" position="top" style={{ fontSize: 11, fill: "#334155" }} />
                              </RechartsBar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className="dashboard-card sa-roles-table-card">
                      <div className="sa-roles-table-header">
                        <div>
                          <h3 className="card-title">Table filters</h3>
                          <p className="card-subtitle">Filters apply to every level table below and to the combined Excel export.</p>
                        </div>
                        <button
                          type="button"
                          className="sa-btn sa-btn-primary"
                          onClick={() => handleDownloadAllFilteredExcel(selectedCourseCompletion)}
                        >
                          Download Excel (filtered)
                        </button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                        <div>
                          <label className="sa-muted" style={{ display: "block", marginBottom: 6 }}>Min attempts</label>
                          <input
                            type="number"
                            min={0}
                            className="sa-roles-search-input"
                            style={{ width: 100 }}
                            placeholder="Any"
                            value={completionMinAttempts}
                            onChange={(e) => setCompletionMinAttempts(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="sa-muted" style={{ display: "block", marginBottom: 6 }}>Max attempts</label>
                          <input
                            type="number"
                            min={0}
                            className="sa-roles-search-input"
                            style={{ width: 100 }}
                            placeholder="Any"
                            value={completionMaxAttempts}
                            onChange={(e) => setCompletionMaxAttempts(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="sa-muted" style={{ display: "block", marginBottom: 6 }}>Department</label>
                          <select
                            className="sa-select"
                            value={completionFilterDept}
                            onChange={(e) => setCompletionFilterDept(e.target.value)}
                          >
                            <option value="">All departments</option>
                            {completionDeptOptions.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="sa-muted" style={{ display: "block", marginBottom: 6 }}>Year</label>
                          <select
                            className="sa-select"
                            value={completionFilterYear}
                            onChange={(e) => setCompletionFilterYear(e.target.value)}
                          >
                            <option value="">All years</option>
                            {completionYearOptions.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(selectedCourseCompletion.levels || []).map((lvl) => {
                        const allStudents = lvl.completedStudents || [];
                        const filtered = filterCompletionStudents(allStudents);
                        return (
                          <div key={`${selectedCourseCompletion.courseId}-${lvl.levelIndex}`} className="dashboard-card sa-roles-table-card" style={{ margin: 0 }}>
                            <div className="sa-roles-table-header">
                              <div>
                                <h3 className="card-title">{lvl.level || `Level ${(lvl.levelIndex ?? 0) + 1}`}</h3>
                                <p className="card-subtitle">
                                  {lvl.completedCount ?? allStudents.length} completed · {lvl.enrolledCount ?? "—"} enrolled at this level
                                </p>
                              </div>
                              <button
                                type="button"
                                className="sa-btn sa-btn-ghost"
                                disabled={filtered.length === 0}
                                onClick={() => handleDownloadLevelExcel(selectedCourseCompletion, lvl, filtered)}
                              >
                                Download Excel (this level)
                              </button>
                            </div>
                            {allStudents.length === 0 ? (
                              <p className="sa-muted">No students have completed this level yet.</p>
                            ) : filtered.length === 0 ? (
                              <p className="sa-muted">No rows match the current filters.</p>
                            ) : (
                              <table className="sa-table">
                                <thead>
                                  <tr>
                                    <th>Student Name</th>
                                    <th>Register Number (Regno)</th>
                                    <th>Attempts</th>
                                    <th>Department (Dept)</th>
                                    <th>Year</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filtered.map((student, idx) => (
                                    <tr key={`${lvl.levelIndex}-${student.regno || idx}`}>
                                      <td>{student.name || "—"}</td>
                                      <td>{student.regno || "—"}</td>
                                      <td>{Number(student.attempts ?? 0)}</td>
                                      <td>{student.dept || "—"}</td>
                                      <td>{student.year || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {!courseCompletionLoading && courseCompletionData.length === 0 && (
                  <p className="sa-muted">No course completion data available.</p>
                )}
              </div>
            </>
          )}

          {activeSub === "ps-courses" && (
            <div className="dashboard-card">
              <h3 className="card-title">PS Courses</h3>
              <p className="card-subtitle">All courses: Course details (Admin) + PS courses in one list. View levels, prerequisites, and full details. Edit via Course details or PS Edit/Delete.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search by name or subject..."
                  value={psCourseSearch}
                  onChange={(e) => setPsCourseSearch(e.target.value)}
                  className="sa-form-group"
                  style={{ minWidth: 200 }}
                />
                <select value={psCourseStatusFilter} onChange={(e) => setPsCourseStatusFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
                <button
                  type="button"
                  className="sa-btn sa-btn-primary"
                  onClick={() => openAdd("ps-courses", { name: "", description: "", status: "Active", level: false, parentCourse: "", prereq: [] })}
                >
                  <Plus size={16} /> Add course
                </button>
                {psCourseSelectedIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="sa-btn"
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${API_BASE}/api/ps-courses/bulk-status`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({ ids: psCourseSelectedIds, status: "Active" }),
                        });
                        if (res.ok) { setPsCourseSelectedIds([]); setPsCoursesList((prev) => prev.map((c) => (psCourseSelectedIds.includes(c.id) ? { ...c, status: "Active" } : c))); }
                      }}
                    >
                      Activate selected
                    </button>
                    <button
                      type="button"
                      className="sa-btn"
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${API_BASE}/api/ps-courses/bulk-status`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify({ ids: psCourseSelectedIds, status: "Inactive" }),
                        });
                        if (res.ok) { setPsCourseSelectedIds([]); setPsCoursesList((prev) => prev.map((c) => (psCourseSelectedIds.includes(c.id) ? { ...c, status: "Inactive" } : c))); }
                      }}
                    >
                      Deactivate selected
                    </button>
                  </>
                )}
              </div>
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" disabled={psCoursesCombinedList.filter((c) => c._source === "PS").length === 0} checked={psCoursesList.length > 0 && psCourseSelectedIds.length === psCoursesList.filter((c) => !psCourseSearch || (c.name || "").toLowerCase().includes(psCourseSearch.toLowerCase()) || (c.parentCourse || "").toLowerCase().includes(psCourseSearch.toLowerCase())).length} onChange={(e) => { const filtered = psCoursesList.filter((c) => !psCourseSearch || (c.name || "").toLowerCase().includes(psCourseSearch.toLowerCase()) || (c.parentCourse || "").toLowerCase().includes(psCourseSearch.toLowerCase())); setPsCourseSelectedIds(e.target.checked ? filtered.map((c) => c.id) : []); }} title="Select PS courses only" /></th>
                      <th>Source</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Subject / Type</th>
                      <th>Prerequisites</th>
                      <th>Levels</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {psCoursesCombinedList
                      .filter((row) => {
                        const search = (psCourseSearch || "").toLowerCase();
                        if (!search) return true;
                        const name = (row.name || "").toLowerCase();
                        const desc = (row.description || "").toLowerCase();
                        const subject = (row._source === "Admin" ? (row.type || row.level || "") : (row.parentCourse || "")).toLowerCase();
                        return name.includes(search) || desc.includes(search) || subject.includes(search);
                      })
                      .filter((row) => !psCourseStatusFilter || row.status === psCourseStatusFilter)
                      .map((row) => {
                        const levels = Array.isArray(row.levels) ? row.levels : [];
                        const prereqList = row._source === "Admin"
                          ? (Array.isArray(row.prerequisites) ? row.prerequisites.map((id) => coursesList.find((c) => c.id === id)?.name).filter(Boolean) : [])
                          : (Array.isArray(row.prereq) ? row.prereq : []);
                        const subjectDisplay = row._source === "Admin" ? (row.type || row.level || "—") : (row.parentCourse || "—");
                        const expanded = psCourseExpandedId === row._rowId;
                        const isPs = row._source === "PS";
                        return (
                          <React.Fragment key={row._rowId}>
                            <tr>
                              <td>
                                {isPs ? (
                                  <input type="checkbox" checked={psCourseSelectedIds.includes(row.id)} onChange={(e) => setPsCourseSelectedIds((prev) => (e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)))} />
                                ) : (
                                  <span className="sa-muted">—</span>
                                )}
                              </td>
                              <td><span className={`sa-badge ${row._source === "Admin" ? "sa-badge-success" : "sa-badge-warning"}`}>{row._source}</span></td>
                              <td><strong>{row.name}</strong></td>
                              <td style={{ maxWidth: 200 }}>{(row.description || "").slice(0, 60)}{(row.description || "").length > 60 ? "…" : ""}</td>
                              <td>{subjectDisplay}</td>
                              <td>{prereqList.length ? prereqList.join(", ") : "—"}</td>
                              <td>
                                {levels.length > 0 ? (
                                  <button
                                    type="button"
                                    className="sa-details-levels-toggle"
                                    onClick={() => setPsCourseExpandedId(expanded ? null : row._rowId)}
                                  >
                                    {expanded ? "Hide" : "View"} {levels.length} level{levels.length !== 1 ? "s" : ""}
                                    <ChevronDown size={16} style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
                                  </button>
                                ) : (
                                  <span className="sa-muted">—</span>
                                )}
                              </td>
                              <td>
                                {isPs ? (
                                  <select
                                    value={row.status || "Active"}
                                    onChange={async (e) => {
                                      const token = localStorage.getItem("token");
                                      const status = e.target.value;
                                      const res = await fetch(`${API_BASE}/api/ps-courses/${row.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                        body: JSON.stringify({ ...row, status }),
                                      });
                                      if (res.ok) setPsCoursesList((prev) => prev.map((c) => (c.id === row.id ? { ...c, status } : c)));
                                    }}
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Draft">Draft</option>
                                  </select>
                                ) : (
                                  <span className={`sa-badge ${row.status === "Active" ? "sa-badge-success" : "sa-badge-warning"}`}>{row.status || "—"}</span>
                                )}
                              </td>
                              <td>
                                {isPs ? (
                                  <>
                                    <button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("ps-courses", row)}><Pencil size={14} /> Edit</button>
                                    <button
                                      type="button"
                                      className="sa-btn sa-btn-sm"
                                      style={{ marginLeft: 6, background: "#dc2626", color: "#fff" }}
                                      onClick={async () => {
                                        if (!window.confirm("Delete this course?")) return;
                                        const token = localStorage.getItem("token");
                                        const res = await fetch(`${API_BASE}/api/ps-courses/${row.id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
                                        if (res.ok) setPsCoursesList((prev) => prev.filter((c) => c.id !== row.id));
                                      }}
                                    >
                                      <X size={14} /> Delete
                                    </button>
                                  </>
                                ) : (
                                  <button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("courses", row)}><Pencil size={14} /> Edit (Course details)</button>
                                )}
                              </td>
                            </tr>
                            {levels.length > 0 && expanded && (
                              <tr>
                                <td colSpan={9} style={{ padding: "0 12px 12px 12px", verticalAlign: "top" }}>
                                  <div className="sa-details-levels-body">
                                    {levels.map((lev, idx) => {
                                      const prereqIndices = Array.isArray(lev.prerequisiteLevelIndices) ? lev.prerequisiteLevelIndices : (lev.prerequisiteLevelIndex != null && lev.prerequisiteLevelIndex >= 0 ? [lev.prerequisiteLevelIndex] : []);
                                      const prereqText = prereqIndices.length === 0 ? "No" : prereqIndices.map((i) => `Level ${i + 1}`).join(", ");
                                      return (
                                        <div key={idx} className="sa-details-level-card">
                                          <div className="sa-details-level-info">
                                            <h4>{idx + 1}. {lev.name || `Level ${idx}`}</h4>
                                            {lev.description ? <p className="sa-muted" style={{ margin: "4px 0 0", fontSize: 13 }}>{lev.description}</p> : null}
                                            <div className="sa-details-level-meta">
                                              {Array.isArray(lev.topics) && lev.topics.length ? lev.topics.join(" · ") : "No topics"}
                                            </div>
                                          </div>
                                          <div className="sa-details-level-meta" style={{ textAlign: "right" }}>
                                            <div><strong>{lev.rewardPoints ?? 0} pts</strong></div>
                                            <div>Prereq: {prereqText}</div>
                                            <div>{lev.assessmentType || "MCQ"}</div>
                                          <div>Materials: {Array.isArray(lev.studyMaterials) ? lev.studyMaterials.length : 0}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSub === "question-banks" && (
            <div className="dashboard-card">
              <h3 className="card-title">Question bank submissions</h3>
              <p className="card-subtitle">Review and approve or reject question banks submitted by faculty for each course.</p>
              <div className="sa-form-group" style={{ marginBottom: 16, maxWidth: 280 }}>
                <label>Filter by course</label>
                <select value={questionBankFilterCourse} onChange={(e) => setQuestionBankFilterCourse(e.target.value)}>
                  <option value="">All courses</option>
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Level</th>
                      <th>Faculty</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionBankSubmissions
                      .filter((s) => !questionBankFilterCourse || s.course_id === questionBankFilterCourse)
                      .map((s) => (
                        <tr key={s.id}>
                          <td>{s.course_name}</td>
                          <td>
                            <span className="sa-badge" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                              {s.level_name || (s.level_index !== undefined ? `Level ${s.level_index + 1}` : "Level 1")}
                            </span>
                          </td>
                          <td>{s.faculty_name || s.faculty_email}</td>
                          <td>{s.title || "—"}</td>
                          <td>
                            <span className={`sa-badge ${s.status === "approved" ? "sa-badge-success" : s.status === "rejected" ? "sa-badge-danger" : "sa-badge-warning"}`}>
                              {s.status === "approved" ? "Approved" : s.status === "rejected" ? "Rejected" : "Pending"}
                            </span>
                          </td>
                          <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}</td>
                          <td>
                            <button
                              type="button"
                              className="sa-btn sa-btn-sm"
                              style={{ marginRight: 6 }}
                              onClick={() => {
                                const url = `/admin/question-bank-submissions/${s.id}`;
                                window.open(url, "_blank", "noopener,noreferrer");
                              }}
                            >
                              View
                            </button>
                            {(s.status === "submitted" || s.status === "draft") && (
                              <>
                                <button
                                  type="button"
                                  className="sa-btn sa-btn-sm sa-btn-success"
                                  style={{ marginRight: 6 }}
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_BASE}/api/superadmin/question-bank-submissions/${s.id}/review`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "approved" }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.message || "Failed");
                                      setQuestionBankSubmissions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "approved" } : x)));
                                    } catch (e) {
                                      alert(e.message || "Failed to approve");
                                    }
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="sa-btn sa-btn-sm"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_BASE}/api/superadmin/question-bank-submissions/${s.id}/review`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "rejected" }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.message || "Failed");
                                      setQuestionBankSubmissions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "rejected" } : x)));
                                    } catch (e) {
                                      alert(e.message || "Failed to reject");
                                    }
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {questionBankSubmissions.filter((s) => !questionBankFilterCourse || s.course_id === questionBankFilterCourse).length === 0 && (
                <p className="sa-muted">No question bank submissions yet. Faculty will see tasks on their dashboard and submit here for your approval.</p>
              )}
            </div>
          )}

          {activeSub === "question-bank-submissions-view" && (
            <QuestionBankSubmissionView id={bankSubmissionIdView} />
          )}

          {activeSub === "question-form-builder" && (
            <div className="dashboard-card">
              <h3 className="card-title">Question form builder</h3>
              <p className="card-subtitle">List of question types. Use Edit to open in the Question Template Builder (drag-and-drop is there).</p>
              {questionTemplatesList.length > 0 ? (
                <ul className="sa-table-wrap" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {questionTemplatesList.map((t) => (
                    <li
                      key={t._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        borderBottom: "1px solid #e2e8f0",
                        gap: 16,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="card-title" style={{ fontSize: 14, fontWeight: 600 }}>{t.name || "Unnamed"}</span>
                        {t.key && (
                          <span className="sa-muted" style={{ display: "block", fontSize: 12, marginTop: 2 }}>{t.key}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="sa-btn sa-btn-primary sa-btn-sm"
                        onClick={() => {
                          navigate("/admin/question-template-builder/" + t._id);
                        }}
                      >
                        <Pencil size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sa-muted">No question templates yet. Create one in Question Template Builder (Courses → Question Template Builder) using the drag-and-drop builder.</p>
              )}
            </div>
          )}

          {activeSub === "question-template-builder" && (
            <div
              className="qtb-fullscreen"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                backgroundColor: "#f1f5f9",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <QuestionTemplateBuilder
                initialTemplateId={templateIdToEditForBuilder}
                onClose={() => {
                  navigate("/admin/question-form-builder");
                  setActiveSub("question-form-builder");
                  refetchQuestionTemplates();
                }}
              />
            </div>
          )}

          {/* Nav 3: Slots */}
          {activeSub === "venue" && (
            <div className="dashboard-card">
              <h3 className="card-title">Venue</h3>
              <p className="card-subtitle">Manage venues for slots.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }} onClick={() => openAdd("venues", { name: "", location: "" })}><Plus size={16} /> Add venue</button>
              <table className="sa-table">
                <thead><tr><th>Venue name</th><th>Location</th><th>Actions</th></tr></thead>
                <tbody>
                  {venuesList.map((row) => (
                    <tr key={row.id}><td>{row.name}</td><td>{row.location}</td><td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("venues", row)}><Pencil size={14} /></button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "time" && (
            <div className="dashboard-card">
              <h3 className="card-title">Time</h3>
              <p className="card-subtitle">Manage time slots.</p>
              <button type="button" className="sa-btn sa-btn-primary" style={{ marginBottom: 16 }} onClick={() => openAdd("time", { startTime: "09:00", endTime: "10:30" })}><Plus size={16} /> Add time slot</button>
              <table className="sa-table">
                <thead><tr><th>Start time</th><th>End time</th><th>Actions</th></tr></thead>
                <tbody>
                  {timeSlotsList.map((row) => (
                    <tr key={row.id}>
                      <td>{formatTime(row.startTime)}</td>
                      <td>{formatTime(row.endTime)}</td>
                      <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("time", row)}><Pencil size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "slots-list" && (
            <div className="dashboard-card">
              <h3 className="card-title">Slots (venue, time)</h3>
              <p className="card-subtitle">Edit and add new slots.</p>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                style={{ marginBottom: 16 }}
                onClick={() => {
                  const v = venuesList[0];
                  const t = timeSlotsList[0];
                  openAdd("slots", { venueId: v?.id || "", timeId: t?.id || "", venueLabel: v?.name || "", timeLabel: t ? `${formatTime(t.startTime)} – ${formatTime(t.endTime)}` : "", status: "Active" });
                }}
              >
                <Plus size={16} /> New slot
              </button>
              <table className="sa-table">
                <thead><tr><th>Venue</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {slotsList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.venueLabel}</td>
                      <td>{row.timeLabel}</td>
                      <td><span className={`sa-slot-status ${(row.status || "Active").toLowerCase() === "active" ? "sa-slot-active" : "sa-slot-inactive"}`}>{row.status || "Active"}</span></td>
                      <td><button type="button" className="sa-btn sa-btn-sm" onClick={() => openEdit("slots", { ...row, venueId: row.venueId, timeId: row.timeId, status: row.status || "Active" })}><Pencil size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "assessment-slots" && (
            <div className="assessment-slots-page">
              <div className="dashboard-card assessment-slots-hero">
                <div className="assessment-slots-hero__row">
                  <div className="assessment-slots-hero__titles">
                    <h2 className="card-title assessment-slots-hero__title">Assessment slots</h2>
                    <p className="card-subtitle assessment-slots-hero__sub">
                      1) Pick courses and levels → 2) Set schedule → 3) Open the slot. Manage existing sessions below.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="sa-btn sa-btn-ghost assessment-slots-export-btn"
                    onClick={exportAssessmentSlots}
                    title="Download all rows as Excel"
                  >
                    <FileText size={18} />
                    Export Excel
                  </button>
                </div>
              </div>

              <div className="dashboard-card assessment-slots-create">
                <div className="assessment-slots-create__intro">
                  <PlusCircle className="assessment-slots-create__intro-icon" size={22} aria-hidden />
                  <div>
                    <h3 className="assessment-slots-create__heading">Open a new slot</h3>
                    <p className="assessment-slots-create__lede">Students book against these course/level combinations for one date, venue, and time window.</p>
                  </div>
                </div>

                <ol className="assessment-slots-flow" aria-label="Steps to open a slot">
                  <li className={`assessment-slots-flow__step ${openSlotStep1Done ? "is-done" : ""}`}>
                    <div className="assessment-slots-flow__step-head">
                      <span className="assessment-slots-flow__badge">1</span>
                      <div>
                        <h4 className="assessment-slots-flow__step-title">Courses & levels</h4>
                        <p className="assessment-slots-flow__step-desc">Select at least one course. Refine which levels are included.</p>
                      </div>
                      {openSlotStep1Done ? <CheckCircle className="assessment-slots-flow__check" size={20} aria-hidden /> : null}
                    </div>
                    <div className="assessment-slots-flow__body">
                      <div className="assessment-slots-course-search">
                        <Search size={18} className="assessment-slots-course-search__icon" aria-hidden />
                        <input
                          type="search"
                          className="assessment-slots-course-search__input"
                          placeholder="Filter courses by name or type…"
                          value={assessmentSlotCourseSearch}
                          onChange={(e) => setAssessmentSlotCourseSearch(e.target.value)}
                          autoComplete="off"
                        />
                        {assessmentSlotCourseSearch ? (
                          <button
                            type="button"
                            className="assessment-slots-course-search__clear"
                            onClick={() => setAssessmentSlotCourseSearch("")}
                            aria-label="Clear filter"
                          >
                            <X size={16} />
                          </button>
                        ) : null}
                      </div>
                      <p className="assessment-slots-flow__hint">
                        Showing <strong>{assessmentSlotFilteredCourses.length}</strong> of <strong>{coursesList.length}</strong> courses
                        {openSlotStep1Done ? (
                          <span className="assessment-slots-flow__hint-ok"> — {Object.keys(openSlotSelectedCourses).length} course(s) selected</span>
                        ) : null}
                      </p>
                      <div className="assessment-slots-course-grid">
                        {assessmentSlotFilteredCourses.map((course) => {
                          const levelSelection = openSlotSelectedCourses[course.id];
                          const levels = Array.isArray(course.levels) ? course.levels : [];
                          return (
                            <div
                              key={course.id}
                              className={`assessment-slots-course-card ${levelSelection ? "is-on" : ""}`}
                            >
                              <label className="assessment-slots-course-card__top">
                                <input
                                  type="checkbox"
                                  checked={!!levelSelection}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setOpenSlotSelectedCourses((prev) => ({
                                        ...prev,
                                        [course.id]: levels.map((_, idx) => idx),
                                      }));
                                    } else {
                                      setOpenSlotSelectedCourses((prev) => {
                                        const next = { ...prev };
                                        delete next[course.id];
                                        return next;
                                      });
                                    }
                                  }}
                                />
                                <span className="assessment-slots-course-card__name">{course.name}</span>
                                {course.type ? <span className="assessment-slots-course-card__type">{course.type}</span> : null}
                              </label>
                              {levelSelection && levels.length > 0 ? (
                                <div className="assessment-slots-course-card__levels">
                                  {levels.map((lvl, idx) => (
                                    <label key={idx} className="assessment-slots-course-card__level">
                                      <input
                                        type="checkbox"
                                        checked={levelSelection.includes(idx)}
                                        onChange={(e) => {
                                          setOpenSlotSelectedCourses((prev) => {
                                            const currentLevels = prev[course.id] || [];
                                            let nextLevels;
                                            if (e.target.checked) nextLevels = [...currentLevels, idx];
                                            else nextLevels = currentLevels.filter((i) => i !== idx);
                                            if (nextLevels.length === 0) {
                                              const next = { ...prev };
                                              delete next[course.id];
                                              return next;
                                            }
                                            return { ...prev, [course.id]: nextLevels };
                                          });
                                        }}
                                      />
                                      {lvl.name || `Level ${idx + 1}`}
                                    </label>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      {assessmentSlotFilteredCourses.length === 0 ? (
                        <p className="assessment-slots-flow__empty">No courses match this filter. Clear the search or add courses in Course details.</p>
                      ) : null}
                    </div>
                  </li>

                  <li className={`assessment-slots-flow__step ${openSlotStep2Done ? "is-done" : ""}`}>
                    <div className="assessment-slots-flow__step-head">
                      <span className="assessment-slots-flow__badge">2</span>
                      <div>
                        <h4 className="assessment-slots-flow__step-title">Schedule & capacity</h4>
                        <p className="assessment-slots-flow__step-desc">When and where this session runs, and how many seats to offer.</p>
                      </div>
                      {openSlotStep2Done ? <CheckCircle className="assessment-slots-flow__check" size={20} aria-hidden /> : null}
                    </div>
                    <div className="assessment-slots-flow__body">
                      <div className="assessment-slots-schedule-grid">
                        <div className="sa-form-group assessment-slots-field">
                          <label htmlFor="as-date">Date</label>
                          <input
                            id="as-date"
                            type="date"
                            className="sa-roles-search-input assessment-slots-field__input"
                            value={openSlotDate}
                            onChange={(e) => setOpenSlotDate(e.target.value)}
                          />
                        </div>
                        <div className="sa-form-group assessment-slots-field">
                          <label htmlFor="as-venue">Venue</label>
                          <select
                            id="as-venue"
                            className="sa-select assessment-slots-field__input"
                            value={openSlotVenueId}
                            onChange={(e) => setOpenSlotVenueId(e.target.value)}
                          >
                            <option value="">Select venue…</option>
                            {venuesList.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sa-form-group assessment-slots-field">
                          <label htmlFor="as-time">Start time</label>
                          <input
                            id="as-time"
                            type="time"
                            className="sa-roles-search-input assessment-slots-field__input"
                            value={openSlotStartTime}
                            onChange={(e) => setOpenSlotStartTime(e.target.value)}
                          />
                        </div>
                        <div className="sa-form-group assessment-slots-field">
                          <label htmlFor="as-cap">Seat capacity</label>
                          <input
                            id="as-cap"
                            type="number"
                            min={1}
                            className="sa-roles-search-input assessment-slots-field__input"
                            value={openSlotCapacity}
                            onChange={(e) => setOpenSlotCapacity(Number(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="assessment-slots-flow__step assessment-slots-flow__step--review">
                    <div className="assessment-slots-flow__step-head">
                      <span className="assessment-slots-flow__badge">3</span>
                      <div>
                        <h4 className="assessment-slots-flow__step-title">Review & publish</h4>
                        <p className="assessment-slots-flow__step-desc">Confirm details, then create the slot for students to book.</p>
                      </div>
                    </div>
                    <div className="assessment-slots-flow__body">
                      <div className="assessment-slots-summary" role="status">
                        <div className="assessment-slots-summary__row">
                          <span className="assessment-slots-summary__label">Courses</span>
                          <span className="assessment-slots-summary__value">
                            {openSlotStep1Done ? `${Object.keys(openSlotSelectedCourses).length} selected` : "—"}
                          </span>
                        </div>
                        <div className="assessment-slots-summary__row">
                          <span className="assessment-slots-summary__label">When</span>
                          <span className="assessment-slots-summary__value">
                            {openSlotDate
                              ? new Date(openSlotDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                            {openSlotStartTime ? ` · ${formatTime(openSlotStartTime)} start` : ""}
                          </span>
                        </div>
                        <div className="assessment-slots-summary__row">
                          <span className="assessment-slots-summary__label">Where</span>
                          <span className="assessment-slots-summary__value">{openSlotVenueName || "—"}</span>
                        </div>
                        <div className="assessment-slots-summary__row">
                          <span className="assessment-slots-summary__label">Capacity</span>
                          <span className="assessment-slots-summary__value">{Number(openSlotCapacity) > 0 ? openSlotCapacity : "—"}</span>
                        </div>
                      </div>
                      {!openSlotStep1Done || !openSlotStep2Done ? (
                        <p className="assessment-slots-summary__missing">
                          Complete steps 1–2 to enable <strong>Open slot</strong>.
                        </p>
                      ) : null}
                      <div className="assessment-slots-submit">
                        <button
                          type="button"
                          className="sa-btn sa-btn-primary assessment-slots-submit__btn"
                          disabled={!openSlotStep1Done || !openSlotStep2Done || isOpeningSlots}
                          onClick={async () => {
                            setIsOpeningSlots(true);
                            try {
                              const res = await fetch(`${API_BASE}/api/superadmin/assessment-slots`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  allowed_courses: Object.entries(openSlotSelectedCourses).map(([id, levels]) => ({
                                    course_id: id,
                                    level_indices: levels,
                                  })),
                                  date: openSlotDate,
                                  venue_id: openSlotVenueId,
                                  startTime: openSlotStartTime,
                                  capacity: openSlotCapacity,
                                }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message || "Failed to open slots");
                              alert(data.message);
                              setOpenSlotVenueId("");
                              setOpenSlotStartTime("");
                              setOpenSlotDate("");
                              setOpenSlotSelectedCourses({});
                              setOpenSlotCapacity(30);
                              setAssessmentSlotCourseSearch("");
                              const updatedRes = await fetch(`${API_BASE}/api/superadmin/assessment-slots`);
                              const updatedData = await updatedRes.json();
                              setAssessmentSlots(updatedData);
                            } catch (err) {
                              alert(err.message);
                            } finally {
                              setIsOpeningSlots(false);
                            }
                          }}
                        >
                          {isOpeningSlots ? "Opening slot…" : "Open slot"}
                        </button>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="dashboard-card assessment-slots-list-card">
                <div className="assessment-slots-list-head">
                  <div>
                    <h3 className="assessment-slots-list-head__title">Scheduled slots</h3>
                    <p className="assessment-slots-list-head__sub">{assessmentSlots.length} total — search to narrow by course, venue, or date</p>
                  </div>
                  <div className="assessment-slots-list-search">
                    <Search size={18} aria-hidden />
                    <input
                      type="search"
                      placeholder="Filter table…"
                      value={assessmentSlotsTableQuery}
                      onChange={(e) => setAssessmentSlotsTableQuery(e.target.value)}
                      className="assessment-slots-list-search__input"
                      aria-label="Filter scheduled slots"
                    />
                  </div>
                </div>

                <div className="sa-table-wrap assessment-slots-table-wrap">
                  <table className="sa-table assessment-slots-table">
                    <thead>
                      <tr>
                        <th>Courses & levels</th>
                        <th>Date</th>
                        <th>Venue</th>
                        <th>Time window</th>
                        <th>Booking</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssessmentSlotsList.map((row) => (
                        <tr key={row.id}>
                          <td data-label="Courses">
                            <div className="assessment-slots-table__courses">
                              {(row.allowedCourses || []).map((ac, idx) => (
                                <div key={idx} className="assessment-slots-table__course-pill">
                                  <span className="assessment-slots-table__course-name">{ac.courseName}</span>
                                  <span className="assessment-slots-table__course-levels">
                                    Levels {(ac.levelIndices || []).map((i) => i + 1).join(", ")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td data-label="Date">
                            {new Date(row.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td data-label="Venue">{row.venueLabel}</td>
                          <td data-label="Time">
                            <span className="assessment-slots-table__time">
                              {formatTime(row.startTime)} – {calculateSlotEndTime(row.startTime, row.allowedCourses)}
                            </span>
                          </td>
                          <td data-label="Booking">
                            <div className="assessment-slots-booking">
                              <div className="assessment-slots-booking__labels">
                                <span className={row.bookedCount >= row.capacity ? "is-full" : ""}>{row.bookedCount} / {row.capacity}</span>
                              </div>
                              <div className="assessment-slots-booking__bar">
                                <div
                                  className="assessment-slots-booking__fill"
                                  style={{
                                    width: `${Math.min(100, (row.bookedCount / Math.max(1, row.capacity)) * 100)}%`,
                                    backgroundColor: row.bookedCount >= row.capacity ? "#ef4444" : "#3b82f6",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td data-label="Actions">
                            <div className="assessment-slots-table__actions">
                              <button
                                type="button"
                                className="sa-btn sa-btn-sm sa-btn-ghost"
                                title="View report"
                                onClick={() => navigate(`/admin/assessment-slots/${row.id}/report`)}
                              >
                                <BarChart3 size={16} />
                                <span className="assessment-slots-table__btn-label">Report</span>
                              </button>
                              <button
                                type="button"
                                className="sa-btn sa-btn-sm sa-btn-ghost assessment-slots-table__btn-danger"
                                title="Delete slot"
                                onClick={async () => {
                                  if (!window.confirm("Delete this assessment slot? Students can no longer book it.")) return;
                                  try {
                                    const res = await fetch(`${API_BASE}/api/superadmin/assessment-slots/${row.id}`, {
                                      method: "DELETE",
                                    });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.message || "Delete failed");
                                    setAssessmentSlots((prev) => prev.filter((s) => s.id !== row.id));
                                  } catch (err) {
                                    alert(err.message);
                                  }
                                }}
                              >
                                <Trash2 size={16} />
                                <span className="assessment-slots-table__btn-label">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {assessmentSlots.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="assessment-slots-table__empty">
                            <CalendarCheck size={40} className="assessment-slots-table__empty-icon" aria-hidden />
                            <p>No slots yet. Use <strong>Open a new slot</strong> above to create one.</p>
                          </td>
                        </tr>
                      ) : null}
                      {assessmentSlots.length > 0 && filteredAssessmentSlotsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="assessment-slots-table__empty">
                            <p>No slots match “{assessmentSlotsTableQuery}”. Try another search.</p>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSub === "assessment-slot-report" && selectedReportSlotId && (
            <SlotReportView 
              slotId={selectedReportSlotId} 
              onBack={() => navigate("/admin/assessment-slots")} 
            />
          )}

          {/* Leaves: Leave Flow (create new leave types with flow) */}
          {activeSub === "leave-flow" && (
            <div className="dashboard-card">
              <h3 className="card-title">Leave Flow</h3>
              <p className="card-subtitle">Create a leave type and define its approval flow. First approver is always Parents, then choose up to 4 more roles.</p>
              <div className="sa-form-group">
                <label>Leave type</label>
                <input
                  type="text"
                  className="sa-input"
                  placeholder="e.g. Sick Leave"
                  value={leaveFlowSelectedType}
                  onChange={(e) => setLeaveFlowSelectedType(e.target.value)}
                />
              </div>
              <div className="sa-leave-flow-steps">
                <div className="sa-flow-step-row">
                  <span className="sa-flow-step-label">Parents</span>
                  <span className="sa-tag" style={getRoleTagStyle("parents")}>Parents</span>
                </div>
                {leaveFlowSteps.map((role, idx) => (
                  <div key={idx} className="sa-flow-step-row">
                    <span className="sa-flow-step-label">{`Step ${idx + 2}`}</span>
                    <select
                      value={role}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLeaveFlowSteps((prev) => {
                          const next = [...prev];
                          next[idx] = v;
                          return next;
                        });
                      }}
                      className="sa-flow-role-select"
                    >
                      <option value="">Select role...</option>
                      {rolesList
                        .filter((r) => (r.role || "").toLowerCase() !== "student")
                        .map((r) => (
                          <option key={r.id} value={r.role}>{r.role}</option>
                        ))}
                    </select>
                    {role && (
                      <span className="sa-tag" style={getRoleTagStyle(role)}>{role}</span>
                    )}
                    {idx === leaveFlowSteps.length - 1 && idx < 4 && (
                      <button
                        type="button"
                        className="sa-btn sa-btn-icon"
                        title="Add next step"
                        onClick={() => setLeaveFlowSteps((prev) => (prev.length < 5 ? [...prev, ""] : prev))}
                      >
                        <Plus size={18} />
                      </button>
                    )}
                    {leaveFlowSteps.length > 1 && (
                      <button
                        type="button"
                        className="sa-btn sa-btn-icon sa-btn-ghost"
                        title="Remove step"
                        onClick={() => setLeaveFlowSteps((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                style={{ marginTop: 16 }}
                disabled={!leaveFlowSelectedType.trim()}
                onClick={async () => {
                  const typeName = leaveFlowSelectedType.trim();
                  if (!typeName) return;
                  const extraSteps = leaveFlowSteps.filter(Boolean);
                  const steps = ["Parents", ...extraSteps];
                  const workflow = steps.join(", ");
                  try {
                    const base = `${API_BASE}/api/superadmin`;
                    // Ensure LeaveType exists (create if needed)
                    const existingType = leaveTypesList.find((lt) => lt.type === typeName);
                    let typeData = existingType || null;
                    if (existingType) {
                      const status = existingType.status === "Inactive" ? "Inactive" : "Active";
                      const resType = await fetch(`${base}/leave-types/${existingType.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: typeName, code: existingType.code, status }),
                      });
                      const dataType = await resType.json();
                      if (!resType.ok) throw new Error(dataType.message || "Failed to save leave type");
                      typeData = dataType;
                      setLeaveTypesList((prev) => prev.map((l) => (l.id === dataType.id ? dataType : l)));
                    } else {
                      const defaultCode = typeName.split(" ").map((w) => w[0] || "").join("").toUpperCase() || "LV";
                      const resType = await fetch(`${base}/leave-types`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: typeName, code: defaultCode, status: "Active" }),
                      });
                      const dataType = await resType.json();
                      if (!resType.ok) throw new Error(dataType.message || "Failed to create leave type");
                      typeData = dataType;
                      setLeaveTypesList((prev) => [...prev, dataType]);
                    }

                    // Create or update workflow for this leave type
                    const existingWf = leaveWorkflowList.find((w) => w.leaveType === typeName);
                    const url = existingWf ? `${base}/leave-workflows/${existingWf.id}` : `${base}/leave-workflows`;
                    const res = await fetch(url, {
                      method: existingWf ? "PUT" : "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ leaveType: typeName, workflow }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Failed to save leave flow");
                    if (existingWf) setLeaveWorkflowList((prev) => prev.map((w) => (w.id === existingWf.id ? data : w)));
                    else setLeaveWorkflowList((prev) => [...prev, data]);
                    alert("Leave flow saved.");
                  } catch (e) {
                    alert(e.message || "Save failed");
                  }
                }}
              >
                Save flow
              </button>
            </div>
          )}

          {/* Leaves: All Leave Types */}
          {activeSub === "all-leave-types" && (
            <div className="dashboard-card">
              <h3 className="card-title">All Leave Types</h3>
              <p className="card-subtitle">Edit leave types and their status. Use Active/Inactive to enable or disable.</p>
              <table className="sa-table">
                <thead><tr><th>Type</th><th>Code</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaveTypesList.map((row) => (
                    <tr key={row.id}>
                      <td>{row.type}</td>
                      <td>{row.code}</td>
                      <td>
                        <span className={`sa-badge ${(row.status || "Active") === "Active" ? "sa-badge-success" : "sa-badge-warning"}`}>
                          {row.status || "Active"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() => {
                            const wf = leaveWorkflowList.find((w) => w.leaveType === row.type);
                            openEdit("leave-types", { ...row, status: row.status || "Active", workflow: wf?.workflow || "" });
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "code-access" && (
            <div className="dashboard-card">
              <h3 className="card-title">Assign courses to faculty</h3>
              <p className="card-subtitle">Assign courses to technical faculty so they appear in their user dashboard and can submit question banks.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
                <div className="sa-form-group" style={{ minWidth: 200 }}>
                  <label>User (faculty)</label>
                  <select value={facultyAssignUserId} onChange={(e) => setFacultyAssignUserId(e.target.value)}>
                    <option value="">Select user</option>
                    {facultyList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email} {u.roles?.length ? `(${u.roles.join(", ")})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="sa-form-group" style={{ minWidth: 200 }}>
                  <label>Course</label>
                  <select
                    value={facultyAssignCourseId}
                    onChange={(e) => {
                      setFacultyAssignCourseId(e.target.value);
                      setFacultyAssignLevelIndex(0);
                    }}
                  >
                    <option value="">Select course</option>
                    {coursesList
                      .filter((c) => c.status === "Active")
                      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base", numeric: true }))
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <div className="sa-form-group" style={{ minWidth: 160 }}>
                  <label>Level</label>
                  <select
                    value={facultyAssignLevelIndex}
                    onChange={(e) => setFacultyAssignLevelIndex(Number(e.target.value))}
                    disabled={!facultyAssignCourseId}
                  >
                    {(() => {
                      const selectedCourse = coursesList.find(c => c.id === facultyAssignCourseId);
                      const levels = selectedCourse?.levels || [];
                      if (levels.length === 0) return <option value={0}>Standard / Level 1</option>;
                      return levels.map((lvl, idx) => (
                        <option key={idx} value={idx}>{lvl.name || `Level ${idx + 1}`}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div className="sa-form-group" style={{ minWidth: 200 }}>
                  <label>Question template (optional)</label>
                  <select
                    value={facultyAssignTemplateId}
                    onChange={(e) => setFacultyAssignTemplateId(e.target.value)}
                  >
                    <option value="">None / document only</option>
                    {templatesForAssign?.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sa-form-group" style={{ minWidth: 140 }}>
                  <label>No. of questions</label>
                  <input
                    type="number"
                    min={1}
                    value={facultyAssignQuestionCount}
                    onChange={(e) => setFacultyAssignQuestionCount(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <div className="sa-form-group" style={{ alignSelf: "flex-end" }}>
                  <button
                    type="button"
                    className="sa-btn sa-btn-primary"
                    disabled={!facultyAssignUserId || !facultyAssignCourseId}
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/api/superadmin/faculty-assignments`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            user_id: facultyAssignUserId,
                            course_id: facultyAssignCourseId,
                            level_index: facultyAssignLevelIndex,
                            template_id: facultyAssignTemplateId || undefined,
                            question_count: facultyAssignTemplateId ? facultyAssignQuestionCount : undefined,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || "Failed");
                        const u = usersList.find((x) => x.id === facultyAssignUserId);
                        setFacultyAssignments((prev) => [
                          ...prev,
                          {
                            id: data.id,
                            user_id: data.user_id,
                            course_id: data.course_id,
                            course_name: data.course_name,
                            level_index: data.level_index,
                            user_name: u?.name,
                            user_email: u?.email,
                            template_id: data.template_id || null,
                            template_name: data.template_name || "",
                            question_count: data.question_count || 0,
                          },
                        ]);
                        setFacultyAssignUserId("");
                        setFacultyAssignCourseId("");
                        setFacultyAssignLevelIndex(0);
                        setFacultyAssignTemplateId("");
                      } catch (e) {
                        alert(e.message || "Assign failed");
                      }
                    }}
                  >
                    + Assign
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12, alignItems: "end" }}>
                <div className="sa-form-group" style={{ minWidth: 220 }}>
                  <label>Search assignments</label>
                  <input
                    type="text"
                    value={facultyAssignSearch}
                    onChange={(e) => setFacultyAssignSearch(e.target.value)}
                    placeholder="Search by user/course/template"
                  />
                </div>
                <div className="sa-form-group" style={{ minWidth: 180 }}>
                  <label>Sort by</label>
                  <select value={facultyAssignSortBy} onChange={(e) => setFacultyAssignSortBy(e.target.value)}>
                    <option value="user">User</option>
                    <option value="course">Course</option>
                    <option value="template">Question template</option>
                    <option value="qty">Qty</option>
                  </select>
                </div>
                <div className="sa-form-group" style={{ minWidth: 140 }}>
                  <label>Order</label>
                  <select value={facultyAssignSortDir} onChange={(e) => setFacultyAssignSortDir(e.target.value)}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
              <table className="sa-table">
                <thead><tr><th>User</th><th>Course</th><th>Level</th><th>Question template</th><th>Qty</th><th>Actions</th></tr></thead>
                <tbody>
                  {sortedFacultyAssignments.map((a) => {
                    const displayName = getFacultyAssignmentDisplayName(a);
                    return (
                    <tr key={a.id}>
                      <td>
                        <button
                          type="button"
                          className="sa-chat-name-btn"
                          onClick={() => {
                            setChatWithUserId(a.user_id);
                            setChatWithUserName(displayName);
                            setChatOpen(true);
                          }}
                        >
                          {displayName}
                        </button>
                      </td>
                      <td>{a.course_name || a.course_id}</td>
                      <td>
                        <span className="sa-badge" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {a.level_name || (a.level_index !== undefined ? `Level ${a.level_index + 1}` : "Level 1")}
                        </span>
                      </td>
                      <td>{a.template_name || "—"}</td>
                      <td>{a.question_count || 0}</td>
                      <td>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/api/superadmin/faculty-assignments/${a.id}`, { method: "DELETE" });
                              if (!res.ok) throw new Error("Failed to remove");
                              setFacultyAssignments((prev) => prev.filter((x) => x.id !== a.id));
                            } catch (e) {
                              alert(e.message);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ); })}
                </tbody>
              </table>
              {facultyAssignments.length === 0 && (
                <p className="sa-muted">No assignments yet. Select a user and course above to assign.</p>
              )}
              {facultyAssignments.length > 0 && sortedFacultyAssignments.length === 0 && (
                <p className="sa-muted">No assignments match your search.</p>
              )}
            </div>
          )}

          {activeSub === "code-students" && (
            <div className="dashboard-card">
              <h3 className="card-title">Students applied for code review</h3>
              <p className="card-subtitle">Courses, marks, time slot and answers.</p>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Marks</th>
                    <th>Time slot</th>
                    <th>Answers</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Vidula S (7376231EC317)</td>
                    <td>PS Activity 101</td>
                    <td>72</td>
                    <td>Hall A, 09:00 AM</td>
                    <td><button type="button" className="sa-btn sa-btn-sm">View</button></td>
                    <td><span className="sa-badge sa-badge-warning">Pending</span></td>
                  </tr>
                  <tr>
                    <td>Student 2 (7376231CS323)</td>
                    <td>Advanced PS</td>
                    <td>85</td>
                    <td>Lab 2, 02:00 PM</td>
                    <td><button type="button" className="sa-btn sa-btn-sm">View</button></td>
                    <td><span className="sa-badge sa-badge-success">Verified</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Nav 6: Statistics - Chart.js graphs */}
          {(activeSub === "stats-course" || activeSub === "stats-slot" || activeSub === "stats-weekly" || activeSub === "stats-registered") && (
            <AdminAnalyticsSuite />
          )}

          {/* Nav 7: Bus management */}
          {activeSub === "bus-list" && (
            <div className="dashboard-card">
              <h3 className="card-title">Manage Buses</h3>
              <p className="card-subtitle">Add, edit, or remove buses and assign staff incharges.</p>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                style={{ marginBottom: 16 }}
                onClick={() =>
                  openAdd("buses", {
                    busNumber: "",
                    route: "",
                    incharge_id: "",
                  })
                }
              >
                <Plus size={16} /> Add Bus
              </button>
              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Bus Number</th>
                      <th>Route</th>
                      <th>Incharge</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {busMgmtLoading ? (
                      <tr>
                        <td colSpan={4} style={{ color: "#64748b" }}>
                          Loading buses...
                        </td>
                      </tr>
                    ) : (
                      (busesList || []).map((bus) => (
                        <tr key={bus._id}>
                          <td>{bus.busNumber}</td>
                          <td>{bus.route}</td>
                          <td>{bus.incharge_id?.name || bus.incharge_id?.email || "Unassigned"}</td>
                          <td>
                            <button
                              type="button"
                              className="sa-btn sa-btn-sm"
                              onClick={() =>
                                openEdit("buses", {
                                  ...bus,
                                  id: bus._id,
                                  incharge_id: bus.incharge_id?._id || bus.incharge_id || "",
                                })
                              }
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="sa-btn sa-btn-sm"
                              style={{ marginLeft: 8, color: "#dc2626" }}
                              onClick={() => deleteItem("buses", bus._id)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSub === "bus-assign" && (
            <div className="dashboard-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 className="card-title">Assign Students to Buses</h3>
                  <p className="card-subtitle">Select students to assign them to buses in bulk or individually.</p>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Search Register No / Name..."
                    className="sa-input"
                    style={{ maxWidth: 220 }}
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                  <select
                    className="sa-input"
                    style={{ maxWidth: 200 }}
                    value={studentDeptFilter}
                    onChange={(e) => setStudentDeptFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {[...new Set((dayscholarsList || []).map((s) => s.department))]
                      .filter(Boolean)
                      .map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {selectedStudentIds.length > 0 && (
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px 20px",
                    borderRadius: 12,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    border: "1px solid #e2e8f0",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>
                    {selectedStudentIds.length} students selected
                  </span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Assign to:</span>
                  <select
                    className="sa-input"
                    style={{ width: 220 }}
                    value={bulkAssignBusId}
                    onChange={async (e) => {
                      const busId = e.target.value;
                      setBulkAssignBusId(busId);
                      if (!busId) return;
                      if (!window.confirm(`Assign ${selectedStudentIds.length} students to this bus?`)) return;
                      try {
                        const res = await fetch(`${API_BASE}/api/buses/bulk-assign`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            studentIds: selectedStudentIds,
                            busId: busId === "none" ? null : busId,
                          }),
                        });
                        if (!res.ok) throw new Error("Bulk assign failed");

                        const busObj = busId === "none" ? null : (busesList || []).find((b) => b._id === busId) || null;
                        setDayscholarsList((prev) =>
                          prev.map((s) =>
                            selectedStudentIds.includes(s._id)
                              ? { ...s, bus_id: busObj ? busObj : null }
                              : s
                          )
                        );
                        setSelectedStudentIds([]);
                        setBulkAssignBusId("none");
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                  >
                    {busOptions.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="sa-btn sa-btn-sm" onClick={() => setSelectedStudentIds([])}>
                    Clear Selection
                  </button>
                </div>
              )}

              <div className="sa-table-wrap">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds(filteredDayscholarsForBusAssign.map((s) => s._id));
                            } else {
                              setSelectedStudentIds([]);
                            }
                          }}
                        />
                      </th>
                      <th>Register No</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Assigned Bus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDayscholarsForBusAssign.map((student) => {
                      const isAssigned = !!student.bus_id;
                      return (
                        <tr key={student._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedStudentIds((prev) => [...prev, student._id]);
                                else setSelectedStudentIds((prev) => prev.filter((id) => id !== student._id));
                              }}
                            />
                          </td>
                          <td>
                            <strong>{student.register_no}</strong>
                          </td>
                          <td>{student.name}</td>
                          <td>
                            <span style={{ fontSize: 13, color: "#64748b" }}>{student.department}</span>
                          </td>
                          <td>
                            <span className={`sa-badge ${isAssigned ? "sa-badge-success" : "sa-badge-neutral"}`}>
                              {isAssigned ? "Assigned" : "Not Assigned"}
                            </span>
                          </td>
                          <td>
                            <select
                              className="sa-input"
                              style={{ width: "100%", maxWidth: 200 }}
                              value={student.bus_id?._id || student.bus_id || "none"}
                              onChange={async (e) => {
                                const nextBusId = e.target.value;
                                try {
                                  const res = await fetch(`${API_BASE}/api/buses/assign-student`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      studentId: student._id,
                                      busId: nextBusId === "none" ? null : nextBusId,
                                    }),
                                  });
                                  if (!res.ok) throw new Error("Failed to assign");
                                  const busObj = nextBusId === "none" ? null : (busesList || []).find((b) => b._id === nextBusId) || null;
                                  setDayscholarsList((prev) =>
                                    prev.map((s) =>
                                      s._id === student._id
                                        ? { ...s, bus_id: busObj ? busObj : null }
                                        : s
                                    )
                                  );
                                } catch (err) {
                                  alert(err.message);
                                }
                              }}
                            >
                              {busOptions.map((b) => (
                                <option key={b.value} value={b.value}>
                                  {b.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSub === "classrooms-list" && (
            <div className="dashboard-card classroom-admin-wrap">
              <div className="classroom-admin-header">
                <div>
                  <h3 className="card-title">Classrooms Created by Faculties</h3>
                  <p className="card-subtitle">
                    Select a classroom to view all registered students with clear details.
                  </p>
                </div>
                <span className="classroom-admin-count">{classroomsList.length} Classrooms</span>
              </div>

              <div className="classroom-admin-grid">
                <aside className="classroom-admin-list">
                  {classroomLoading ? (
                    <div className="sa-empty">Loading classrooms...</div>
                  ) : classroomsList.length === 0 ? (
                    <div className="sa-empty">No classrooms found yet.</div>
                  ) : (
                    classroomsList.map((room) => {
                      const isActive = selectedClassroomId === room.id;
                      return (
                        <button
                          key={room.id}
                          type="button"
                          className={`classroom-admin-item ${isActive ? "active" : ""}`}
                          onClick={() => setSelectedClassroomId(room.id)}
                        >
                          <div className="classroom-admin-item-top">
                            <strong>{room.topic}</strong>
                            <span className="sa-badge sa-badge-neutral">{room.studentCount || 0} Students</span>
                          </div>
                          <div className="classroom-admin-item-meta">
                            Faculty: {room.facultyName || "—"}
                          </div>
                          <div className="classroom-admin-item-meta">
                            Date: {room.date ? new Date(room.date).toLocaleDateString() : "—"}
                          </div>
                        </button>
                      );
                    })
                  )}
                </aside>

                <section className="classroom-admin-detail">
                  {!selectedClassroomId ? (
                    <div className="sa-empty">Pick a classroom from the left to view registrations.</div>
                  ) : (
                    <>
                      <div className="classroom-admin-detail-head">
                        <div>
                          <h4>{selectedClassroomMeta?.topic || "Classroom"}</h4>
                          <p>
                            Faculty: {selectedClassroomMeta?.facultyName || "—"} • Date:{" "}
                            {selectedClassroomMeta?.date ? new Date(selectedClassroomMeta.date).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        {selectedClassroomMeta?.googleClassroomLink ? (
                          <a
                            className="sa-btn sa-btn-primary"
                            href={selectedClassroomMeta.googleClassroomLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Classroom Link
                          </a>
                        ) : null}
                      </div>

                      <div className="sa-table-wrap">
                        <table className="sa-table">
                          <thead>
                            <tr>
                              <th>Register No</th>
                              <th>Student Name</th>
                              <th>Department</th>
                              <th>Year</th>
                              <th>Type</th>
                              <th>Registered At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classroomStudentsLoading ? (
                              <tr>
                                <td colSpan={6} style={{ color: "#64748b" }}>
                                  Loading registered students...
                                </td>
                              </tr>
                            ) : classroomStudents.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ color: "#64748b" }}>
                                  No students registered for this classroom yet.
                                </td>
                              </tr>
                            ) : (
                              classroomStudents.map((s) => (
                                <tr key={s.id}>
                                  <td>{s.register_no}</td>
                                  <td>{s.name}</td>
                                  <td>{s.department}</td>
                                  <td>{s.year}</td>
                                  <td style={{ textTransform: "capitalize" }}>{s.type}</td>
                                  <td>{s.registeredAt ? new Date(s.registeredAt).toLocaleString() : "—"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              </div>
            </div>
          )}

          {!NAV.flatMap((s) => s.sub).some((s) => s.id === activeSub) && activeSub !== "assessment-slot-report" && activeSub !== "question-bank-submissions-view" && (
            <div className="dashboard-card">
              <p className="sa-empty">Select a section from the sidebar to view and manage content.</p>
            </div>
          )}
          </>}
          </div>
        </main>
      </div>

      {/* Edit / Add modal */}
      <ProfileDetailsModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={{
          id: localStorage.getItem("register_no") || localStorage.getItem("userId") || "N/A",
          userId: localStorage.getItem("userId") || "N/A",
          registerNo: localStorage.getItem("register_no") || "N/A",
          name: userName || "Admin",
          avatarUrl: "",
        }}
      />

      {editModal.open && (
        <div className="sa-modal-overlay" onClick={closeEdit}>
          <div className={`sa-modal ${editModal.section === "courses" ? "sa-modal-courses" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className={`sa-modal-header ${editModal.section === "roles" ? "sa-modal-header-role" : ""}`}>
              <h3>{editModal.section === "roles" ? (editModal.itemId ? "Edit Role" : "Add Role") : editModal.itemId ? "Edit" : "Add"}</h3>
              <button type="button" className="sa-modal-close" onClick={closeEdit} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="sa-modal-body">
              {editModal.section === "roles" && (
                <>
                  <div className="sa-form-group"><label>Role name</label><input type="text" value={editModal.item.role || ""} onChange={(e) => setEditField("role", e.target.value)} placeholder="e.g. student, mentor" /></div>
                  <div className="sa-form-group"><label>Description</label><input type="text" value={editModal.item.description || ""} onChange={(e) => setEditField("description", e.target.value)} placeholder="Short description of this role" /></div>
                  <div className="sa-form-group">
                    <label>Accesses (what this role can see/do in user dashboard)</label>
                    <div className="sa-access-list">
                      {["Mentor", "Warden", "Technical faculty"].map((group) => {
                        const groupOptions = ACCESS_OPTIONS.filter((o) => o.group === group);
                        const accessList = (editModal.item.accesses || "").split(",").map((s) => s.trim()).filter(Boolean);
                        const selectedCount = groupOptions.filter((opt) => accessList.includes(opt.id)).length;
                        const allSelected = groupOptions.length > 0 && selectedCount === groupOptions.length;
                        const toggleOption = (optId, on) => {
                          const next = on
                            ? [...new Set([...accessList, optId])]
                            : accessList.filter((x) => x !== optId);
                          setEditField("accesses", next.join(", "));
                        };
                        const toggleGroup = (on) => {
                          let next = accessList;
                          if (on) {
                            next = [...new Set([...accessList, ...groupOptions.map((g) => g.id)])];
                          } else {
                            const ids = new Set(groupOptions.map((g) => g.id));
                            next = accessList.filter((x) => !ids.has(x));
                          }
                          setEditField("accesses", next.join(", "));
                        };
                        return (
                          <div key={group} className="sa-access-group-card">
                            <div className="sa-access-group-header">
                              <div className="sa-access-group-title">
                                {group.toUpperCase()} <span>({selectedCount}/{groupOptions.length})</span>
                              </div>
                              <button
                                type="button"
                                className="sa-access-select-all"
                                onClick={() => toggleGroup(!allSelected)}
                              >
                                {allSelected ? "Clear All" : "Select All"}
                              </button>
                            </div>
                            {groupOptions.map((opt) => {
                              const checked = accessList.includes(opt.id);
                              return (
                                <label key={opt.id} className="sa-access-option-card">
                                  <button
                                    type="button"
                                    className={`sa-toggle ${checked ? "sa-toggle-on" : ""}`}
                                    onClick={() => toggleOption(opt.id, !checked)}
                                    aria-pressed={checked}
                                  >
                                    <span className="sa-toggle-knob" />
                                  </button>
                                  <div className="sa-access-option-text">
                                    <div className="sa-access-option-label">{opt.label}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "users" && (
                <>
                  <div className="sa-form-group"><label>Email</label><input type="email" value={editModal.item.email || ""} onChange={(e) => setEditField("email", e.target.value)} placeholder="user@example.com" /></div>
                  <div className="sa-form-group"><label>Name</label><input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="Full name" /></div>
                  <div className="sa-form-group">
                    <label>Roles</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {rolesList.map((r) => {
                        const roleName = r.role;
                        const roles = Array.isArray(editModal.item.roles) ? editModal.item.roles : [];
                        const checked = roles.includes(roleName);
                        return (
                          <label key={r.id || roleName} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="checkbox" checked={checked} onChange={(e) => setEditFieldRoles(e.target.checked ? [...roles, roleName] : roles.filter((x) => x !== roleName))} />
                            <span className="sa-tag" style={getRoleTagStyle(roleName)}>{roleName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "courses" && (
                <>
                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Basic info</h4>
                    <div className="sa-form-group">
                      <label>Course name</label>
                      {editModal.itemId ? (
                        <input type="text" value={editModal.item.name || ""} readOnly disabled className="sa-input-readonly" style={{ opacity: 1, cursor: "default", background: "#f1f5f9" }} />
                      ) : (
                        <input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)}  />
                      )}
                    </div>
                    {/* <div className="sa-form-group">
                      <label>Course type</label>
                      <input type="text" value={editModal.item.type || ""} onChange={(e) => setEditField("type", e.target.value)} />
                    </div> */}
                    <div className="sa-form-group">
                      <label>Level (category)</label>
                      <input type="text" value={editModal.item.level || ""} onChange={(e) => setEditField("level", e.target.value)} />
                    </div>
                    {/* <div className="sa-form-group">
                      <label>Activity points</label>
                      <input type="number" value={editModal.item.activityPoints ?? 0} onChange={(e) => setEditField("activityPoints", e.target.value)} placeholder="10" min="0" />
                    </div> */}
                    {/* <div className="sa-form-group">
                      <label>Faculty (handles questions)</label>
                      <select value={editModal.item.faculty || ""} onChange={(e) => setEditField("faculty", e.target.value)}>
                        <option value="">Select faculty</option>
                        {facultyList.map((u) => (
                          <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div> */}
                  </div>

                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Course levels</h4>
                    <p className="sa-muted" style={{ fontSize: 13, marginBottom: 12 }}>Add levels students can register for. Each level can have one or more prerequisite levels.</p>
                    {(editModal.item.levels || []).map((lev, idx) => {
                      const levelList = editModal.item.levels || [];
                      const prereqIndices = Array.isArray(lev.prerequisiteLevelIndices) ? lev.prerequisiteLevelIndices : (lev.prerequisiteLevelIndex != null && lev.prerequisiteLevelIndex >= 0 ? [lev.prerequisiteLevelIndex] : []);
                      const togglePrereq = (i) => {
                        const l = [...levelList];
                        const next = prereqIndices.includes(i) ? prereqIndices.filter((x) => x !== i) : [...prereqIndices, i].sort((a, b) => a - b);
                        l[idx] = { ...l[idx], prerequisiteLevelIndices: next, prerequisiteLevelIndex: next[0] ?? -1 };
                        setEditField("levels", l);
                      };
                      return (
                        <div key={idx} className="sa-level-card">
                          <div className="sa-level-card-header">
                            <span className="sa-level-card-title">Level {idx + 1}: {lev.name || `Level ${idx}`}</span>
                            <button type="button" className="sa-btn sa-btn-sm" style={{ background: "#dc2626", color: "#fff" }} onClick={() => setEditField("levels", levelList.filter((_, i) => i !== idx))}>Remove</button>
                          </div>
                          <div className="sa-form-group">
                            <label>Level name</label>
                            <input type="text" placeholder="e.g. Level 0, Level 1A" value={lev.name || ""} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], name: e.target.value }; setEditField("levels", l); }} />
                          </div>
                          <div className="sa-form-group">
                            <label>Reward points</label>
                            <input type="number" placeholder="0" value={lev.rewardPoints ?? 0} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], rewardPoints: Number(e.target.value) || 0 }; setEditField("levels", l); }} min="0" />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div className="sa-form-group">
                              <label>Questions per Assessment</label>
                              <input type="number" placeholder="5" value={lev.questionsPerAssessment ?? 5} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], questionsPerAssessment: Number(e.target.value) || 5 }; setEditField("levels", l); }} min="1" />
                            </div>
                            <div className="sa-form-group">
                              <label>Pass Percentage (%)</label>
                              <input type="number" placeholder="50" value={lev.passPercentage ?? 50} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], passPercentage: Number(e.target.value) || 50 }; setEditField("levels", l); }} min="1" max="100" />
                            </div>
                          </div>
                          <div className="sa-form-group">
                            <label>Prerequisite levels (select all that must be completed)</label>
                            <div className="sa-prereq-levels">
                              {Array.from({ length: idx }, (_, i) => (
                                <label key={i}>
                                  <input type="checkbox" checked={prereqIndices.includes(i)} onChange={() => togglePrereq(i)} />
                                  Level {i + 1} ({(levelList[i]?.name || `Level ${i}`).slice(0, 20)})
                                </label>
                              ))}
                              {idx === 0 && <span className="sa-muted" style={{ fontSize: 13 }}>None (first level)</span>}
                            </div>
                          </div>
                          <div className="sa-form-group">
                            <label>Assessment type</label>
                            <select 
                              value={lev.assessmentType || ""} 
                              onChange={(e) => { 
                                const l = [...levelList]; 
                                l[idx] = { ...l[idx], assessmentType: e.target.value }; 
                                setEditField("levels", l); 
                              }}
                            >
                              <option value="">Select type...</option>
                              {questionTemplatesList.map((t) => (
                                <option key={t._id} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sa-form-group">
                            <label>Duration (minutes)</label>
                            <input type="number" placeholder="60" value={lev.durationMinutes ?? 60} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], durationMinutes: Number(e.target.value) || 60 }; setEditField("levels", l); }} min="1" />
                          </div>
                          <div className="sa-form-group">
                            <label>Topics (one per line)</label>
                            <textarea rows={2} placeholder="Topic 1&#10;Topic 2" value={(lev.topics || []).join("\n")} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], topics: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean) }; setEditField("levels", l); }} />
                          </div>
                          <div className="sa-form-group">
                            <label>Study materials</label>
                            <p className="sa-muted" style={{ fontSize: 12, marginBottom: 8 }}>Add links or upload files for this level.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {(lev.studyMaterials || []).map((mat, mIdx) => (
                                <div key={`${idx}-${mIdx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                    <strong style={{ fontSize: 13 }}>Material {mIdx + 1}</strong>
                                    <button
                                      type="button"
                                      className="sa-btn sa-btn-sm"
                                      style={{ background: "#dc2626", color: "#fff" }}
                                      onClick={() => {
                                        const l = [...levelList];
                                        const mats = [...(l[idx].studyMaterials || [])];
                                        mats.splice(mIdx, 1);
                                        l[idx] = { ...l[idx], studyMaterials: mats };
                                        setEditField("levels", l);
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <div className="sa-form-group" style={{ marginTop: 8 }}>
                                    <label>Name</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Intro PDF / YouTube session"
                                      value={mat.name || ""}
                                      onChange={(e) => {
                                        const l = [...levelList];
                                        const mats = [...(l[idx].studyMaterials || [])];
                                        mats[mIdx] = { ...mats[mIdx], name: e.target.value };
                                        l[idx] = { ...l[idx], studyMaterials: mats };
                                        setEditField("levels", l);
                                      }}
                                    />
                                  </div>
                                  <div className="sa-form-group">
                                    <label>Type</label>
                                    <select
                                      value={mat.type || "link"}
                                      onChange={(e) => {
                                        const l = [...levelList];
                                        const mats = [...(l[idx].studyMaterials || [])];
                                        mats[mIdx] = { ...mats[mIdx], type: e.target.value };
                                        l[idx] = { ...l[idx], studyMaterials: mats };
                                        setEditField("levels", l);
                                      }}
                                    >
                                      <option value="link">Link</option>
                                      <option value="file">File</option>
                                    </select>
                                  </div>
                                  {(mat.type || "link") === "link" ? (
                                    <div className="sa-form-group">
                                      <label>URL</label>
                                      <input
                                        type="url"
                                        placeholder="https://..."
                                        value={mat.url || ""}
                                        onChange={(e) => {
                                          const l = [...levelList];
                                          const mats = [...(l[idx].studyMaterials || [])];
                                          mats[mIdx] = { ...mats[mIdx], url: e.target.value };
                                          l[idx] = { ...l[idx], studyMaterials: mats };
                                          setEditField("levels", l);
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="sa-form-group">
                                      <label>File URL</label>
                                      <input
                                        type="text"
                                        readOnly
                                        value={mat.content || mat.url || ""}
                                        placeholder="Upload file to generate URL"
                                      />
                                      <div style={{ marginTop: 8 }}>
                                        <input
                                          type="file"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              const out = await uploadAdminFile(file);
                                              const l = [...levelList];
                                              const mats = [...(l[idx].studyMaterials || [])];
                                              mats[mIdx] = { ...mats[mIdx], type: "file", content: out.url, url: out.url, name: mats[mIdx].name || out.file_name };
                                              l[idx] = { ...l[idx], studyMaterials: mats };
                                              setEditField("levels", l);
                                            } catch (err) {
                                              alert(err.message || "File upload failed");
                                            } finally {
                                              e.target.value = "";
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button
                                type="button"
                                className="sa-btn sa-btn-sm"
                                onClick={() => {
                                  const l = [...levelList];
                                  l[idx] = { ...l[idx], studyMaterials: [...(l[idx].studyMaterials || []), { name: "", type: "link", url: "", content: "" }] };
                                  setEditField("levels", l);
                                }}
                              >
                                + Add link
                              </button>
                              <button
                                type="button"
                                className="sa-btn sa-btn-sm"
                                onClick={() => {
                                  const l = [...levelList];
                                  l[idx] = { ...l[idx], studyMaterials: [...(l[idx].studyMaterials || []), { name: "", type: "file", url: "", content: "" }] };
                                  setEditField("levels", l);
                                }}
                              >
                                + Add file
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" className="sa-btn sa-btn-primary" onClick={() => setEditField("levels", [...(editModal.item.levels || []), { name: "", rewardPoints: 0, prerequisiteLevelIndex: -1, prerequisiteLevelIndices: [], assessmentType: "MCQ", topics: [], studyMaterials: [], durationMinutes: 60 }])}>+ Add level</button>
                  </div>

                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Prerequisite courses</h4>
                    <p className="sa-muted" style={{ fontSize: 13, marginBottom: 10 }}>Type to search; select one or more courses that students should complete before this course.</p>
                    <div className="sa-autocomplete-wrap">
                      <input
                        type="text"
                        className="sa-autocomplete-input"
                        placeholder="Type course name to search…"
                        value={editModal.item.prereqQuery || ""}
                        onChange={(e) => setEditField("prereqQuery", e.target.value)}
                        onFocus={() => setEditField("prereqSuggestOpen", true)}
                        onBlur={() => setTimeout(() => setEditField("prereqSuggestOpen", false), 180)}
                      />
                      {editModal.item.prereqSuggestOpen && (editModal.item.prereqQuery || "").trim() && (
                        <ul className="sa-autocomplete-list">
                          {coursesList
                            .filter((c) => c.id !== editModal.item.id && !(editModal.item.prerequisites || []).includes(c.id))
                            .filter((c) => (c.name || "").toLowerCase().includes((editModal.item.prereqQuery || "").toLowerCase()))
                            .slice(0, 8)
                            .map((c) => (
                              <li key={c.id}>
                                <button type="button" className="sa-autocomplete-item" onClick={() => { setEditField("prerequisites", [...(editModal.item.prerequisites || []), c.id]); setEditField("prereqQuery", ""); setEditField("prereqSuggestOpen", false); }}>{c.name}</button>
                              </li>
                            ))}
                          {coursesList.filter((c) => c.id !== editModal.item.id && (c.name || "").toLowerCase().includes((editModal.item.prereqQuery || "").toLowerCase())).length === 0 && (
                            <li style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>No matching courses</li>
                          )}
                        </ul>
                      )}
                    </div>
                    <div className="sa-prereq-tags">
                      {(editModal.item.prerequisites || []).map((pid) => {
                        const c = coursesList.find((x) => x.id === pid);
                        if (!c) return null;
                        return (
                          <span key={pid} className="sa-prereq-tag">
                            {c.name}
                            <button type="button" className="sa-prereq-tag-remove" onClick={() => setEditField("prerequisites", (editModal.item.prerequisites || []).filter((x) => x !== pid))} aria-label="Remove">×</button>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sa-course-section">
                    <h4 className="sa-course-section-title">Logo & status</h4>
                    <div className="sa-form-group">
                      <label>Course logo</label>
                      <input type="url" value={editModal.item.course_logo?.startsWith("data:") ? "" : (editModal.item.course_logo || "")} onChange={(e) => setEditField("course_logo", e.target.value)} placeholder="https://… or choose file below" />
                      <div className="sa-form-group" style={{ marginTop: 8 }}>
                        <label className="sa-muted" style={{ fontSize: 12 }}>Or choose from your computer</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setEditField("course_logo", reader.result || "");
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }} />
                      </div>
                      {editModal.item.course_logo && (
                        <div className="sa-course-logo-preview" style={{ marginTop: 8 }}>
                          <img src={editModal.item.course_logo} alt="Course logo" onError={(e) => { e.target.style.display = "none"; }} />
                        </div>
                      )}
                    </div>
                    <div className="sa-form-group">
                      <label>Status</label>
                      <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="sa-form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "no" }}>
                        <input 
                          type="checkbox" 
                          checked={editModal.item.cooldownEnabled !== false} 
                          onChange={(e) => setEditField("cooldownEnabled", e.target.checked)} 
                          style={{ width: "18px", height: "18px" }}
                        />
                        <span style={{ fontSize: "14px", color: "#334155" }}>Enable 48-hour cooldown after failed attempt</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "ps-courses" && (
                <>
                  <div className="sa-form-group">
                    <label>Name</label>
                    <input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="e.g. Analog Electronics Level - 1A" />
                  </div>
                  <div className="sa-form-group">
                    <label>Description</label>
                    <textarea rows={2} value={editModal.item.description || ""} onChange={(e) => setEditField("description", e.target.value)} placeholder="Short description" />
                  </div>
                  <div className="sa-form-group">
                    <label>Status</label>
                    <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label><input type="checkbox" checked={!!editModal.item.level} onChange={(e) => setEditField("level", e.target.checked)} /> Is level (sub-course)</label>
                  </div>
                  <div className="sa-form-group">
                    <label>Parent course</label>
                    <input type="text" value={editModal.item.parentCourse || ""} onChange={(e) => setEditField("parentCourse", e.target.value)} placeholder="e.g. Analog Electronics" />
                  </div>
                  <div className="sa-form-group">
                    <label>Prereq (course names, comma-separated)</label>
                    <input type="text" value={Array.isArray(editModal.item.prereq) ? editModal.item.prereq.join(", ") : ""} onChange={(e) => setEditField("prereq", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="Course A, Course B" />
                  </div>
                </>
              )}
              {editModal.section === "venues" && (
                <>
                  <div className="sa-form-group"><label>Venue name</label><input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="e.g. Hall A" /></div>
                  <div className="sa-form-group"><label>Location</label><input type="text" value={editModal.item.location || ""} onChange={(e) => setEditField("location", e.target.value)} placeholder="e.g. Block 1" /></div>
                </>
              )}
              {editModal.section === "time" && (
                <>
                  <div className="sa-form-group">
                    <label>Start time</label>
                    <TimePicker12h
                      value={editModal.item.startTime || "09:00"}
                      onChange={(v) => setEditField("startTime", v)}
                      id="time-slot-start"
                    />
                  </div>
                  <div className="sa-form-group">
                    <label>End time</label>
                    <TimePicker12h
                      value={editModal.item.endTime || "10:30"}
                      onChange={(v) => setEditField("endTime", v)}
                      id="time-slot-end"
                    />
                  </div>
                </>
              )}
              {editModal.section === "slots" && (
                <>
                  <div className="sa-form-group">
                    <label>Venue</label>
                    <select value={editModal.item.venueId || ""} onChange={(e) => setEditField("venueId", e.target.value)}>
                      <option value="">Select venue</option>
                      {venuesList.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label>Time slot</label>
                    <select value={editModal.item.timeId || ""} onChange={(e) => setEditField("timeId", e.target.value)}>
                      <option value="">Select time</option>
                      {timeSlotsList.map((t) => <option key={t.id} value={t.id}>{formatTime(t.startTime)} – {formatTime(t.endTime)}</option>)}
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label>Status</label>
                    <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}
              {editModal.section === "leave-types" && (
                <>
                  <div className="sa-form-group"><label>Type</label><input type="text" value={editModal.item.type || ""} onChange={(e) => setEditField("type", e.target.value)} placeholder="e.g. Sick Leave" /></div>
                  <div className="sa-form-group"><label>Code</label><input type="text" value={editModal.item.code || ""} onChange={(e) => setEditField("code", e.target.value)} placeholder="e.g. SL" /></div>
                  <div className="sa-form-group">
                    <label>Status</label>
                    <select value={editModal.item.status || "Active"} onChange={(e) => setEditField("status", e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label>Leave flow</label>
                    <p className="sa-form-hint">Click roles below to add; click × on a tag to remove.</p>
                    <div className="sa-workflow-tags">
                      {((editModal.item.workflow || "").split(",").map((s) => s.trim()).filter(Boolean)).map((step) => (
                        <span key={step} className="sa-tag sa-tag-removable" style={getRoleTagStyle(step)}>
                          {step}
                          <button
                            type="button"
                            className="sa-tag-remove"
                            onClick={() => {
                              const steps = (editModal.item.workflow || "").split(",").map((s) => s.trim()).filter(Boolean);
                              setEditField("workflow", steps.filter((s) => s !== step).join(", "));
                            }}
                            aria-label={`Remove ${step}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="sa-workflow-add">
                      <span className="sa-workflow-add-label">Add step:</span>
                      {(() => {
                        const steps = (editModal.item.workflow || "").split(",").map((s) => s.trim()).filter(Boolean);
                        const parentsAdded = steps.includes("Parents");
                        return (
                          <>
                            <button
                              type="button"
                              className={`sa-tag sa-tag-clickable ${parentsAdded ? "sa-tag-added" : ""}`}
                              style={getRoleTagStyle("parents")}
                              onClick={() => {
                                if (parentsAdded) return;
                                const current = (editModal.item.workflow || "").trim();
                                setEditField("workflow", current ? `Parents, ${current}` : "Parents");
                              }}
                              disabled={parentsAdded}
                            >
                              Parents
                            </button>
                            {rolesList
                              .filter((r) => (r.role || "").toLowerCase() !== "student")
                              .map((r) => {
                                const role = r.role;
                                const added = steps.includes(role);
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    className={`sa-tag sa-tag-clickable ${added ? "sa-tag-added" : ""}`}
                                    style={getRoleTagStyle(role)}
                                    onClick={() => {
                                      if (added) return;
                                      const current = (editModal.item.workflow || "").trim();
                                      setEditField("workflow", current ? `${current}, ${role}` : role);
                                    }}
                                    disabled={added}
                                  >
                                    {role}
                                  </button>
                                );
                              })}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
              {editModal.section === "leave-workflow" && (
                <>
                  <div className="sa-form-group"><label>Leave type</label><input type="text" value={editModal.item.leaveType || ""} onChange={(e) => setEditField("leaveType", e.target.value)} placeholder="e.g. Sick Leave" /></div>
                  <div className="sa-form-group"><label>Workflow</label><input type="text" value={editModal.item.workflow || ""} onChange={(e) => setEditField("workflow", e.target.value)} placeholder="e.g. Mentor → Warden" /></div>
                </>
              )}
              {editModal.section === "buses" && (
                <>
                  <div className="sa-form-group">
                    <label>Bus Number</label>
                    <input
                      type="text"
                      value={editModal.item.busNumber || ""}
                      onChange={(e) => setEditField("busNumber", e.target.value)}
                      placeholder="e.g. B101"
                    />
                  </div>
                  <div className="sa-form-group">
                    <label>Route</label>
                    <input
                      type="text"
                      value={editModal.item.route || ""}
                      onChange={(e) => setEditField("route", e.target.value)}
                      placeholder="e.g. Coimbatore - BITS"
                    />
                  </div>
                  <div className="sa-form-group">
                    <label>Incharge Staff</label>
                    <select
                      value={editModal.item.incharge_id?._id || editModal.item.incharge_id || ""}
                      onChange={(e) => setEditField("incharge_id", e.target.value)}
                    >
                      <option value="">Select Incharge staff</option>
                      {usersList
                        .filter((u) => !(u.roles || []).some((r) => String(r).toLowerCase() === "student"))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="sa-form-group">
                    <label>Bus Number</label>
                    <input
                      type="text"
                      value={editModal.item.busNumber || ""}
                      onChange={(e) => setEditField("busNumber", e.target.value)}
                      placeholder="e.g. B101"
                    />
                  </div>
                  <div className="sa-form-group">
                    <label>Route</label>
                    <input
                      type="text"
                      value={editModal.item.route || ""}
                      onChange={(e) => setEditField("route", e.target.value)}
                      placeholder="e.g. Coimbatore - BITS"
                    />
                  </div>
                  <div className="sa-form-group">
                    <label>Incharge Staff</label>
                    <select
                      value={editModal.item.incharge_id?._id || editModal.item.incharge_id || ""}
                      onChange={(e) => setEditField("incharge_id", e.target.value)}
                    >
                      <option value="">Select Incharge staff</option>
                      {usersList
                        .filter((u) => !(u.roles || []).some((r) => String(r).toLowerCase() === "student"))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="sa-modal-footer">
              <button type="button" className="sa-btn" onClick={closeEdit}>Cancel</button>
              <button type="button" className="sa-btn sa-btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
      {chatOpen && (
        <ChatModal
          onClose={() => setChatOpen(false)}
          withUserId={chatWithUserId}
          withUserName={chatWithUserName}
        />
      )}
    </div>
  );
}

// --- SLOT REPORT VIEW COMPONENT (FULL-PAGE) ---
function SlotReportView({ slotId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchReport = async (opts = { silent: false }) => {
      if (!opts.silent) setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/superadmin/assessment-slots/${slotId}/report`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to fetch report");
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && !opts.silent) setError(err.message);
      } finally {
        if (!cancelled && !opts.silent) setLoading(false);
      }
    };
    fetchReport({ silent: false });
    const poll = setInterval(() => fetchReport({ silent: true }), 12000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [slotId]);

  if (loading) return (
    <div className="dashboard-card" style={{ textAlign: "center", padding: "100px 40px" }}>
      <div className="sa-spinner" style={{ margin: "0 auto 20px" }}></div>
      <p style={{ color: "#64748b", fontWeight: "600" }}>Generating slot assessment report...</p>
    </div>
  );

  if (error) return (
    <div className="dashboard-card" style={{ padding: "40px", textAlign: "center" }}>
      <h3 style={{ color: "#ef4444", marginBottom: "12px" }}>Error</h3>
      <p style={{ color: "#64748b", marginBottom: "24px" }}>{error}</p>
      <button className="sa-btn sa-btn-primary" onClick={onBack}>Go Back</button>
    </div>
  );

  const { summary, students } = data;
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.registerNo.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const studentsWithAttempts = filteredStudents.filter((s) => s.hasLiveAttempt);
  const submittedStudents = filteredStudents.filter((s) => s.submissionFinalized);
  const inProgressStudents = filteredStudents.filter((s) => s.hasLiveAttempt && !s.submissionFinalized);
  const absentStudents = filteredStudents.filter((s) => !s.hasLiveAttempt);
  const highRiskStudents = filteredStudents
    .filter((s) => Number(s.tabSwitches || 0) >= 3)
    .sort((a, b) => Number(b.tabSwitches || 0) - Number(a.tabSwitches || 0));
  const avgScore = studentsWithAttempts.length
    ? (studentsWithAttempts.reduce((sum, s) => sum + Number(s.score || 0), 0) / studentsWithAttempts.length).toFixed(1)
    : "0.0";
  const attendanceRate = summary.totalBooked
    ? ((summary.attended / summary.totalBooked) * 100).toFixed(1)
    : "0.0";
  const submissionRate = summary.totalBooked
    ? ((submittedStudents.length / summary.totalBooked) * 100).toFixed(1)
    : "0.0";
  const passRate = submittedStudents.length
    ? ((summary.passed / submittedStudents.length) * 100).toFixed(1)
    : "0.0";

  const exportSlotReport = () => {
    const safe = (v) => (v === undefined || v === null ? "" : v);
    const wb = XLSX.utils.book_new();

    const summaryRow = {
      slotId: safe(summary.slotId || slotId),
      date: summary.date ? new Date(summary.date).toISOString().slice(0, 10) : "",
      venue: safe(summary.venueName),
      time: safe(summary.timeLabel),
      capacity: Number(summary.capacity || 0),
      totalBooked: Number(summary.totalBooked || 0),
      attended: Number(summary.attended || 0),
      passed: Number(summary.passed || 0),
      failed: Number(summary.failed || 0),
      exportedAt: new Date().toISOString(),
      searchFilter: safe(searchTerm),
      exportedStudentsCount: filteredStudents.length,
    };
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([summaryRow]), "Summary");

    const studentRows = (filteredStudents || []).map((s) => ({
      registrationId: safe(s.registrationId),
      userId: safe(s.userId),
      name: safe(s.name),
      registerNo: safe(s.registerNo),
      levelAttended: safe(s.levelAttended),
      attendanceStatus: s.hasLiveAttempt ? "PRESENT" : "ABSENT",
      submissionFinalized: !!s.submissionFinalized,
      hasLiveAttempt: !!s.hasLiveAttempt,
      tabSwitches: Number(s.tabSwitches || 0),
      score: s.hasLiveAttempt ? Number(s.score || 0) : "",
      result: s.submissionFinalized ? (s.isPassed ? "PASSED" : "FAILED") : (s.hasLiveAttempt ? "IN_PROGRESS" : "ABSENT"),
      answersCount: Array.isArray(s.answers) ? s.answers.length : 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), "Students");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        highRiskStudents.map((s) => ({
          name: safe(s.name),
          registerNo: safe(s.registerNo),
          tabSwitches: Number(s.tabSwitches || 0),
          status: s.submissionFinalized ? "Submitted" : s.hasLiveAttempt ? "In Progress" : "Absent",
          score: s.hasLiveAttempt ? Number(s.score || 0) : "",
        }))
      ),
      "HighRisk",
    );

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `assessment-slot-report-${safe(summary.date ? new Date(summary.date).toISOString().slice(0, 10) : stamp)}-${String(slotId).slice(0, 6)}.xlsx`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Dynamic Header Section */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "40px", color: "#fff", position: "relative" }}>
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
            style={{ marginBottom: '24px' }}
          >
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            <span className="text-sm font-bold">Back to Slots</span>
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ padding: "16px", borderRadius: "20px", backgroundColor: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <CalendarCheck size={32} style={{ color: "#818cf8" }} />
            </div>
            <div className="flex-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-500/30">Official Assessment</span>
                <span className="text-white/40">•</span>
                <span className="text-white/60 text-xs font-bold">{new Date(summary.date).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <h2 style={{ fontSize: "32px", fontWeight: "900", color: "#fff", marginBottom: "4px", letterSpacing: "-0.04em" }}>Assessment Report</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> <span className="text-sm font-bold uppercase tracking-wider">{summary.venueName}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> <span className="text-sm font-bold uppercase tracking-wider">{summary.timeLabel}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregate Metrics Grid */}
        <div style={{ padding: "32px", backgroundColor: "#fff", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em" }}>Booking Capacity</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
              <div style={{ fontSize: "36px", fontWeight: "900", color: "#1e293b", letterSpacing: '-0.02em' }}>{summary.totalBooked}</div>
              <div style={{ fontSize: "16px", color: "#94a3b8", fontWeight: "600" }}>/ {summary.capacity}</div>
            </div>
          </div>
          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
            <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em" }}>Attended Count</span>
            <div style={{ fontSize: "36px", fontWeight: "900", color: "#1d4ed8", marginTop: "12px", letterSpacing: '-0.02em' }}>{summary.attended}</div>
          </div>
          <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
            <span style={{ fontSize: "11px", color: "#059669", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em" }}>Students Cleared</span>
            <div style={{ fontSize: "36px", fontWeight: "900", color: "#047857", marginTop: "12px", letterSpacing: '-0.02em' }}>{summary.passed}</div>
          </div>
          <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100/50 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300">
            <span style={{ fontSize: "11px", color: "#e11d48", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em" }}>Students Failed</span>
            <div style={{ fontSize: "36px", fontWeight: "900", color: "#be123c", marginTop: "12px", letterSpacing: '-0.02em' }}>{summary.failed}</div>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="dashboard-card" style={{ marginTop: '24px', padding: "32px" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.02em' }}>Registered Candidates</h3>
            <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Individual performance metrics for current slot session.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={exportSlotReport}
              className="group flex items-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 font-black text-[12px] tracking-wide"
              title="Export this report to Excel"
            >
              Export
            </button>
            <div style={{ position: "relative", width: '400px' }}>
              <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Filter by name or register no..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "14px 14px 14px 48px", borderRadius: "16px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: "600", backgroundColor: "#f8fafc", outline: "none", transition: 'all 0.2s ease' }}
              />
            </div>
          </div>
        </div>

        <div className="sa-table-wrap" style={{ borderRadius: "20px", border: "1px solid #f1f5f9", overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <table className="sa-table">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: "24px", color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Student Information</th>
                <th style={{ color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Level Attended</th>
                <th style={{ color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Presence</th>
                <th style={{ color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Exam Status</th>
                <th style={{ color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Focus / Switches</th>
                <th style={{ color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score Achieved</th>
                <th style={{ color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Result</th>
                <th style={{ textAlign: 'right', paddingRight: '24px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.registrationId} className="hover:bg-slate-50/50 transition-colors">
                  <td style={{ padding: "20px 24px" }}>
                    <div style={{ fontWeight: "800", color: "#1e293b", fontSize: '15px' }}>{s.name}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: '700', letterSpacing: '0.05em' }}>{s.registerNo}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#334155" }}>
                      {s.levelAttended || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      s.hasLiveAttempt
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      {s.hasLiveAttempt ? "Present" : "Absent"}
                    </span>
                  </td>
                  <td>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      s.submissionFinalized
                        ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                        : s.hasLiveAttempt
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-slate-50 text-slate-400 border-slate-100"
                    }`}>
                      {s.submissionFinalized ? "Submitted" : s.hasLiveAttempt ? "In progress" : "Absent"}
                    </span>
                  </td>
                  <td>
                    {s.submissionFinalized || s.hasLiveAttempt ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-black ${s.tabSwitches > 5 ? "text-rose-600" : s.tabSwitches > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                          {s.tabSwitches || 0} switches
                        </span>
                        {s.tabSwitches > 0 && (
                          <div className={`w-1.5 h-1.5 rounded-full ${s.tabSwitches > 5 ? "bg-rose-500 animate-pulse" : "bg-amber-500"}`}></div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: "900", color: s.hasLiveAttempt ? "#1e293b" : "#cbd5e1" }}>{s.hasLiveAttempt ? s.score : "—"}</span>
                      {s.hasLiveAttempt && <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>PTS</span>}
                    </div>
                  </td>
                  <td>
                    {s.submissionFinalized ? (
                      s.isPassed ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
                          <UserCheck size={14} /> <span>PASSED</span>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#fff1f2', color: '#e11d48', borderRadius: '10px', fontSize: '12px', fontWeight: '800' }}>
                          <X size={14} /> <span>FAILED</span>
                        </div>
                      )
                    ) : (
                      <span style={{ color: "#94a3b8", fontWeight: '700' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <button 
                      className="group inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all border border-indigo-100 font-bold text-xs"
                      disabled={!s.hasLiveAttempt || !(s.answers && s.answers.length)}
                      onClick={() => {
                        setSelectedAnswers(s.answers || []);
                        setSelectedStudent(s);
                      }}
                    >
                      <span>Review Answers</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "80px", color: "#94a3b8" }}>
                    <div className="flex flex-col items-center gap-2">
                      <Search size={40} className="opacity-10 mb-2" />
                      <p className="font-bold">No candidates found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAnswers && selectedStudent && (
        <ReviewAnswersModal 
          student={selectedStudent} 
          answers={selectedAnswers} 
          onClose={() => {
            setSelectedAnswers(null);
            setSelectedStudent(null);
          }} 
        />
      )}
    </div>
  );
}

function ReviewAnswersModal({ student, answers, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const currentAnswer = (answers || [])[activeIdx];

  const renderValue = (val) => {
    if (!val) return <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>No response provided.</div>;

    // Helper to check for testCases in nested objects
    const findTestCases = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (Array.isArray(obj.testCases)) return obj.testCases;
      if (Array.isArray(obj.testResults)) return obj.testResults; // Support alternate naming
      for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'object') {
          const found = findTestCases(val);
          if (found) return found;
        }
      }
      return null;
    };

    const findCode = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.omni_code) return obj.omni_code;
      if (obj.code) return obj.code;
      
      // If we find a key that looks like a component ID with a string value (the code)
      for (const key in obj) {
        const val = obj[key];
        if (key.startsWith('component-') && typeof val === 'string' && val.length > 10) return val;
        if (typeof val === 'object') {
          const found = findCode(val);
          if (found) return found;
        }
      }
      return null;
    };

    const studentResponse = findCode(val);
    const testCases = findTestCases(val);

    const findMCQSelection = (obj, targetKey) => {
      if (!obj || typeof obj !== 'object') return null;

      // Helper: given a block that may be a string, {text,...}, or {options:[...]} wrapper,
      // drill down to the actual selected option object or string.
      const resolveSelectedOption = (block) => {
        if (!block) return null;
        // It's a plain string — the direct selected text
        if (typeof block === 'string') return block;
        // It's {text, correct, ...} — an option object
        if (block.text !== undefined || block.value !== undefined) return block;
        // It's {options: [{text, correct}, ...]} — a full MCQ value block
        if (Array.isArray(block.options)) {
          const selected = block.options.find(o => o && o.correct === true);
          return selected || null;
        }
        return null;
      };

      // 1. Direct match with the mcqKey from the Question Bank metadata
      if (targetKey && obj[targetKey] !== undefined) {
        const resolved = resolveSelectedOption(obj[targetKey]);
        if (resolved) return resolved;
      }

      // 2. Search for any key containing 'mcq' or 'multiple_choice'
      for (const k in obj) {
        if (
          k.toLowerCase().includes('mcq') ||
          k.toLowerCase().includes('multiple_choice') ||
          (targetKey && k.includes(targetKey))
        ) {
          const resolved = resolveSelectedOption(obj[k]);
          if (resolved) return resolved;
        }
      }

      // 3. Fallback: top-level 'options' array (legacy submissions)
      if (obj.options && Array.isArray(obj.options)) {
        const selected = obj.options.find(o => o && o.correct === true);
        if (selected) return selected;
      }

      // 4. Fallback: any component-id key
      for (const k in obj) {
        if (k.startsWith('component-') && obj[k]) {
          const resolved = resolveSelectedOption(obj[k]);
          if (resolved) return resolved;
        }
      }

      return null;
    };

    // Question Type Detection logic
    const options = currentAnswer.options || [];
    const correctIdx = currentAnswer.correctIdx ?? -1;
    const mcqKey = currentAnswer.mcqKey;
    const studentSelection = findMCQSelection(val, mcqKey);
    const isMcq = options.length > 0;
    
    // Non-MCQ answers (from enhanced backend)
    const correctAnswerVal = currentAnswer.correctAnswer;
    const correctPairs = currentAnswer.pairs;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* SUMMARY VERDICT SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px', backgroundColor: '#fcfdfe', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
            Submission Comparison
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>Student Answer</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                {isMcq ? (
                  studentSelection ? (typeof studentSelection === 'object' ? studentSelection.text : studentSelection) : "No selection"
                ) : (
                  studentResponse || (typeof val === 'string' ? val : (val.value || "No response"))
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#f0fdf4', border: '1px solid #d1fae5' }}>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>Actual Answer</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                {isMcq ? (
                  correctIdx >= 0 && options[correctIdx] ? (typeof options[correctIdx] === 'object' ? options[correctIdx].text : options[correctIdx]) : "Not specified"
                ) : (
                  correctAnswerVal || "Not specified"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 1. MCQ RENDERING */}
        {isMcq && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
               <CheckCircle size={14} className="text-indigo-500" />
               Selectable Options ({options.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((opt, idx) => {
                const optText = (
                  opt && typeof opt === "object" ? (opt.text ?? opt.value ?? "") : (opt ?? "")
                )
                  .toString()
                  .trim();
                const studentText = (
                  studentSelection && typeof studentSelection === "object"
                    ? (studentSelection.text ?? studentSelection.value ?? "")
                    : (studentSelection ?? "")
                )
                  .toString()
                  .trim();
                const isSelected = !!(studentText && optText && (studentText === optText));
                const isCorrect = (idx === correctIdx);
                
                return (
                  <div 
                    key={idx}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: isSelected 
                        ? '2px solid #2563eb' 
                        : (isCorrect ? '2px solid #10b981' : '1px solid #e2e8f0'),
                      backgroundColor: isSelected 
                        ? '#eff6ff' 
                        : (isCorrect ? '#f0fdf4' : '#fff'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isSelected && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#2563eb' }}></div>}
                    {isCorrect && !isSelected && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#10b981' }}></div>}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', border: '2px solid',
                        borderColor: isSelected ? '#2563eb' : (isCorrect ? '#10b981' : '#cbd5e1'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? '#2563eb' : (isCorrect ? '#f0fdf4' : 'transparent'),
                        color: isSelected ? '#fff' : (isCorrect ? '#059669' : '#94a3b8'), 
                        fontSize: '11px', fontWeight: '900'
                      }}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span style={{ 
                        fontSize: '14.5px', 
                        fontWeight: (isSelected || isCorrect) ? '800' : '500',
                        color: isSelected ? '#1e293b' : (isCorrect ? '#064e3b' : '#64748b')
                      }}>
                        {optText}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSelected && (
                        <div style={{ 
                          fontSize: '9px', fontWeight: '900', letterSpacing: '0.05em', 
                          padding: '5px 10px', borderRadius: '8px', 
                          backgroundColor: isCorrect ? '#ecfdf5' : '#2563eb', 
                          color: isCorrect ? '#059669' : '#fff',
                          border: isCorrect ? '1px solid #10b981' : 'none',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          {isCorrect ? "STUDENT CORRECTLY SELECTED" : "STUDENT'S SELECTION"}
                        </div>
                      )}
                      {isCorrect && !isSelected && (
                        <div style={{ 
                          fontSize: '9px', fontWeight: '900', letterSpacing: '0.05em', 
                          padding: '5px 10px', borderRadius: '8px', 
                          backgroundColor: '#10b981', color: '#fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          CORRECT ANSWER
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MATCH THE FOLLOWING RENDERING */}
        {correctPairs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <GitBranch size={14} className="text-amber-500" />
              Pairing Verification
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               {/* This would need more detailed mapping if pairs are complex, but for now show raw if not handled */}
               <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '16px', border: '1px solid #fef3c7' }}>
                 <div style={{ fontSize: '10px', color: '#b45309', fontWeight: '900', marginBottom: '8px' }}>Correct Pairs</div>
                 <pre style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: '600' }}>{JSON.stringify(correctPairs, null, 2)}</pre>
               </div>
            </div>
          </div>
        )}

        {/* 3. STUDENT ANSWER (CODE) */}
        {studentResponse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
               <Code size={14} className="text-indigo-500" />
               Student's Submitted Code
            </div>
            <div style={{ 
              backgroundColor: "#0f172a", 
              padding: "24px", 
              borderRadius: "20px", 
              border: "1px solid #1e293b", 
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: "#f1f5f9", 
              fontSize: "14px", 
              lineHeight: "1.6", 
              overflowX: "auto", 
              position: "relative",
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ position: "absolute", right: "16px", top: "16px", fontSize: "9px", color: "#475569", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Source Output
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontWeight: '500' }}>{studentResponse}</pre>
            </div>
          </div>
        )}

        {/* 4. AUTOMATED TEST RESULTS */}
        {testCases && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <CheckCircle size={14} className="text-emerald-500" />
              Automated Test Results ({testCases.length})
            </div>
            <div style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '900' }}>Input</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '900' }}>Expected Output</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '900' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '900' }}>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {testCases.map((tc, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === testCases.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', borderRadius: '6px', color: '#1e293b', fontWeight: '700', fontSize: '12px' }}>{tc.input || "—"}</code>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ padding: '4px 8px', backgroundColor: '#f0fdf4', borderRadius: '6px', color: '#166534', fontWeight: '700', fontSize: '12px' }}>{tc.expectedOutput || "—"}</code>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {tc.passed != null ? (
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase',
                            backgroundColor: tc.passed ? '#ecfdf5' : '#fff1f2',
                            color: tc.passed ? '#059669' : '#e11d48',
                            border: tc.passed ? '1px solid #d1fae5' : '1px solid #ffe4e6'
                          }}>
                            {tc.passed ? 'Passed' : 'Failed'}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase',
                          backgroundColor: tc.hidden ? '#fff7ed' : '#f0fdfa',
                          color: tc.hidden ? '#c2410c' : '#0d9488',
                          border: tc.hidden ? '1px solid #ffedd5' : '1px solid #ccfbf1'
                        }}>
                          {tc.hidden ? 'Hidden' : 'Visible'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. FALLBACK FOR OTHER CONTENT (If not MCQ/Code) */}
        {!studentResponse && !testCases && !isMcq && !correctAnswerVal && (
          <div style={{ backgroundColor: "#f8fafc", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
             <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: '12px' }}>Response Data</div>
             <pre style={{ margin: 0, fontSize: "12px", color: "#475569", overflow: "auto", fontWeight: '600', whiteSpace: 'pre-wrap' }}>
               {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
             </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "1000px", height: "85vh", backgroundColor: "#fff", borderRadius: "32px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
        <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <UserCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#1e293b", margin: 0 }}>{student.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: "12px", color: "#64748b", marginTop: '4px', fontWeight: "600" }}>
                <span>{student.registerNo}</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: '#10b981' }}>{student.score} PTS</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: student.tabSwitches > 5 ? "#ef4444" : student.tabSwitches > 0 ? "#f59e0b" : "#10b981" }}>{student.tabSwitches} Switches</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#fff", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer" }} className="hover:bg-rose-50 hover:text-rose-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ width: "240px", borderRight: "1px solid #f1f5f9", overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#fcfdfe" }}>
            <span style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px", paddingLeft: "12px" }}>Questions</span>
            {(answers || []).map((ans, i) => (
              <button 
                key={ans.questionNumber}
                onClick={() => setActiveIdx(i)}
                style={{ 
                  width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: "14px", fontSize: "13px", fontWeight: "800", transition: "all 0.2s",
                  backgroundColor: activeIdx === i ? "#2563eb" : "transparent",
                  color: activeIdx === i ? "#fff" : "#475569",
                  border: "none", cursor: "pointer",
                  boxShadow: activeIdx === i ? "0 10px 15px -3px rgba(79, 70, 229, 0.2)" : "none"
                }}
              >
                Question {i + 1}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "40px", backgroundColor: "#fff" }}>
            {currentAnswer ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#1e40af' }}>
                    <Terminal size={20} />
                  </div>
                  <h4 style={{ fontSize: "18px", fontWeight: "900", color: "#1e293b", margin: 0 }}>Submission Detail</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#2563eb' }}></div>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                      Problem Statement
                    </div>
                    <h5 style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', marginBottom: '12px', lineHeight: '1.4' }}>
                      {currentAnswer.title || currentAnswer.value?.title || "Untitled Question"}
                    </h5>
                    <div 
                      style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', fontWeight: '500', whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ __html: currentAnswer.content || currentAnswer.value?.problemStatement || currentAnswer.value?.content || currentAnswer.value?.description || "No description provided." }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '140px', padding: '12px 16px', backgroundColor: '#fdf4ff', borderRadius: '12px', border: '1px solid #fae8ff', fontSize: '12px', color: '#a21caf', fontWeight: '700' }}>
                      <span style={{ opacity: 0.6, marginRight: '4px' }}>Template:</span> {currentAnswer.template_name || "Custom"}
                    </div>
                    <div style={{ flex: 1, minWidth: '140px', padding: '12px 16px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #e0f2fe', fontSize: '12px', color: '#0369a1', fontWeight: '700' }}>
                      <span style={{ opacity: 0.6, marginRight: '4px' }}>Original Index:</span> #{currentAnswer.questionNumber}
                    </div>
                    {currentAnswer.score != null && (
                      <div style={{ flex: 1, minWidth: '140px', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #d1fae5', fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                        <span style={{ opacity: 0.6, marginRight: '4px' }}>Score:</span> {currentAnswer.score}/50
                      </div>
                    )}
                    {currentAnswer.value?.language && (
                      <div style={{ flex: 1, minWidth: '140px', padding: '12px 16px', backgroundColor: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7', fontSize: '12px', color: '#b45309', fontWeight: '700' }}>
                        <span style={{ opacity: 0.6, marginRight: '4px' }}>Language:</span> {currentAnswer.value.language.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {renderValue(currentAnswer.value)}
              </div>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: "16px" }}>
                <Code size={48} style={{ opacity: 0.1 }} />
                <p style={{ fontWeight: '600' }}>No detailed response found for this question index.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
