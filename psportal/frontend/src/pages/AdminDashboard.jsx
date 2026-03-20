import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
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
  LogOut,
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
import "./SuperAdminDashboard.css";
import ChatModal from "../components/ChatModal";
import QuestionTemplateBuilder from "./admin/QuestionTemplateBuilder";
import TimePicker12h from "../components/TimePicker12h";
import { templateApi } from "../services/templateApi";

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
      { id: "course-points", label: "Details", icon: List, path: "course-details" },
      { id: "ps-courses", label: "PS Courses", icon: BookMarked, path: "ps-courses" },
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
      { id: "stats-slot", label: "Slot used most often", icon: PieChart, path: "reports-slots" },
      { id: "stats-weekly", label: "Weekly clearing %", icon: BarChart2, path: "reports-weekly" },
      { id: "stats-registered", label: "Course registered/attended", icon: CalendarCheck, path: "reports-registered" },
    ],
  },
];

const PATH_TO_SECTION = {};
NAV.forEach((sec) => {
  (sec.sub || []).forEach((sub) => {
    if (sub.path) PATH_TO_SECTION[sub.path] = { openNav: sec.id, activeSub: sub.id };
  });
});
PATH_TO_SECTION[""] = PATH_TO_SECTION["overview"] = { openNav: "rbac", activeSub: "roles" };

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
  "hostel manager": { backgroundColor: "#e0e7ff", color: "#3730a3" },
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
  { backgroundColor: "#f3e8ff", color: "#7c3aed" },
  { backgroundColor: "#fed7aa", color: "#ea580c" },
  { backgroundColor: "#e0e7ff", color: "#4338ca" },
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

  useEffect(() => {
    const raw = (location.pathname || "").replace(/^\/admin\/?/, "").replace(/^\/+/, "");
    const seg = raw || "overview";
    if (raw === "") {
      navigate("/admin/roles", { replace: true });
      return;
    }
    const sec = PATH_TO_SECTION[seg] || PATH_TO_SECTION["overview"];
    setOpenNav(sec.openNav);
    setActiveSub(sec.activeSub);
  }, [location.pathname, navigate]);

  const [rolesList, setRolesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [venuesList, setVenuesList] = useState([]);
  const [timeSlotsList, setTimeSlotsList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [leaveTypesList, setLeaveTypesList] = useState([]);
  const [leaveWorkflowList, setLeaveWorkflowList] = useState([]);
  const [leaveApprovalSteps, setLeaveApprovalSteps] = useState("mentor, warden, hostel_manager");
  const [leaveFlowSelectedType, setLeaveFlowSelectedType] = useState("");
  const [leaveFlowSteps, setLeaveFlowSteps] = useState([""]);
  const [createUserForm, setCreateUserForm] = useState({ email: "", name: "", roles: [] });
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [facultyAssignUserId, setFacultyAssignUserId] = useState("");
  const [facultyAssignCourseId, setFacultyAssignCourseId] = useState("");
  const [facultyAssignTemplateId, setFacultyAssignTemplateId] = useState("");
  const [facultyAssignQuestionCount, setFacultyAssignQuestionCount] = useState(10);
  const [questionBankSubmissions, setQuestionBankSubmissions] = useState([]);
  const [questionBankFilterCourse, setQuestionBankFilterCourse] = useState("");
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [editModal, setEditModal] = useState({
    open: false,
    section: "",
    itemId: null,
    item: {},
  });

  const facultyCandidates = usersList.filter((u) =>
    (u.roles || []).some((r) => r.toLowerCase().includes("faculty") || r.toLowerCase().includes("mentor"))
  );
  const facultyList = facultyCandidates.length ? facultyCandidates : usersList;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [roles, users, courses, venues, timeSlots, slotTemplates, leaveTypes, leaveWorkflows, settings, assignments, qbSubmissions, templates] = await Promise.all([
          fetch(`${API_BASE}/api/superadmin/roles`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/users`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/courses`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/venues`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/time-slots`).then((r) => r.json()),
          fetch(`${API_BASE}/api/superadmin/slot-templates`).then((r) => r.json()),
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
    if (activeSub !== "question-form-builder") return;
    refetchQuestionTemplates();
  }, [activeSub, refetchQuestionTemplates]);

  // Combined list for PS Courses page: all Admin (Course details) + all PS courses
  const psCoursesCombinedList = useMemo(() => {
    const adminRows = (coursesList || []).map((c) => ({ ...c, _source: "Admin", _rowId: `admin-${c.id}` }));
    const psRows = (psCoursesList || []).map((c) => ({ ...c, _source: "PS", _rowId: `ps-${c.id}` }));
    return [...adminRows, ...psRows];
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

  const statsCourseChart = useMemo(() => {
    const labels = coursesList.length ? coursesList.map((c) => c.name) : ["PS Activity 101", "Advanced PS"];
    const counts = coursesList.length ? [320, 280, 150].slice(0, labels.length) : [320, 280, 150];
    return {
      labels,
      datasets: [{ label: "Applications", data: counts, backgroundColor: ["#8b5cf6", "#06b6d4", "#10b981"] }],
    };
  }, [coursesList]);
  const statsSlotChart = useMemo(() => {
    const labels = slotsList.length ? slotsList.map((s) => `${s.venueLabel} (${s.timeLabel})`) : ["Hall A (09:00–10:30)", "Lab 2 (14:00–15:30)", "Hall B (11:00–12:30)"];
    const bookings = slotsList.length ? [450, 320, 280].slice(0, labels.length) : [450, 320, 280];
    return {
      labels,
      datasets: [{ label: "Bookings", data: bookings, backgroundColor: ["#8b5cf6", "#06b6d4", "#10b981"] }],
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

  return (
    <div className="dashboard-layout sa-dashboard-layout">
      <header className="top-navbar">
        <div className="top-nav-brand">
          <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          <span>PCDP Portal</span>
        </div>
        <div className="top-nav-profile">
          <img
            src={`https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png`}
            alt="Profile"
            className="profile-avatar"
          />
          <div className="profile-info">
            <span className="profile-id">Admin</span>
            <span className="profile-name">{userName}</span>
          </div>
          <button type="button" className="sa-logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="sa-body">
        <aside className="sa-sidebar" aria-label="Navigation - hover to open">
          <div className="sa-sidebar-inner">
            {NAV.map((section) => {
              const isOpen = openNav === section.id;
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className={`sa-nav-section ${isOpen ? "open" : ""}`}
                >
                  <div
                    className={`sa-nav-main ${isOpen ? "active" : ""}`}
                    onClick={() => setOpenNav(isOpen ? "" : section.id)}
                  >
                  <span className="sa-nav-label">
                    <Icon size={24} />
                    <span className="sa-nav-label-text">{section.label}</span>
                  </span>
                    <ChevronDown size={18} className="sa-chevon" />
                  </div>
                  {isOpen && (
                    <ul className="sa-nav-sub">
                      {section.sub.map((sub) => {
                        const SubIcon = sub.icon;
                        const path = sub.path || sub.id;
                        return (
                          <li key={sub.id}>
                            <NavLink
                              to={`/admin/${path}`}
                              className={({ isActive }) => (isActive ? "active" : "")}
                              end={path === "overview"}
                            >
                              <span className="sa-nav-label">
                                {SubIcon ? <SubIcon size={20} /> : null}
                                <span className="sa-nav-label-text">{sub.label}</span>
                              </span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="sa-main">
          <div className="dashboard-container-inner">
            <div className="sa-welcome-banner">
              <span className="sa-breadcrumb">
                <span className="highlight">Admin</span>
                <span className="sa-breadcrumb-sep">/</span>
                {NAV.find((s) => s.id === openNav)?.label}
                <span className="sa-breadcrumb-sep">/</span>
                <span className="sa-breadcrumb-current">{NAV.flatMap((s) => s.sub).find((s) => s.id === activeSub)?.label || "Overview"}</span>
              </span>
            </div>

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
            <div className="dashboard-card">
              <h3 className="card-title">Courses</h3>
              <p className="card-subtitle">Add new courses and manage them in a card view, similar to the student dashboard.</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
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
                  <Plus size={16} /> Add new course
                </button>
                <span className="sa-muted" style={{ fontSize: 13 }}>
                  Showing {coursesList.length} courses
                </span>
              </div>

              <div className="courses-grid">
                {coursesList.map((row) => (
                  <div className="course-card" key={row.id}>
                    <div className="course-image">
                      {row.course_logo ? (
                        <img
                          src={row.course_logo}
                          alt={row.name}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="course-image-placeholder">
                          <BookOpen size={40} style={{ color: "#cbd5e0" }} />
                        </div>
                      )}
                    </div>
                    <div className="course-content">
                      <h3 className="course-title">{row.name}</h3>
                      <div className="course-meta">
                        <div className="meta-item">
                          <span className="meta-label">{row.type || "Course"}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">{row.level || "General"}</span>
                        </div>
                        <div className="meta-item">
                          <span
                            className={`sa-badge ${
                              row.status === "Active"
                                ? "sa-badge-success"
                                : row.status === "Inactive"
                                ? "sa-badge-warning"
                                : "sa-badge-neutral"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                      </div>
                      <div className="course-progress-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() => openEdit("courses", row)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        {Array.isArray(row.levels) && row.levels.length > 0 && (
                          <span className="progress-text">
                            {row.levels.length} level{row.levels.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {coursesList.length === 0 && (
                  <p className="courses-empty">No courses yet. Click "Add new course" to create one.</p>
                )}
              </div>
            </div>
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
                          setTemplateIdToEditForBuilder(t._id);
                          navigate("/admin/question-template-builder");
                          setActiveSub("question-template-builder");
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
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name || u.email} {u.roles?.length ? `(${u.roles.join(", ")})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="sa-form-group" style={{ minWidth: 200 }}>
                  <label>Course</label>
                  <select value={facultyAssignCourseId} onChange={(e) => setFacultyAssignCourseId(e.target.value)}>
                    <option value="">Select course</option>
                    {coursesList.filter((c) => c.status === "Active").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
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
                            user_name: u?.name,
                            user_email: u?.email,
                            template_id: data.template_id || null,
                            template_name: data.template_name || "",
                            question_count: data.question_count || 0,
                          },
                        ]);
                        setFacultyAssignUserId("");
                        setFacultyAssignCourseId("");
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
              <table className="sa-table">
                <thead><tr><th>User</th><th>Course</th><th>Question template</th><th>Qty</th><th>Actions</th></tr></thead>
                <tbody>
                  {facultyAssignments.map((a) => {
                    const displayName = a.user_name || a.user_email || (usersList.find((u) => u.id === a.user_id)?.name) || (usersList.find((u) => u.id === a.user_id)?.email) || a.user_id;
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
              {facultyAssignments.length === 0 && <p className="sa-muted">No assignments yet. Select a user and course above to assign.</p>}
            </div>
          )}

          <ChatModal
            open={chatOpen}
            onClose={() => { setChatOpen(false); setChatWithUserId(null); setChatWithUserName(""); }}
            otherUserId={chatWithUserId}
            otherUserName={chatWithUserName}
            title={chatWithUserName ? `Chat with ${chatWithUserName}` : ""}
          />

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
          {activeSub === "stats-course" && (
            <>
              <div className="sa-stats-row">
                <div className="sa-stat-card"><h4>Total applications</h4><div className="value">1,240</div></div>
                <div className="sa-stat-card"><h4>By year</h4><div className="value">2025-26</div></div>
                <div className="sa-stat-card"><h4>By dept</h4><div className="value">8 depts</div></div>
              </div>
              <div className="dashboard-card">
                <h3 className="card-title">Students applied per course (year &amp; dept)</h3>
                <p className="card-subtitle">Breakdown by year and department.</p>
                <div className="sa-chart-wrap">
                  <Bar data={statsCourseChart} options={chartOptions()} />
                </div>
                <table className="sa-table" style={{ marginTop: 16 }}>
                  <thead><tr><th>Course</th><th>Year</th><th>Dept</th><th>Count</th></tr></thead>
                  <tbody>
                    {statsCourseChart.labels.slice(0, 3).map((name, i) => (
                      <tr key={i}><td>{name}</td><td>2025-26</td><td>{["CSE", "ECE", "CSE"][i]}</td><td>{statsCourseChart.datasets[0].data[i]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSub === "stats-slot" && (
            <div className="dashboard-card">
              <h3 className="card-title">Which slot is used most often</h3>
              <p className="card-subtitle">Booking distribution by slot.</p>
              <div className="sa-chart-wrap sa-chart-bar">
                <Bar data={statsSlotChart} options={chartOptions()} />
              </div>
              <div className="sa-chart-wrap sa-chart-doughnut">
                <Doughnut data={statsSlotChart} options={{ ...chartOptions(), plugins: { ...chartOptions().plugins, legend: { position: "right" } } }} />
              </div>
              <table className="sa-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Slot (Venue, Time)</th><th>Bookings</th><th>%</th></tr></thead>
                <tbody>
                  {statsSlotChart.labels.map((label, i) => (
                    <tr key={i}><td>{label}</td><td>{statsSlotChart.datasets[0].data[i]}</td><td>{Math.round((statsSlotChart.datasets[0].data[i] / statsSlotChart.datasets[0].data.reduce((a, b) => a + b, 0)) * 100)}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "stats-weekly" && (
            <div className="dashboard-card">
              <h3 className="card-title">Weekly clearing analysis</h3>
              <p className="card-subtitle">Students clearing / not clearing percentage.</p>
              <div className="sa-chart-wrap">
                <Line data={statsWeeklyChart} options={chartOptions()} />
              </div>
              <table className="sa-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Week</th><th>Cleared</th><th>Not cleared</th><th>Clear %</th></tr></thead>
                <tbody>
                  {statsWeeklyChart.labels.map((week, i) => (
                    <tr key={i}><td>{week}</td><td>{[85, 92, 78][i]}</td><td>{[15, 8, 22][i]}</td><td>{statsWeeklyChart.datasets[0].data[i]}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSub === "stats-registered" && (
            <div className="dashboard-card">
              <h3 className="card-title">Course registered and attended</h3>
              <p className="card-subtitle">Most, least and average.</p>
              <div className="sa-chart-wrap sa-chart-bar">
                <Bar data={statsRegisteredChart} options={{ ...chartOptions(), scales: { x: { stacked: true }, y: { stacked: true } } }} />
              </div>
              <table className="sa-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Course</th><th>Registered</th><th>Attended</th><th>Attendance %</th><th>Rank</th></tr></thead>
                <tbody>
                  {statsRegisteredChart.labels.map((name, i) => (
                    <tr key={i}>
                      <td>{name}</td>
                      <td>{statsRegisteredChart.datasets[0].data[i]}</td>
                      <td>{statsRegisteredChart.datasets[1].data[i]}</td>
                      <td>{((statsRegisteredChart.datasets[1].data[i] / statsRegisteredChart.datasets[0].data[i]) * 100).toFixed(1)}%</td>
                      <td><span className={`sa-badge ${i === 0 ? "sa-badge-success" : i === 2 ? "sa-badge-warning" : ""}`}>{i === 0 ? "Most" : i === 2 ? "Least" : "Avg"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!NAV.flatMap((s) => s.sub).some((s) => s.id === activeSub) && (
            <div className="dashboard-card">
              <p className="sa-empty">Select a section from the sidebar to view and manage content.</p>
            </div>
          )}
          </>}
          </div>
        </main>
      </div>

      {/* Edit / Add modal */}
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
                        <input type="text" value={editModal.item.name || ""} onChange={(e) => setEditField("name", e.target.value)} placeholder="e.g. C Programming" />
                      )}
                    </div>
                    <div className="sa-form-group">
                      <label>Course type</label>
                      <input type="text" value={editModal.item.type || ""} onChange={(e) => setEditField("type", e.target.value)} placeholder="e.g. Technical, Assessment" />
                    </div>
                    <div className="sa-form-group">
                      <label>Level (category)</label>
                      <input type="text" value={editModal.item.level || ""} onChange={(e) => setEditField("level", e.target.value)} placeholder="e.g. Beginner, Level 1" />
                    </div>
                    <div className="sa-form-group">
                      <label>Activity points</label>
                      <input type="number" value={editModal.item.activityPoints ?? 0} onChange={(e) => setEditField("activityPoints", e.target.value)} placeholder="10" min="0" />
                    </div>
                    <div className="sa-form-group">
                      <label>Faculty (handles questions)</label>
                      <select value={editModal.item.faculty || ""} onChange={(e) => setEditField("faculty", e.target.value)}>
                        <option value="">Select faculty</option>
                        {facultyList.map((u) => (
                          <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
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
                            <input type="text" placeholder="e.g. MCQ, Programming, Manual Grading" value={lev.assessmentType || ""} onChange={(e) => { const l = [...levelList]; l[idx] = { ...l[idx], assessmentType: e.target.value }; setEditField("levels", l); }} />
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
                    <button type="button" className="sa-btn sa-btn-primary" onClick={() => setEditField("levels", [...(editModal.item.levels || []), { name: "", rewardPoints: 0, prerequisiteLevelIndex: -1, prerequisiteLevelIndices: [], assessmentType: "MCQ", topics: [], studyMaterials: [] }])}>+ Add level</button>
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
            </div>
            <div className="sa-modal-footer">
              <button type="button" className="sa-btn" onClick={closeEdit}>Cancel</button>
              <button type="button" className="sa-btn sa-btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
