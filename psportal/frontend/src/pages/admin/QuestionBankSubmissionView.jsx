import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TemplateQuestionForm from "../../components/renderer/TemplateQuestionForm";

const API_BASE = "http://localhost:5000";

export default function QuestionBankSubmissionView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch(`${API_BASE}/api/superadmin/question-bank-submissions/${id}`, { headers: authHeaders })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Failed to load submission");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setSubmission(data);
        setReviewRemarks(data.review_remarks || "");
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e.message || "Failed to load");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, authHeaders]);

  const questions = submission?.questions || [];

  const review = async (status) => {
    if (!submission?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/superadmin/question-bank-submissions/${submission.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status, review_remarks: reviewRemarks }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed");
      setSubmission((s) => (s ? { ...s, status, review_remarks: reviewRemarks, reviewed_at: data.reviewed_at || s.reviewed_at } : s));
      window.alert(status === "approved" ? "Approved" : "Rejected");
    } catch (e) {
      window.alert(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Question bank submission</h2>
          <div style={{ marginTop: 6, color: "#64748b" }}>
            <Link to="/dashboard" style={{ color: "#2563eb", textDecoration: "none" }}>Back to dashboard</Link>
          </div>
        </div>
      </div>

      {loading && <p style={{ marginTop: 16 }}>Loading…</p>}
      {loadError && <p style={{ marginTop: 16, color: "#b91c1c" }}>{loadError}</p>}

      {!loading && submission && (
        <>
          <div style={{ marginTop: 16, padding: 14, border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc" }}>
            <div><strong>Course:</strong> {submission.course_name || "—"}</div>
            <div><strong>Faculty:</strong> {submission.faculty_name || submission.faculty_email || "—"}</div>
            <div style={{ marginTop: 6 }}>
              <strong>Status:</strong> {submission.status}
              {submission.submitted_at && <span style={{ marginLeft: 10, color: "#64748b" }}>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <h3 style={{ margin: "0 0 10px" }}>Questions</h3>
            {questions.length === 0 ? (
              <p style={{ color: "#64748b" }}>No template questions attached to this submission.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {questions.map((q, idx) => (
                  <div key={`${q.questionNumber}-${idx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                      <strong>Question {q.questionNumber}</strong>
                      {q.template_name && <span style={{ marginLeft: 8, color: "#64748b" }}>({q.template_name})</span>}
                    </div>
                    <div style={{ padding: 16 }}>
                      <TemplateQuestionForm
                        templateId={q.template_id}
                        value={q.value || {}}
                        onChange={() => {}}
                        readOnly={true}
                        componentPrefix={`admin_q${q.questionNumber}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, padding: 14, border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>Corrections / feedback (sent to faculty)</label>
            <textarea
              rows={4}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="Add corrections or feedback..."
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={saving || !(submission.status === "submitted" || submission.status === "draft")}
                onClick={() => review("approved")}
                style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.8 : 1 }}
              >
                {saving ? "Saving…" : "Approve"}
              </button>
              <button
                type="button"
                disabled={saving || !(submission.status === "submitted" || submission.status === "draft")}
                onClick={() => review("rejected")}
                style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.8 : 1 }}
              >
                {saving ? "Saving…" : "Reject"}
              </button>
            </div>
            {!(submission.status === "submitted" || submission.status === "draft") && (
              <p style={{ marginTop: 10, color: "#64748b" }}>This submission is already reviewed.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

