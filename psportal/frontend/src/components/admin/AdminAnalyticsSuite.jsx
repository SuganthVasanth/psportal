import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";

const API_BASE = "http://localhost:5000";

const T = {
  bg: "#f8fafc",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#e2e8f0",
  borderHover: "#cbd5e1",
  text: "#0f172a",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  accent: "#2563eb",
  accentDim: "rgba(37,99,235,0.10)",
  accentMid: "rgba(37,99,235,0.35)",
  teal: "#14b8a6",
  purple: "#7c3aed",
  coral: "#ef4444",
  blue: "#3b82f6",
  chart: ["#2563eb", "#14b8a6", "#7c3aed", "#ef4444", "#3b82f6", "#f97316"],
};

const CHART_LIST = [
  { id: "enrollments", label: "Course Enrollments" },
  { id: "trends", label: "Dept Trends Over Time" },
  { id: "slots", label: "Slot Usage" },
  { id: "weekly", label: "Weekly Clearing" },
  { id: "attendance", label: "Registration vs Attendance" },
  { id: "radar", label: "Dept Performance Radar" },
  { id: "dropoff", label: "Drop-off Analysis" },
];

function KpiCard({ label, value, sub, trend, color }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderHover)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
    >
      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 700, color: color || T.accent, letterSpacing: "-0.5px" }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: T.textDim }}>{sub}</span>}
      {typeof trend === "number" && (
        <span style={{ fontSize: 12, color: trend > 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last period
        </span>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children, onExpand, id, visible }) {
  if (!visible) return null;
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: "28px 28px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.borderHover)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{subtitle}</div>}
        </div>
        <button
          type="button"
          onClick={() => onExpand?.(id)}
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "4px 10px",
            color: T.textMuted,
            fontSize: 11,
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          EXPAND ↗
        </button>
      </div>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: 32,
          width: "100%",
          maxWidth: 980,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: T.text }}>{title}</span>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", color: T.textMuted, fontSize: 20 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminAnalyticsSuite() {
  const [visible, setVisible] = useState(Object.fromEntries(CHART_LIST.map((c) => [c.id, true])));
  const [expanded, setExpanded] = useState(null);
  const [filters, setFilters] = useState({ dept: "All", year: "All" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simpleMode, setSimpleMode] = useState(true);
  const [modalSearch, setModalSearch] = useState("");
  const [data, setData] = useState({
    coursesData: [],
    slotsData: [],
    weeklyData: [],
    attendanceData: [],
    trendsData: [],
    deptRadar: [],
  });
  const [loading, setLoading] = useState(false);

  const toggleChart = (id) => setVisible((v) => ({ ...v, [id]: !v[id] }));
  const ESSENTIAL_CHARTS = ["enrollments", "attendance", "weekly", "dropoff"];
  const isChartVisible = (id) => (simpleMode ? ESSENTIAL_CHARTS.includes(id) : visible[id]);

  const fetchData = async (nextFilters = filters) => {
    const qs = new URLSearchParams();
    if (nextFilters.dept && nextFilters.dept !== "All") qs.set("dept", nextFilters.dept);
    if (nextFilters.year && nextFilters.year !== "All") qs.set("year", nextFilters.year);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/reports/analytics?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load analytics");
      setData({
        coursesData: json.coursesData || [],
        slotsData: json.slotsData || [],
        weeklyData: json.weeklyData || [],
        attendanceData: json.attendanceData || [],
        trendsData: json.trendsData || [],
        deptRadar: json.deptRadar || [],
      });
    } catch {
      setData({
        coursesData: [],
        slotsData: [],
        weeklyData: [],
        attendanceData: [],
        trendsData: [],
        deptRadar: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setModalSearch("");
  }, [expanded]);

  const depts = useMemo(() => ["All", ...Array.from(new Set((data.coursesData || []).map((d) => d.dept).filter(Boolean)))], [data]);
  const totalEnrollments = useMemo(() => data.coursesData.reduce((a, b) => a + Number(b.count || 0), 0), [data]);
  const avgClearance = useMemo(() => {
    if (!data.weeklyData.length) return "0.0";
    return (data.weeklyData.reduce((s, w) => s + Number(w.clearPct || 0), 0) / data.weeklyData.length).toFixed(1);
  }, [data]);
  const avgAttendance = useMemo(() => {
    if (!data.attendanceData.length) return "0.0";
    const reg = data.attendanceData.reduce((s, a) => s + Number(a.registered || 0), 0);
    const att = data.attendanceData.reduce((s, a) => s + Number(a.attended || 0), 0);
    return reg ? ((att / reg) * 100).toFixed(1) : "0.0";
  }, [data]);
  const topCourse = useMemo(() => [...data.coursesData].sort((a, b) => b.count - a.count)[0], [data]);
  const peakSlot = useMemo(() => [...data.slotsData].sort((a, b) => b.bookings - a.bookings)[0], [data]);
  const expandedTitle = useMemo(() => {
    const found = CHART_LIST.find((c) => c.id === expanded);
    return found ? found.label : "";
  }, [expanded]);
  const dropoffSearchResults = useMemo(() => {
    if (expanded !== "dropoff") return [];
    const q = modalSearch.trim().toLowerCase();
    const rows = data.attendanceData || [];
    if (!q) return rows;
    return rows.filter((d) => String(d.course || "").toLowerCase().includes(q));
  }, [data.attendanceData, expanded, modalSearch]);

  const exportReports = (mode = "all") => {
    const safe = (v) => (v === undefined || v === null ? "" : v);

    const wb = XLSX.utils.book_new();
    const addSheet = (name, rows) => {
      const safeRows = Array.isArray(rows) ? rows : [];
      const ws = XLSX.utils.json_to_sheet(safeRows);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    };

    const want = (id) => (mode === "visible" ? isChartVisible(id) : true);

    if (want("enrollments")) {
      addSheet(
        "Enrollments",
        (data.coursesData || []).map((r) => ({
          course: safe(r.course),
          dept: safe(r.dept),
          year: safe(r.year),
          count: Number(r.count || 0),
        })),
      );
    }

    if (want("slots")) {
      addSheet(
        "Slots",
        (data.slotsData || []).map((r) => ({
          slot: safe(r.slot),
          venue: safe(r.venue),
          time: safe(r.time),
          bookings: Number(r.bookings || 0),
        })),
      );
    }

    if (want("weekly")) {
      addSheet(
        "Weekly",
        (data.weeklyData || []).map((r) => ({
          week: safe(r.week),
          cleared: Number(r.cleared || 0),
          notCleared: Number(r.notCleared || 0),
          clearPct: Number(r.clearPct || 0),
        })),
      );
    }

    if (want("attendance") || want("dropoff")) {
      const attendanceRows = (data.attendanceData || []).map((r) => {
        const registered = Number(r.registered || 0);
        const attended = Number(r.attended || 0);
        const dropped = Math.max(registered - attended, 0);
        const attendancePct = registered ? (attended / registered) * 100 : 0;
        const dropoffPct = registered ? (dropped / registered) * 100 : 0;
        return {
          course: safe(r.course),
          registered,
          attended,
          dropped,
          attendancePct: Number(attendancePct.toFixed(1)),
          dropoffPct: Number(dropoffPct.toFixed(1)),
        };
      });

      if (want("attendance")) addSheet("Attendance", attendanceRows);
      if (want("dropoff")) addSheet("Dropoff", attendanceRows);
    }

    if (want("trends")) {
      addSheet(
        "Trends",
        (data.trendsData || []).map((r) => ({
          month: safe(r.month),
          CSE: Number(r.CSE || 0),
          ECE: Number(r.ECE || 0),
          ME: Number(r.ME || 0),
          EE: Number(r.EE || 0),
        })),
      );
    }

    if (want("radar")) {
      addSheet(
        "DeptRadar",
        (data.deptRadar || []).map((r) => ({
          metric: safe(r.metric),
          CSE: Number(r.CSE || 0),
          ECE: Number(r.ECE || 0),
          ME: Number(r.ME || 0),
        })),
      );
    }

    // Always add a small meta sheet for traceability
    addSheet("Meta", [
      {
        exportedAt: new Date().toISOString(),
        deptFilter: safe(filters.dept),
        yearFilter: safe(filters.year),
        mode,
      },
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `admin-reports-${stamp}${mode === "visible" ? "-visible" : ""}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", background: T.bg, minHeight: "90vh", color: T.text, display: "flex", borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <aside
        style={{
          width: sidebarOpen && !simpleMode ? 220 : 0,
          minWidth: sidebarOpen && !simpleMode ? 220 : 0,
          background: T.surface,
          borderRight: `1px solid ${T.border}`,
          overflow: "hidden",
          transition: "all 0.3s ease",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "24px 12px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.textMuted, marginBottom: 12, fontWeight: 700 }}>Visible Charts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CHART_LIST.map((c) => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: visible[c.id] ? T.accentDim : "transparent" }}>
                <input type="checkbox" checked={visible[c.id]} onChange={() => toggleChart(c.id)} />
                <span style={{ fontSize: 12, color: visible[c.id] ? T.text : T.textMuted }}>{c.label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: 22, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: T.textMuted, marginBottom: 10 }}>Filters</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>Department</div>
                <select value={filters.dept} onChange={(e) => setFilters((f) => ({ ...f, dept: e.target.value }))} style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 12 }}>
                  {depts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 5 }}>Year</div>
                <select value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))} style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 12 }}>
                  <option value="All">All Years</option>
                  <option value="I">I</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="2025-26">2025-26</option>
                </select>
              </div>
              <button type="button" onClick={() => fetchData()} style={{ background: T.accent, border: "none", borderRadius: 6, padding: "8px 10px", color: "#fff", fontWeight: 700 }}>Apply</button>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button type="button" onClick={() => setSidebarOpen((s) => !s)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, width: 36, height: 36, color: T.text, opacity: simpleMode ? 0.5 : 1 }} disabled={simpleMode}>{sidebarOpen ? "←" : "→"}</button>
            <div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>Analytics Dashboard</div>
              {/* <div style={{ fontSize: 13, color: T.textMuted }}>{simpleMode ? "Simple view · Key insights only" : "Advanced view · Full analytics controls"}</div> */}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => exportReports(simpleMode ? "visible" : "all")}
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                color: T.text,
                fontWeight: 700,
                cursor: "pointer",
              }}
              title={simpleMode ? "Export key reports (Simple View)" : "Export all reports (Advanced View)"}
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => setSimpleMode((v) => !v)}
              style={{
                background: simpleMode ? T.accent : T.surface,
                border: `1px solid ${simpleMode ? T.accent : T.border}`,
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                color: simpleMode ? "#fff" : T.text,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {simpleMode ? "Simple View" : "Advanced View"}
            </button>
            {/* <div style={{ background: T.accentDim, border: `1px solid ${T.accentMid}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, color: T.accent, fontWeight: 600 }}>LIVE</div> */}
          </div>
        </div>

        {loading && <div style={{ color: T.textMuted, marginBottom: 10 }}>Loading analytics...</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 20 }}>
          <KpiCard label="Total Enrollments" value={totalEnrollments.toLocaleString()} sub="Across all courses & depts" trend={12} />
          <KpiCard label="Avg Attendance Rate" value={`${avgAttendance}%`} sub="Registration → attended" color={T.teal} trend={2.1} />
          <KpiCard label="Top Course" value={topCourse?.course || "—"} sub={`${topCourse?.count || 0} students · ${topCourse?.dept || "N/A"}`} color={T.purple} />
          <KpiCard label="Avg Clearance" value={`${avgClearance}%`} sub="3-week rolling average" color={T.coral} trend={-3.5} />
          <KpiCard label="Peak Slot" value={peakSlot?.time || "—"} sub={`${peakSlot?.bookings || 0} bookings · ${peakSlot?.venue || "N/A"}`} color={T.blue} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: simpleMode ? "1fr" : "1.2fr 1fr", gap: 16, marginBottom: 16 }}>
          <ChartCard id="enrollments" visible={isChartVisible("enrollments")} title="Course Enrollments" subtitle="Sorted by application count" onExpand={setExpanded}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.coursesData.slice(0, 10)} margin={{ top: 0, right: 0, bottom: 40, left: -10 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="course" tick={{ fontSize: 10, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.coursesData.slice(0, 10).map((_, i) => <Cell key={i} fill={i === 0 ? T.accent : i === 1 ? T.teal : "#cbd5e1"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard id="slots" visible={isChartVisible("slots")} title="Slot Booking Distribution" subtitle="Which venue-time slots see most demand" onExpand={setExpanded}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.slotsData.slice(0, 7)} layout="vertical">
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis type="category" dataKey="slot" width={145} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="bookings" radius={[0, 4, 4, 0]}>
                  {data.slotsData.slice(0, 7).map((_, i) => <Cell key={i} fill={i === 0 ? T.accent : i < 3 ? T.teal : "#cbd5e1"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          {/* <ChartCard id="trends" visible={isChartVisible("trends")} title="Dept Enrollment Trends" subtitle="Monthly growth by department" onExpand={setExpanded}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.trendsData}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, color: "#666" }} />
                <Area type="monotone" dataKey="CSE" stroke={T.accent} fill={T.accent} fillOpacity={0.15} />
                <Area type="monotone" dataKey="ECE" stroke={T.teal} fill={T.teal} fillOpacity={0.15} />
                <Area type="monotone" dataKey="ME" stroke={T.purple} fill={T.purple} fillOpacity={0.12} />
                <Area type="monotone" dataKey="EE" stroke={T.blue} fill={T.blue} fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard> */}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: simpleMode ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <ChartCard id="weekly" visible={isChartVisible("weekly")} title="Weekly Clearance Rate" subtitle="Student clearance performance week-over-week" onExpand={setExpanded}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.weeklyData}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip />
                <Line type="monotone" dataKey="clearPct" stroke={T.accent} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard id="attendance" visible={isChartVisible("attendance")} title="Registered vs Attended" subtitle="Attendance rate per course" onExpand={setExpanded}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.attendanceData}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="course" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, color: "#666" }} />
                <Bar dataKey="registered" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="attended" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard id="dropoff" visible={isChartVisible("dropoff")} title="Drop-off Analysis" subtitle="Registration to attendance gap" onExpand={setExpanded}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.attendanceData.slice(0, 4).map((d) => {
                const dropoff = Number(d.registered || 0) - Number(d.attended || 0);
                const dropPct = d.registered ? ((dropoff / d.registered) * 100).toFixed(1) : "0.0";
                return (
                  <div key={d.course} style={{ background: T.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: T.text }}>{d.course}</span>
                      <span style={{ fontSize: 11, color: Number(dropPct) > 5 ? T.coral : T.teal }}>-{dropPct}%</span>
                    </div>
                    <div style={{ background: "#e2e8f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${d.registered ? (d.attended / d.registered) * 100 : 0}%`, background: Number(dropPct) > 5 ? T.coral : T.teal }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
          
        </div>

        <div style={{ display: "grid", gridTemplateColumns: simpleMode ? "1fr" : "1.2fr 1fr 0.8fr", gap: 16, marginBottom: 12 }}>
          
        </div>
      </main>

      <Modal open={!!expanded} onClose={() => setExpanded(null)} title={expandedTitle ? `${expandedTitle} - Detailed View` : "Detailed View"}>
        {expanded === "enrollments" && (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={data.coursesData} margin={{ bottom: 70, left: -10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="course" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip />
              <Bar dataKey="count">{data.coursesData.map((_, i) => <Cell key={i} fill={T.chart[i % T.chart.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {expanded === "trends" && (
          <ResponsiveContainer width="100%" height={420}>
            <AreaChart data={data.trendsData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="CSE" stroke={T.accent} fill={T.accent} fillOpacity={0.18} />
              <Area type="monotone" dataKey="ECE" stroke={T.teal} fill={T.teal} fillOpacity={0.18} />
              <Area type="monotone" dataKey="ME" stroke={T.purple} fill={T.purple} fillOpacity={0.14} />
              <Area type="monotone" dataKey="EE" stroke={T.blue} fill={T.blue} fillOpacity={0.14} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {expanded === "slots" && (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={data.slotsData} layout="vertical" margin={{ right: 24, left: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis type="category" dataKey="slot" width={220} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Bar dataKey="bookings" radius={[0, 4, 4, 0]}>
                {data.slotsData.map((_, i) => <Cell key={i} fill={T.chart[i % T.chart.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {expanded === "weekly" && (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={data.weeklyData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cleared" fill={T.teal} radius={[4, 4, 0, 0]} />
              <Bar dataKey="notCleared" fill={T.coral} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {expanded === "attendance" && (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={data.attendanceData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="course" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="registered" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="attended" fill={T.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {expanded === "radar" && (
          <ResponsiveContainer width="100%" height={420}>
            <RadarChart data={data.deptRadar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} />
              <Radar name="CSE" dataKey="CSE" stroke={T.accent} fill={T.accent} fillOpacity={0.13} />
              <Radar name="ECE" dataKey="ECE" stroke={T.teal} fill={T.teal} fillOpacity={0.13} />
              <Radar name="ME" dataKey="ME" stroke={T.purple} fill={T.purple} fillOpacity={0.13} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        )}
        {expanded === "dropoff" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "6px 2px 10px",
                borderBottom: `1px solid ${T.border}`,
                marginBottom: 6,
              }}
            >
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {dropoffSearchResults.length} course{dropoffSearchResults.length === 1 ? "" : "s"}
              </div>
              <input
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search course..."
                style={{
                  width: 320,
                  maxWidth: "100%",
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 13,
                  outline: "none",
                  color: T.text,
                }}
              />
            </div>

            {dropoffSearchResults.length === 0 && (
              <div style={{ padding: "18px 8px", color: T.textMuted, fontSize: 13 }}>
                No courses match “{modalSearch.trim()}”.
              </div>
            )}

            {dropoffSearchResults.map((d) => {
              const registered = Number(d.registered || 0);
              const attended = Number(d.attended || 0);
              const dropped = Math.max(registered - attended, 0);
              const dropPct = registered ? ((dropped / registered) * 100).toFixed(1) : "0.0";
              return (
                <div key={d.course} style={{ background: T.surface, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>{d.course}</span>
                    <span style={{ fontSize: 12, color: Number(dropPct) > 5 ? T.coral : T.teal, fontWeight: 600 }}>-{dropPct}%</span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 5, height: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${registered ? (attended / registered) * 100 : 0}%`, background: Number(dropPct) > 5 ? T.coral : T.teal }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: T.textMuted }}>
                    Registered: {registered} | Attended: {attended} | Dropped: {dropped}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
