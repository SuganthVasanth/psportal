import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import TemplateQuestionForm from "../components/renderer/TemplateQuestionForm";

const API_BASE = "http://localhost:5000";

/** URL base for editor opened in its own tab (no staff dashboard shell). */
export const STANDALONE_QB_EDITOR_BASE = "/faculty/question-bank-editor";

export function standaloneQbEditorPath(courseId, levelIndex, templateId) {
  return `${STANDALONE_QB_EDITOR_BASE}/${encodeURIComponent(String(courseId || ""))}/${encodeURIComponent(String(levelIndex ?? 0))}/${encodeURIComponent(String(templateId || ""))}`;
}

function loadDraftFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function saveDraftToStorage(key, value) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(value || {}));
  } catch (_) {}
}

function clearDraftInStorage(key) {
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}

function leaveEditor(navigate) {
  if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
    window.close();
    return;
  }
  navigate("/dashboard/faculty/question-banks");
}

export default function FacultyQuestionBankEditorStandalone() {
  const navigate = useNavigate();
  const { courseId: courseIdParam, levelIndex: levelIndexParam, templateId: templateIdParam } = useParams();
  const [searchParams] = useSearchParams();

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState("");
  const [questionBankTasks, setQuestionBankTasks] = useState([]);
  /** True until my-tasks fetch completes (or skips for no faculty access). Avoids a flash of "not found". */
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [task, setTask] = useState(null);
  const [questionValues, setQuestionValues] = useState({});
  const [questionIndex, setQuestionIndex] = useState(1);
  const [draftStorageKey, setDraftStorageKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const excelInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const userId = me?.user?.id;

  const courseId = courseIdParam ? decodeURIComponent(courseIdParam) : "";
  const levelIndex = levelIndexParam !== undefined ? Number(decodeURIComponent(String(levelIndexParam))) : 0;
  const templateId = templateIdParam ? decodeURIComponent(templateIdParam) : "";

  const questionIndexFromUrl = useMemo(() => {
    const q = Number(searchParams.get("q") || "1");
    return Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
  }, [searchParams]);

  const getDraftStorageKeyFor = (cid, lev, tid) => {
    const uid = userId || "unknown";
    return `qbDraft:${uid}:${cid}:${lev || 0}:${tid || "no_template"}`;
  };

  useEffect(() => {
    if (!token) return;
    setMeLoading(true);
    setMeError("");
    fetch(`${API_BASE}/api/dashboard/me`, { headers: authHeaders })
      .then((res) => res.json().then((p) => (res.ok ? p : Promise.reject(new Error(p.message || "Failed to load profile")))))
      .then(setMe)
      .catch((err) => setMeError(err.message || "Failed to load profile"))
      .finally(() => setMeLoading(false));
  }, [token, authHeaders]);

  useEffect(() => {
    if (!token || meLoading) return;
    if (!me?.user) {
      setLoadingTasks(false);
      return;
    }
    const accesses = me.user.accesses || [];
    const roles = me.user.roles || [];
    const normRoles = roles.map((r) => String(r).toLowerCase().replace(/\s+/g, "_"));
    const isTechFaculty = normRoles.includes("technical_faculty");
    if (!accesses.includes("faculty.question_bank") && !accesses.includes("faculty.courses_assigned") && !isTechFaculty) {
      setQuestionBankTasks([]);
      setLoadingTasks(false);
      return;
    }
    setLoadingTasks(true);
    fetch(`${API_BASE}/api/question-banks/my-tasks`, { headers: authHeaders })
      .then((res) => res.json().then((p) => (res.ok ? p : { tasks: [] })))
      .then((r) => setQuestionBankTasks(r.tasks || []))
      .catch(() => setQuestionBankTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [token, authHeaders, me?.user, meLoading]);

  useEffect(() => {
    if (meLoading || loadingTasks) return;

    const allTasksNow = questionBankTasks?.length
      ? questionBankTasks
      : (me?.assigned_courses || []).map((c) => ({
          course_id: c.id,
          course_name: c.name,
          level_index: 0,
          status: "not_started",
        }));

    const found =
      allTasksNow.find(
        (t) =>
          String(t.course_id) === String(courseId) &&
          Number(t.level_index || 0) === Number(levelIndex) &&
          String(t.template_id) === String(templateId)
      ) || null;

    if (!found || !found.template_id) {
      setTask(null);
      setQuestionValues({});
      setDraftStorageKey("");
      return;
    }

    setTask(found);
    setQuestionIndex(Math.max(1, questionIndexFromUrl));

    const key = getDraftStorageKeyFor(found.course_id, found.level_index, found.template_id);
    setDraftStorageKey(key);

    const fromSaved = (found.questions || []).reduce((acc, q) => {
      acc[q.questionNumber] = q.value || {};
      return acc;
    }, {});

    const fromStorage = loadDraftFromStorage(key);
    const finalValues = fromStorage && Object.keys(fromStorage).length > 0 ? fromStorage : fromSaved;
    setQuestionValues(finalValues);
  }, [
    meLoading,
    loadingTasks,
    questionBankTasks,
    me?.assigned_courses,
    courseId,
    levelIndex,
    templateId,
    questionIndexFromUrl,
    userId,
  ]);

  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = new Uint8Array(event.target.result);
        const workbook = XLSX.read(raw, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const questionsValues = {};
        let qCount = 0;
        const startRow =
          jsonData[0] &&
          (String(jsonData[0][1]).toLowerCase().includes("question") || String(jsonData[0][0]).toLowerCase().includes("q.n"))
            ? 1
            : 0;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 3) continue;

          qCount++;
          const questionRaw = String(row[1] || "");
          const questionText = questionRaw.replace(/^Q?\d+[:.)]\s*/i, "").trim() || questionRaw;

          const options = [
            { text: String(row[2] || ""), correct: Number(row[3]) === 1 },
            { text: String(row[4] || ""), correct: Number(row[5]) === 1 },
            { text: String(row[6] || ""), correct: Number(row[7]) === 1 },
            { text: String(row[8] || ""), correct: Number(row[9]) === 1 },
          ].filter((o) => o.text.trim() !== "");

          if (!options.some((o) => o.correct)) {
            if (options.length > 0) options[0].correct = true;
          }

          questionsValues[qCount] = {
            q: { value: questionText },
            mcq: { options },
          };
        }

        if (qCount > 0) {
          setQuestionValues(questionsValues);
          setTask((prev) => (prev ? { ...prev, question_count: qCount } : prev));
          saveDraftToStorage(draftStorageKey, questionsValues);
          alert(`Success! Loaded ${qCount} questions from Excel Matching your Format.`);
        } else {
          alert("No questions found in the Excel file. Please ensure the format matches the requirements.");
        }
      } catch (error) {
        console.error("Excel parsing error:", error);
        alert("Failed to parse Excel file. Please ensure it's a valid XLSX/XLS file.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = null;
  };

  if (meLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#475569" }}>
        Loading…
      </div>
    );
  }

  if (meError) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, background: "#f8fafc" }}>
        <p style={{ color: "#b91c1c" }}>{meError}</p>
        <button type="button" onClick={() => navigate("/dashboard/faculty/question-banks")} style={{ marginTop: 12 }}>
          Back to question banks
        </button>
      </div>
    );
  }

  if (loadingTasks) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#475569" }}>
        Loading…
      </div>
    );
  }

  if (!task?.template_id) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, background: "#f8fafc" }}>
        <p style={{ color: "#475569" }}>This question bank task could not be loaded. It may be unavailable or the link is invalid.</p>
        <button type="button" onClick={() => navigate("/dashboard/faculty/question-banks")} style={{ marginTop: 12 }}>
          Back to question banks
        </button>
      </div>
    );
  }

  const total = Math.max(1, task.question_count || 1);
  const num = questionIndex;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>
          {task.course_name} — {task.level_name || (task.level_index !== undefined ? `Level ${task.level_index + 1}` : "")} (
          {task.template_name || "Template"})
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {(task.template_key === "mcq" || (task.template_name || "").toLowerCase().includes("multiple choice")) && (
            <>
              <input
                type="file"
                ref={excelInputRef}
                style={{ display: "none" }}
                accept=".xlsx, .xls"
                onChange={handleExcelUpload}
              />
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #6366f1",
                  background: "#f5f3ff",
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "#6366f1",
                }}
              >
                <FileSpreadsheet size={18} /> Upload Questions (Excel)
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              saveDraftToStorage(draftStorageKey, questionValues);
              leaveEditor(navigate);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              color: "#475569",
            }}
          >
            <X size={18} /> Close
          </button>
        </div>
      </header>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 24,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "100%", width: "100%" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 18, color: "#1e293b", fontWeight: 600 }}>
            Question {num} of {total}
          </h3>
          <div
            style={{
              padding: 28,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              backgroundColor: "#fff",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <TemplateQuestionForm
              templateId={task.template_id}
              value={questionValues[num] || {}}
              onChange={(v) => {
                setQuestionValues((prev) => {
                  const next = { ...prev, [num]: v };
                  saveDraftToStorage(draftStorageKey, next);
                  return next;
                });
              }}
              readOnly={false}
              fitToContainer={true}
              componentPrefix={`q${num}`}
            />
          </div>
        </div>
      </div>
      <footer
        style={{
          flexShrink: 0,
          padding: "14px 24px",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              const next = Math.max(1, questionIndex - 1);
              navigate(`${standaloneQbEditorPath(task.course_id, task.level_index, task.template_id)}?q=${next}`, { replace: true });
            }}
            disabled={questionIndex <= 1}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: questionIndex <= 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
              color: questionIndex <= 1 ? "#94a3b8" : "#475569",
              opacity: questionIndex <= 1 ? 0.7 : 1,
            }}
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
            {questionIndex} / {total}
          </span>
          <button
            type="button"
            onClick={() => {
              const max = Math.max(1, task.question_count || 1);
              const next = Math.min(max, questionIndex + 1);
              navigate(`${standaloneQbEditorPath(task.course_id, task.level_index, task.template_id)}?q=${next}`, { replace: true });
            }}
            disabled={questionIndex >= total}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: questionIndex >= total ? "not-allowed" : "pointer",
              fontWeight: 600,
              color: questionIndex >= total ? "#94a3b8" : "#475569",
              opacity: questionIndex >= total ? 0.7 : 1,
            }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              saveDraftToStorage(draftStorageKey, questionValues);
              leaveEditor(navigate);
            }}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || submitting}
            onClick={async () => {
              if (!task?.course_id || !authHeaders?.Authorization) return;
              setSaving(true);
              try {
                const qNumbers = Object.keys(questionValues).map(Number).sort((a, b) => a - b);
                const questions = qNumbers.map((n) => ({
                  questionNumber: n,
                  template_id: task.template_id,
                  value: questionValues[n] || {},
                }));
                const res = await fetch(`${API_BASE}/api/question-banks`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...authHeaders },
                  body: JSON.stringify({
                    course_id: task.course_id,
                    level_index: task.level_index || 0,
                    title: task.course_name,
                    content: "",
                    action: "draft",
                    questions,
                  }),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message || "Save failed");
                saveDraftToStorage(draftStorageKey, questionValues);
                alert("Draft saved. You can continue editing or submit when ready.");
              } catch (e) {
                alert(e.message || "Failed to save draft");
              } finally {
                setSaving(false);
              }
            }}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #64748b",
              background: "#fff",
              cursor: saving || submitting ? "not-allowed" : "pointer",
              fontWeight: 600,
              color: "#475569",
            }}
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            className="ud-btn-primary"
            disabled={saving || submitting}
            onClick={async () => {
              if (!task?.course_id || !authHeaders?.Authorization) return;
              setSubmitting(true);
              try {
                const qNumbers = Object.keys(questionValues).map(Number).sort((a, b) => a - b);
                const questions = qNumbers.map((n) => ({
                  questionNumber: n,
                  template_id: task.template_id,
                  value: questionValues[n] || {},
                }));
                const res = await fetch(`${API_BASE}/api/question-banks`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...authHeaders },
                  body: JSON.stringify({
                    course_id: task.course_id,
                    level_index: task.level_index || 0,
                    title: task.course_name,
                    content: "",
                    action: "submit",
                    questions,
                  }),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message || "Submit failed");
                clearDraftInStorage(draftStorageKey);
                alert("Submitted successfully.");
                leaveEditor(navigate);
              } catch (e) {
                alert(e.message || "Failed to submit");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Submitting…" : "Submit to admin"}
          </button>
        </div>
      </footer>
    </div>
  );
}
