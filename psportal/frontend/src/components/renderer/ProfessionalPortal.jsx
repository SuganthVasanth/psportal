import React, { useState, useRef, useEffect, useMemo } from "react";
import MonacoEditor from "@monaco-editor/react";
import {
  ShieldAlert,
  Clock,
  Monitor,
  CheckCircle,
  ArrowLeft,
  Play,
  Send,
  Terminal,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  AlertCircle
} from "lucide-react";
import TemplateQuestionForm from "./TemplateQuestionForm";

export default function ProfessionalPortal({
  questions = [],
  answers = {},
  onAnswerChange,
  onSubmitAttempt,
  submitting = false,
  onBack,
  course,
  bookingId = "",
  proctorStats = { tabSwitchCount: 0, proctorWarning: "" },
  assessmentEndTime
}) {
  const { tabSwitchCount = 0, proctorWarning = "" } = proctorStats;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [language, setLanguage] = useState("cpp");
  
  // Execution states
  const [testResults, setTestResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  useEffect(() => {
    if (!assessmentEndTime) return;
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(assessmentEndTime).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) onSubmitAttempt();
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [assessmentEndTime, onSubmitAttempt]);

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIdx] || {};
  const currentAnswers = answers[currentQ.questionNumber] || {};
  
  // Merge question definition data (labels, question text, options) with active student answers.
  // This ensures that the renderer sees the question content even before the student has provided an answer.
  const mergedValue = { ...(currentQ.value || {}), ...currentAnswers };

  const studentCode = mergedValue.omni_code || "";

  const handleCodeChange = (val) => {
    onAnswerChange(currentQ.questionNumber, { ...currentAnswers, omni_code: val });
  };

  const isProgramming = currentQ.layout?.some(l => l.component === "testCaseBuilder" || l.type === "programming_question") || 
                        course?.type?.toLowerCase().includes("programming");

  const [activeTab, setActiveTab] = useState("description");
  const [bottomTab, setBottomTab] = useState("testcase");

  const unwrapComponentValue = (val) => {
    if (!val || typeof val !== 'object') return val;
    const keys = Object.keys(val);
    if (val.problemStatement || val.testCases || val.testcases || val.question || val.content) return val;
    const componentKey = keys.find(k => k.startsWith('component-'));
    if (componentKey && typeof val[componentKey] === 'object') return val[componentKey];
    return val;
  };
  const qValueFull = unwrapComponentValue(currentQ.value || {});
  // Logic to identify display title and problem statement
  const qValue = mergedValue;
  const displayTitle =
    qValue.title ||
    qValue.problem_title ||
    qValueFull.title ||
    qValueFull.problem_title ||
    currentQ.title ||
    `Question ${currentIdx + 1}`;
  const displayQuestion =
    qValue.problemStatement ||
    qValue.question ||
    qValue.content ||
    qValueFull.problemStatement ||
    qValueFull.question ||
    qValueFull.content ||
    qValueFull.description ||
    currentQ.content ||
    "";
  const questionTestCases = qValueFull.testCases || qValueFull.testcases || currentQ.testcases || [];
  const visibleTestCases = questionTestCases.filter(tc => !tc.hidden);

  useEffect(() => {
    // Always open description/testcase when moving between questions.
    setActiveTab("description");
    setBottomTab("testcase");
  }, [currentIdx]);

  const handleRun = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setTestResults(null);
    setBottomTab("result");
    try {
      const normalizedTcs = visibleTestCases.map(tc => ({
        input: tc.input || tc.input_format || "",
        output: tc.expectedOutput || tc.output || tc.output_format || ""
      }));
      const res = await fetch("http://localhost:5000/api/question-banks/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: studentCode, language, testcases: normalizedTcs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Execution failed");
      setTestResults({ type: 'run', results: data.results });
    } catch (e) {
      setTestResults({ type: 'error', message: e.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (isSubmittingQuestion) return;
    setIsSubmittingQuestion(true);
    setTestResults(null);
    setBottomTab("result");
    try {
      const register_no = localStorage.getItem("register_no");
      const res = await fetch("http://localhost:5000/api/question-banks/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          register_no,
          course_id: course?.id || course?._id,
          booking_id: bookingId, 
          questionNumber: currentQ.questionNumber,
          code: studentCode,
          language
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setTestResults({ type: 'submit', ...data });
    } catch (e) {
      setTestResults({ type: 'error', message: e.message });
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const [submittedQuestions, setSubmittedQuestions] = useState(new Set());

  const mcqComp = currentQ.layout?.find(l => 
    l.component?.toLowerCase().includes('mcq') || 
    l.type?.toLowerCase().includes('mcq') ||
    l.type?.toLowerCase().includes('multiple_choice')
  );
  const textComp = currentQ.layout?.find(l => l.type === 'question_text' || l.type === 'paragraph');
  
  // Keep the resolved MCQ option labels stable per question so clicking does not
  // degrade labels into generic "Option 1..4" placeholders.
  const stableMcqOptionsRef = useRef({});
  const mcqVal = mergedValue[mcqComp?.id] || {};
  const normalizeOptions = (arr) =>
    Array.isArray(arr)
      ? arr
          .map((opt) => (typeof opt === "object" ? (opt.label || opt.text || opt.value) : opt))
          .map((v) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean)
      : [];

  const primaryValueOptions = normalizeOptions(mcqVal?.options);
  const secondaryValueOptions = normalizeOptions(currentQ?.value?.[mcqComp?.id]?.options);
  const rootValueOptions = normalizeOptions(currentQ?.value?.options);
  const nestedTemplateValueOptions = normalizeOptions(qValueFull?.options || qValueFull?.optionLabels);
  const valueOptions =
    primaryValueOptions.length > 0
      ? primaryValueOptions
      : secondaryValueOptions.length > 0
        ? secondaryValueOptions
        : rootValueOptions.length > 0
          ? rootValueOptions
          : nestedTemplateValueOptions;
  const propertyOptions = normalizeOptions(
    mcqComp?.properties?.options || mcqComp?.properties?.optionLabels || mcqComp?.config?.optionLabels || []
  );
  const hasOnlyGenericPropertyOptions =
    propertyOptions.length > 0 && propertyOptions.every((opt) => /^option\s+\d+$/i.test(opt));

  const resolvedMcqOptions =
    valueOptions.length > 0
      ? valueOptions
      : hasOnlyGenericPropertyOptions
        ? []
        : propertyOptions;
  const cachedOptions = stableMcqOptionsRef.current[currentQ.questionNumber] || [];
  const mcqOptions = resolvedMcqOptions.length > 0 ? resolvedMcqOptions : cachedOptions;
  if (resolvedMcqOptions.length > 0 && currentQ.questionNumber != null) {
    stableMcqOptionsRef.current[currentQ.questionNumber] = resolvedMcqOptions;
  }

  // Robust Title Extraction: Prioritize merged value, then placeholder
  const layoutTitle = (typeof mergedValue[textComp?.id] === 'string' 
                        ? mergedValue[textComp.id] 
                        : mergedValue[textComp?.id]?.value) || 
                      textComp?.properties?.placeholder;

  const displayQTitle = layoutTitle || displayTitle;

  const isModernMCQ = !!mcqComp;
  const selectedOptionIdx = currentAnswers[mcqComp?.id] != null ? mcqOptions.indexOf(currentAnswers[mcqComp.id]) : null;

  const handleMCQSelect = (idx) => {
    if (submittedQuestions.has(currentQ.questionNumber)) return;
    const optionsForQuestion =
      mcqOptions.length > 0 ? mcqOptions : stableMcqOptionsRef.current[currentQ.questionNumber] || [];
    const newValue = { ...currentAnswers, [mcqComp.id]: optionsForQuestion[idx] };
    onAnswerChange(currentQ.questionNumber, newValue);
    saveMcqToDB(currentQ.questionNumber, newValue);
  };

  const handleMCQSubmit = () => {
    if (selectedOptionIdx !== null) {
      setSubmittedQuestions(prev => new Set([...prev, currentQ.questionNumber]));
      // No extra DB call needed since it's already auto-saved on click
    }
  };

  const handleMCQReset = () => {
    setSubmittedQuestions(prev => {
      const next = new Set(prev);
      next.delete(currentQ.questionNumber);
      return next;
    });
    const newValue = { ...currentAnswers, [mcqComp.id]: null };
    onAnswerChange(currentQ.questionNumber, newValue);
    saveMcqToDB(currentQ.questionNumber, newValue);
  };

  const saveMcqToDB = async (qNum, val) => {
    try {
      const register_no = localStorage.getItem("register_no");
      await fetch("http://localhost:5000/api/question-banks/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          register_no,
          course_id: course?.id || course?._id,
          booking_id: bookingId,
          questionNumber: qNum,
          value: val
        }),
      });
    } catch (err) {
      console.error("MCQ auto-save failed:", err);
    }
  };

  const [jumpTo, setJumpTo] = useState("");

  const handleJump = () => {
    const num = parseInt(jumpTo);
    if (!isNaN(num) && num > 0 && num <= questions.length) {
      setCurrentIdx(num - 1);
      setJumpTo("");
    }
  };

  return (
    <div className="flex bg-[#f7f8fa] text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden" style={{ height: "100vh", width: "100vw" }}>
      {/* Sidebar */}
      <aside className="w-[250px] border-r border-slate-300 bg-[#f3f3f5] flex flex-col flex-shrink-0 z-20">
        
        <div className="px-5 mb-3">
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar translate-z-0">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
               const isCode = q.layout?.some(l => l.component === 'testCaseBuilder' || l.type === 'programming_question');
               const isActive = currentIdx === idx;
               const isSubmitted = submittedQuestions.has(q.questionNumber);

               return (
                  <button key={idx} onClick={() => { setCurrentIdx(idx); setTestResults(null); }} className={`relative h-9 rounded-sm transition-all font-semibold text-[16px] flex items-center justify-center group ${isActive ? "bg-[#010625] text-white border-2 border-[#0f1430] ring-2 ring-white/90" : isSubmitted ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-[#e4e5e8] border border-[#e0e1e5] text-slate-800 hover:bg-[#dde0e5] hover:border-slate-400"}`}>
                    {idx + 1}
                    {/* <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isCode ? 'bg-emerald-500' : 'bg-[#3b82f6]'} ${isActive ? 'scale-110 ring-2 ring-white/20' : 'opacity-90'}`} /> */}
                  </button>
               );
            })}
          </div>
        </nav>

        <div className="p-4 bg-slate-100 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Time</span><Clock size={12} className="text-slate-400" /></div>
            <div className={`text-lg font-bold tabular-nums transition-colors tracking-tight ${timeLeft < 300 ? "text-rose-500 animate-pulse" : "text-slate-800"}`}>{formatTime(timeLeft)}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#f7f8fa]">

        {isProgramming ? (
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden p-4 bg-[#f3f4f6]">
            <div className="flex flex-col h-full overflow-hidden bg-white rounded-xl border border-slate-200">
                <div className="flex border-b border-slate-200 bg-white rounded-t-xl">
                    <button onClick={() => setActiveTab('description')} className={`px-6 py-3 text-[15px] font-medium transition-all border-b-2 ${activeTab === 'description' ? 'border-black text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Description</button>
                    <button onClick={() => setActiveTab('submissions')} className={`px-6 py-3 text-[15px] font-medium transition-all border-b-2 ${activeTab === 'submissions' ? 'border-black text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Submissions</button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'description' ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">Medium</span>
                            </div>
                            <h2 className="text-[40px] font-semibold text-slate-900 leading-tight">{displayTitle}</h2>
                            <div className="prose prose-slate max-w-none"><p className="text-[17px] text-slate-700 leading-relaxed">{displayQuestion}</p></div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4"><BookOpen size={64} className="opacity-10" /><p className="text-xs font-semibold uppercase opacity-40">No Submissions Yet</p></div>
                    )}
                </div>
            </div>
            <div className="flex flex-col h-full overflow-hidden bg-white rounded-xl border border-slate-200">
                <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-200 bg-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white text-slate-800 border border-slate-300 rounded-md px-3 py-1 text-sm font-medium outline-none">
                            <option value="cpp">C++</option><option value="python">Python</option><option value="java">Java</option><option value="javascript">JavaScript</option>
                        </select>
                    </div>
                    <div className="flex gap-2 text-slate-500"><Play size={14} /><Terminal size={14} /></div>
                </div>
                <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                    <MonacoEditor height="100%" language={language === 'python' ? 'python' : 'cpp'} theme="vs-dark" value={studentCode} onChange={handleCodeChange} options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, padding: { top: 20 } }} />
                </div>
                <div className="h-[220px] flex-shrink-0 flex flex-col border-t border-slate-200 bg-white">
                    <div className="flex border-b border-slate-200 bg-white">
                        <button onClick={() => setBottomTab('testcase')} className={`px-6 py-3 text-[15px] font-medium transition-all border-b-2 ${bottomTab === 'testcase' ? 'text-slate-900 border-black' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>Testcase</button>
                        <button onClick={() => setBottomTab('result')} className={`px-6 py-3 text-[15px] font-medium transition-all border-b-2 ${bottomTab === 'result' ? 'text-slate-900 border-black' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>Test Result</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 custom-scrollbar">
                        {bottomTab === 'testcase' ? (
                            <div className="space-y-4">
                                {visibleTestCases.slice(0, 3).map((tc, i) => (
                                    <div key={i} className="flex gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <span className="text-[10px] font-bold text-white/20 uppercase pt-1">#{i + 1}</span>
                                        <div className="flex-1 truncate"><div className="text-slate-400 text-[10px] uppercase mb-1">Input</div><div className="text-slate-700">{tc.input || tc.input_format}</div></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {!testResults && !isExecuting && !isSubmittingQuestion && <div className="h-full flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold tracking-widest">You must run your code first</div>}
                                {(isExecuting || isSubmittingQuestion) && <div className="h-full flex flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-slate-600" size={24} /><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Compiling...</span></div>}
                                {testResults?.type === 'error' && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs">{testResults.message}</div>}
                                {testResults?.results && (
                                  <div className="space-y-3">
                                     {testResults.type === 'submit' && <div className="text-slate-700 text-[10px] font-bold uppercase mb-4 tracking-widest">Score: {testResults.score}/50</div>}
                                     {testResults.results.map((res, i) => (
                                       <div key={i} className={`p-4 rounded-xl border ${res.passed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                                         <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-slate-500 uppercase">Case #{i + 1}</span><div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${res.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{res.passed ? 'Passed' : 'Failed'}</div></div>
                                         <div className="grid grid-cols-2 gap-4 text-[11px]"><div className="opacity-60">Expected: {res.expected}</div><div className={res.passed ? 'text-emerald-600' : 'text-rose-600'}>Actual: {res.actual || 'No output'}</div></div>
                                       </div>
                                     ))}
                                  </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="h-[64px] flex-shrink-0 flex items-center justify-between px-6 border-t border-slate-200 bg-white rounded-b-xl">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-base font-medium"><Terminal size={16} /> Console</button>
                    <div className="flex gap-3">
                        <button onClick={handleRun} disabled={isExecuting} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-semibold text-sm transition-all disabled:opacity-50">Run</button>
                        <button onClick={handleSubmitQuestion} disabled={isSubmittingQuestion} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50">Submit</button>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-10 pt-8 scroll-smooth custom-scrollbar bg-[#f7f8fa]">
            <div className="max-w-3xl mx-auto w-full pb-12">
                <div className="mb-7 border-t border-slate-200 pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                      <span className="rounded-full bg-[#f8f1d5] px-3 py-1 text-sm text-[#8b7a2d]">Medium</span>
                      <span className="rounded-full bg-[#e8f0ff] px-3 py-1 text-sm text-[#5a78a8]">MCQ</span>
                    </div>

                    <div>
                      <h2 className="mb-6 text-[22px] font-semibold leading-tight text-slate-900">
                        {displayQTitle || `Question ${currentIdx + 1}`}
                      </h2>

                      <div className="min-h-[290px]">
                        {isModernMCQ ? (
                          <div className="space-y-3">
                            {(mcqOptions.length ? mcqOptions : Array.from({ length: 4 }, (_, i) => `Option ${i + 1}`)).map((opt, idx) => {
                              const isSelected = selectedOptionIdx === idx;
                              const isSubmittedForCurrent = submittedQuestions.has(currentQ.questionNumber);
                              const optionLabel = ["A", "B", "C", "D", "E", "F"][idx] || String(idx + 1);
                              return (
                                <button
                                  key={`${currentQ.questionNumber}-${idx}`}
                                  type="button"
                                  onClick={() => !isSubmittedForCurrent && handleMCQSelect(idx)}
                                  disabled={isSubmittedForCurrent}
                                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                                    isSelected
                                      ? "border-[#020726] bg-[#eef2ff]"
                                      : "border-[#e5e7eb] bg-white hover:border-slate-400 hover:bg-slate-50"
                                  } ${isSubmittedForCurrent ? "cursor-not-allowed opacity-70" : ""}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                                        isSelected ? "border-[#020726] bg-[#020726]" : "border-slate-300"
                                      }`}
                                    >
                                      {isSelected && <span className="h-3 w-3 rounded-full bg-white" />}
                                    </span>
                                    <span className="rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-500">
                                      {optionLabel}
                                    </span>
                                    <span className="text-[22px] text-slate-800">{opt}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <TemplateQuestionForm
                            templateId={currentQ.template_id}
                            layout={currentQ.layout}
                            value={mergedValue}
                            onChange={(val) => {
                              onAnswerChange(currentQ.questionNumber, val);
                              // Auto-save template changes to DB
                              saveMcqToDB(currentQ.questionNumber, val);
                            }}
                            studentMode={true}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      {!submittedQuestions.has(currentQ.questionNumber) ? (
                        <button
                          type="button"
                          onClick={handleMCQSubmit}
                          disabled={selectedOptionIdx === null}
                          className="rounded-lg bg-[#858a98] px-6 py-2 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Submit
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleMCQReset}
                            className="rounded-lg bg-slate-200 px-6 py-2 text-slate-800 transition-opacity hover:opacity-90"
                          >
                            Reset Answer
                          </button>
                          <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-700">
                            <CheckCircle size={18} />
                            Answer Submitted
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-5 flex items-center justify-between">
                    <button
                      disabled={currentIdx === 0}
                      onClick={() => {
                        setCurrentIdx((prev) => prev - 1);
                        setTestResults(null);
                      }}
                      className="rounded-lg border border-slate-200 bg-[#f2f3f5] px-6 py-2 text-[14px] text-slate-400 disabled:opacity-60"
                    >
                      Previous
                    </button>
                    <button
                      onClick={
                        currentIdx === questions.length - 1
                          ? onSubmitAttempt
                          : () => {
                              setCurrentIdx((prev) => prev + 1);
                              setTestResults(null);
                            }
                      }
                      className="rounded-lg bg-[#020726] px-7 py-2 text-[14px] font-semibold text-white hover:bg-[#00031c]"
                    >
                      {currentIdx === questions.length - 1 ? "Submit" : "Next"}
                    </button>
                </div>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e2e8f0;
        }
      ` }} />
    </div>
  );
}
