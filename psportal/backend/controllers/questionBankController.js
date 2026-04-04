const QuestionBankSubmission = require("../models/QuestionBankSubmission");
const FacultyCourseAssignment = require("../models/FacultyCourseAssignment");
const AdminCourse = require("../models/AdminCourse");
const User = require("../models/User");
const StudentExamAttempt = require("../models/StudentExamAttempt");

const API_BASE = process.env.API_BASE || "";

// ——— Faculty: get my question bank tasks (assigned via FacultyCourseAssignment OR Course details Faculty name) ———

exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const currentUser = await User.findById(userId).lean();
    const userName = (currentUser?.name || "").trim();

    const assignments = await FacultyCourseAssignment.find({ user_id: userId })
      .populate("course_id", "name status")
      .populate("template_id", "name key")
      .lean();
    const courseMap = new Map();
    assignments.forEach((a) => {
      const cid = a.course_id?._id?.toString();
      if (cid) {
        courseMap.set(cid, {
          name: a.course_id?.name,
          status: a.course_id?.status,
          template_id: a.template_id?._id?.toString() || null,
          template_name: a.template_id?.name || "",
          question_count: a.question_count ?? 0,
          assigned_at: a.updatedAt || a.createdAt || null,
        });
      }
    });

    if (userName) {
      const coursesByFaculty = await AdminCourse.find({
        faculty: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        status: "Active",
      }).lean();
      coursesByFaculty.forEach((c) => {
        const cid = c._id.toString();
        if (!courseMap.has(cid)) courseMap.set(cid, { name: c.name, status: c.status || "Active" });
      });
    }

    const courseIds = Array.from(courseMap.keys());

    const submissions = await QuestionBankSubmission.find({
      user_id: userId,
      course_id: { $in: courseIds },
    })
      .populate("course_id", "name status")
      .lean();

    const submissionByCourse = new Map();
    submissions.forEach((s) => submissionByCourse.set(s.course_id?._id?.toString(), s));

    const tasks = courseIds.map((cid) => {
      const meta = courseMap.get(cid);
      const sub = submissionByCourse.get(cid);
      const assignedAtMs = meta?.assigned_at ? new Date(meta.assigned_at).getTime() : 0;
      const submissionUpdatedMs = sub?.updatedAt ? new Date(sub.updatedAt).getTime() : 0;
      const isReviewed = sub?.status === "approved" || sub?.status === "rejected";
      // If admin re-assigned this course after the previous reviewed submission,
      // treat it as a fresh task so it appears under Pending.
      const shouldResetByReassignment =
        !!sub && isReviewed && assignedAtMs > 0 && submissionUpdatedMs > 0 && assignedAtMs > submissionUpdatedMs;
      const effectiveSub = shouldResetByReassignment ? null : sub;
      const questions = (effectiveSub?.questions || []).map((q) => ({
        questionNumber: q.questionNumber,
        template_id: q.template_id?.toString?.() || q.template_id,
        value: q.value || {},
        correctAnswerKey: q.correctAnswerKey ?? "",
      }));
      return {
        id: effectiveSub?._id?.toString(),
        course_id: cid,
        course_name: meta?.name,
        course_status: meta?.status,
        status: effectiveSub?.status || "not_started",
        title: effectiveSub?.title || "",
        content: effectiveSub?.content || "",
        file_url: effectiveSub?.file_url || "",
        submitted_at: effectiveSub?.submitted_at,
        reviewed_at: effectiveSub?.reviewed_at,
        review_remarks: effectiveSub?.review_remarks || "",
        template_id: meta?.template_id || null,
        template_name: meta?.template_name || "",
        question_count: meta?.question_count ?? 0,
        questions,
      };
    });

    res.json({ tasks });
  } catch (err) {
    console.error("getMyTasks error:", err);
    res.status(500).json({ message: "Failed to load tasks" });
  }
};

// ——— Faculty: create or update submission (draft / submit) ———
exports.upsertSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { course_id, title, content, file_url, file_name, action, questions } = req.body;
    if (!course_id) return res.status(400).json({ message: "course_id required" });

    const assigned = await FacultyCourseAssignment.findOne({ user_id: userId, course_id });
    const currentUser = await User.findById(userId).lean();
    const userName = (currentUser?.name || "").trim();
    const courseByFaculty = userName
      ? await AdminCourse.findOne({ _id: course_id, faculty: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).lean()
      : null;
    if (!assigned && !courseByFaculty) return res.status(403).json({ message: "You are not assigned to this course" });

    const isSubmit = action === "submit";
    const update = {
      title: title ?? "",
      content: content ?? "",
      file_url: file_url ?? "",
      file_name: file_name ?? "",
      ...(isSubmit
        ? { status: "submitted", submitted_at: new Date() }
        : { status: "draft" }),
    };

    // ONLY update questions if they are explicitly sent in the request.
    // If they are missing (e.g. saving from the summary view), we MUST NOT touch the existing questions.
    if (Array.isArray(questions) && questions.length > 0) {
      update.questions = questions.map((q) => ({
        questionNumber: q.questionNumber,
        template_id: q.template_id || q.templateId,
        value: q.value || {},
        correctAnswerKey: q.correctAnswerKey ?? "",
      }));
    }

    const doc = await QuestionBankSubmission.findOneAndUpdate(
      { course_id, user_id: userId },
      { $set: update }, // Using $set to only update provided fields
      { new: true, upsert: true }
    )
      .populate("course_id", "name")
      .lean();

    res.json({
      id: doc._id.toString(),
      course_id: doc.course_id?._id?.toString(),
      course_name: doc.course_id?.name,
      status: doc.status,
      title: doc.title,
      content: doc.content,
      file_url: doc.file_url,
      submitted_at: doc.submitted_at,
    });
  } catch (err) {
    console.error("upsertSubmission error:", err);
    res.status(500).json({ message: "Failed to save" });
  }
};

// ——— Student: get pre-assigned questions for a booking (for exam portal) ———
exports.getAttemptForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { register_no } = req.query;
    if (!bookingId || !register_no) return res.status(400).json({ message: "bookingId and register_no required" });

    // Populate template data to get UI layouts for the portal
    const attempt = await StudentExamAttempt.findOne({ booking_id: bookingId, register_no })
      .populate("questions.template_id", "name key layout")
      .lean();

    if (!attempt) {
      return res.status(404).json({ message: "No pre-assigned questions found for this booking." });
    }

    const formattedQuestions = attempt.questions.map(q => {
      const tmpl = q.template_id;
      const rawLayout = tmpl && Array.isArray(tmpl.layout) ? tmpl.layout : [];
      return {
        questionNumber: q.questionNumber,
        template_id: tmpl?._id?.toString(),
        template_name: tmpl?.name,
        layout: rawLayout,
        title: q.title,
        content: q.content,
        value: q.value || {}, // this should be empty if not submitted
      };
    });

    res.json({
      course_id: attempt.course_id,
      questions: formattedQuestions
    });
  } catch (err) {
    console.error("getAttemptForBooking error:", err);
    res.status(500).json({ message: "Failed to load pre-assigned questions" });
  }
};

// ——— Student: get approved question bank for a course (for exam portal) ———
exports.getApprovedQuestionsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) return res.status(400).json({ message: "courseId required" });
    const doc = await QuestionBankSubmission.findOne({
      course_id: courseId,
      status: "approved",
    })
      .populate("course_id", "name")
      .populate("questions.template_id", "name key layout")
      .lean();
    if (!doc) return res.status(404).json({ message: "No approved question bank for this course" });
    const questions = (doc.questions || []).map((q) => {
      const tmpl = q.template_id;
      const rawLayout = tmpl && Array.isArray(tmpl.layout) ? tmpl.layout : [];
      return {
        questionNumber: q.questionNumber,
        template_id: tmpl?._id?.toString(),
        template_name: tmpl?.name,
        layout: rawLayout,
        value: q.value || {},
      };
    });
    res.json({
      course_id: doc.course_id?._id?.toString() || doc.course_id?.toString(),
      course_name: doc.course_id?.name || "",
      questions,
    });
  } catch (err) {
    console.error("getApprovedQuestionsForCourse error:", err);
    res.status(500).json({ message: err.message || "Failed to load" });
  }
};

// ——— Student: submit exam attempt (answers) ———
exports.submitStudentAttempt = async (req, res) => {
  try {
    const { register_no, course_id, booking_id, questions, tab_switches } = req.body;
    if (!register_no || !course_id) return res.status(400).json({ message: "register_no and course_id required" });

    const bookingId = booking_id != null ? String(booking_id).trim() : "";
    if (!bookingId) {
      return res.status(400).json({ message: "booking_id is required to submit this assessment." });
    }

    const StudentLevelProgress = require("../models/StudentLevelProgress");
    const progress = await StudentLevelProgress.findOne({ register_no, course_id });
    if (progress && (progress.status === "completed" || progress.status === "failed")) {
       return res.status(403).json({ message: "You have already finalized this assessment." });
    }

    let doc = await StudentExamAttempt.findOne({ register_no, course_id, booking_id: bookingId });
    if (!doc) {
      doc = new StudentExamAttempt({
        register_no,
        course_id,
        booking_id: bookingId,
        questions: [],
        tab_switches: 0
      });
    }

    const incMap = {};
    if (Array.isArray(questions)) {
      questions.forEach(q => { incMap[q.questionNumber] = q; });
    }

    const updatedQuestionNumbers = new Set();
    // Merge into existing questions
    doc.questions.forEach((aq, idx) => {
      const inc = incMap[aq.questionNumber];
      if (inc) {
        const newVal = { ...(aq.value || {}), ...(inc.value || {}) };
        doc.questions[idx].title = inc.title || aq.title || "";
        doc.questions[idx].content = inc.content || aq.content || "";
        doc.questions[idx].value = newVal;
        updatedQuestionNumbers.add(aq.questionNumber);
      }
    });

    // Add new questions
    if (Array.isArray(questions)) {
      questions.forEach(q => {
        if (!updatedQuestionNumbers.has(q.questionNumber)) {
          doc.questions.push({
            questionNumber: q.questionNumber,
            template_id: q.template_id,
            title: q.title || "",
            content: q.content || "",
            value: q.value || {},
            score: 0
          });
        }
      });
    }

    doc.tab_switches = Math.max(doc.tab_switches || 0, Number(tab_switches) || 0);
    doc.submitted_at = new Date();
    await doc.save();

    // Instant grading and progression logic
    const { processAssessmentResult } = require("../services/assessmentService");
    const result = await processAssessmentResult(register_no, course_id, bookingId);

    res.status(201).json({
      id: doc._id.toString(),
      message: result.message,
      score: result.score,
      isPassed: result.isPassed,
      submitted_at: doc.submitted_at,
    });
  } catch (err) {
    console.error("submitStudentAttempt error:", err);
    res.status(500).json({ message: err.message || "Failed to submit" });
  }
};

// ——— Student: run code against visible testcases (Assessment Portal) ———
exports.runAssessmentCode = async (req, res) => {
  try {
    const { code, language, stdin, testcases = [], language_id } = req.body;
    if (!code) return res.status(400).json({ message: "Code is required" });

    const judge0Service = require("../services/judge0Service");
    const testCaseGenerator = require("../services/testCaseGenerator");

    const results = [];
    // If testcases are provided, run against them
    if (Array.isArray(testcases) && testcases.length > 0) {
      for (const tc of testcases) {
        const runResult = await judge0Service.runCode({
          source_code: code,
          stdin: tc.input || tc.input_format || "",
          language_id: language_id || judge0Service.DEFAULT_LANGUAGE_ID,
        });
        results.push({
          input: tc.input || tc.input_format,
          expected: tc.output || tc.output_format,
          actual: (runResult.stdout || "").trim(),
          passed: runResult.success && testCaseGenerator.compareOutput(runResult.stdout, tc.output || tc.output_format),
          error: !runResult.success ? (runResult.stderr || runResult.compile_output || "Execution failed") : null
        });
      }
    } else {
      // Just a generic run with custom stdin
      const runResult = await judge0Service.runCode({
        source_code: code,
        stdin: stdin || "",
        language_id: language_id || judge0Service.DEFAULT_LANGUAGE_ID,
      });
      return res.json({
        stdout: runResult.stdout,
        stderr: runResult.stderr,
        compile_output: runResult.compile_output,
        success: runResult.success
      });
    }

    res.json({ results });
  } catch (err) {
    console.error("runAssessmentCode error:", err);
    res.status(500).json({ message: "Code execution failed" });
  }
};

// ——— Student: submit individual question for grading (Assessment Portal) ———
exports.submitAssessmentQuestion = async (req, res) => {
  try {
    const { register_no, course_id, booking_id, questionNumber, code, language, language_id } = req.body;
    if (!register_no || !course_id || !questionNumber || !code) {
      return res.status(400).json({ message: "register_no, course_id, questionNumber, and code are required" });
    }

    const judge0Service = require("../services/judge0Service");
    const testCaseGenerator = require("../services/testCaseGenerator");

    // 1. Get all testcases from the Question Bank
    const qb = await QuestionBankSubmission.findOne({ course_id, status: "approved" }).lean();
    if (!qb) return res.status(404).json({ message: "Approved Question Bank not found" });

    const question = qb.questions.find(q => q.questionNumber === Number(questionNumber));
    if (!question) return res.status(404).json({ message: "Question not found in bank" });

    const qValue = question.value || {};
    // Unwrap component key wrapper: value may be { "component-xxxxx": { problemStatement, testCases } }
    const componentKey = Object.keys(qValue).find(k => k.startsWith('component-'));
    const innerValue = (componentKey && typeof qValue[componentKey] === 'object') ? qValue[componentKey] : qValue;
    // Support both camelCase (ProgrammingQuestion) and lowercase field names
    const testcases = innerValue.testCases || innerValue.testcases || [];
    if (!Array.isArray(testcases) || testcases.length === 0) {
      return res.status(400).json({ message: "No testcases defined for this question" });
    }

    // 2. Execute against each testcase
    let passedCount = 0;
    const detailedResults = [];

    for (const tc of testcases) {
      const runResult = await judge0Service.runCode({
        source_code: code,
        stdin: tc.input || tc.input_format || "",
        language_id: language_id || judge0Service.DEFAULT_LANGUAGE_ID,
      });

      // Support both expectedOutput (ProgrammingQuestion) and output/output_format
      const expected = tc.expectedOutput || tc.output || tc.output_format || "";
      const isPassed = runResult.success && testCaseGenerator.compareOutput(runResult.stdout, expected);
      if (isPassed) passedCount++;

      detailedResults.push({
         passed: isPassed,
         error: !runResult.success ? (runResult.stderr || runResult.compile_output) : null
      });
    }

    // 3. Calculate score (out of 50)
    const score = (passedCount / testcases.length) * 50;

    // 4. Update/Create StudentExamAttempt
    let attempt = await StudentExamAttempt.findOne({ register_no, course_id, booking_id });
    if (!attempt) {
       attempt = new StudentExamAttempt({ register_no, course_id, booking_id, questions: [] });
    }

    // Update specific question in attempt
    const qIndex = attempt.questions.findIndex(q => q.questionNumber === Number(questionNumber));
    const qTitle = innerValue.title || innerValue.problem_title || "Question";
    const qContent = innerValue.problemStatement || innerValue.content || innerValue.description || "";
    const questionData = {
      questionNumber: Number(questionNumber),
      template_id: question.template_id,
      title: qTitle,
      content: qContent,
      value: { omni_code: code, language, testCases: detailedResults.map((r, i) => ({
        input: testcases[i]?.input || testcases[i]?.input_format || "",
        expectedOutput: testcases[i]?.expectedOutput || testcases[i]?.output || testcases[i]?.output_format || "",
        passed: r.passed,
        hidden: testcases[i]?.hidden !== false
      })) },
      score: score
    };

    if (qIndex >= 0) {
       attempt.questions[qIndex] = { ...attempt.questions[qIndex].toObject(), ...questionData };
    } else {
       attempt.questions.push(questionData);
    }

    // Recalculate overall score (optional here, but good for consistency)
    attempt.score = attempt.questions.reduce((sum, q) => sum + (q.score || 0), 0);
    // Note: isPassed stays false until final submit potentially, or we can update it if they cross threshold.
    
    await attempt.save();

    res.json({
      success: true,
      passedCount,
      totalCount: testcases.length,
      score,
      results: detailedResults
    });

  } catch (err) {
    console.error("submitAssessmentQuestion error:", err);
    res.status(500).json({ message: "Submission failed" });
  }
};

// ——— Admin: list all submissions (optionally by course_id) ———
exports.listSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).populate("roles").lean();
    const roleNames = (user?.roles || []).map((r) => (r && r.role_name) || r).filter(Boolean);
    const isAdmin = roleNames.some((r) => (r || "").toLowerCase() === "admin" || (r || "").toLowerCase() === "super_admin");
    if (!isAdmin) return res.status(403).json({ message: "Admin only" });

    const { course_id } = req.query;
    const filter = course_id ? { course_id } : {};
    const list = await QuestionBankSubmission.find(filter)
      .populate("course_id", "name status")
      .populate("user_id", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(
      list.map((s) => ({
        id: s._id.toString(),
        course_id: s.course_id?._id?.toString(),
        course_name: s.course_id?.name,
        faculty_name: s.user_id?.name,
        faculty_email: s.user_id?.email,
        user_id: s.user_id?._id?.toString(),
        status: s.status,
        title: s.title,
        submitted_at: s.submitted_at,
        reviewed_at: s.reviewed_at,
        review_remarks: s.review_remarks,
      }))
    );
  } catch (err) {
    console.error("listSubmissions error:", err);
    res.status(500).json({ message: "Failed to list" });
  }
};

// ——— Admin: approve or reject ———
exports.reviewSubmission = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).populate("roles").lean();
    const roleNames = (user?.roles || []).map((r) => (r && r.role_name) || r).filter(Boolean);
    const isAdmin = roleNames.some((r) => (r || "").toLowerCase() === "admin" || (r || "").toLowerCase() === "super_admin");
    if (!isAdmin) return res.status(403).json({ message: "Admin only" });

    const { id } = req.params;
    const { status, review_remarks } = req.body;
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected" });
    }

    const doc = await QuestionBankSubmission.findByIdAndUpdate(
      id,
      {
        status,
        reviewed_at: new Date(),
        reviewed_by: userId,
        review_remarks: review_remarks || "",
      },
      { new: true }
    )
      .populate("course_id", "name")
      .populate("user_id", "name email")
      .lean();

    if (!doc) return res.status(404).json({ message: "Submission not found" });

    res.json({
      id: doc._id.toString(),
      course_name: doc.course_id?.name,
      status: doc.status,
      reviewed_at: doc.reviewed_at,
    });
  } catch (err) {
    console.error("reviewSubmission error:", err);
    res.status(500).json({ message: "Failed to update" });
  }
};
