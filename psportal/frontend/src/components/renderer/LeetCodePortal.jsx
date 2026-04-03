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
  ChevronRight,
  ExternalLink,
  Search,
  Bell,
  Info,
  BookOpen,
  Loader2
} from "lucide-react";
import TemplateQuestionForm from "./TemplateQuestionForm";

export default function LeetCodePortal({
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
  const containerRef = useRef(null);
  const rightPaneRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(40); // percentage
  const [topHeight, setTopHeight] = useState(65); // percentage for right pane vertical split
  const [timeLeft, setTimeLeft] = useState(null);
  const isDraggingLeft = useRef(false);
  const isDraggingTop = useRef(false);
  
  // Evaluation States
  const [testResults, setTestResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // SESSION PERSISTENCE KEYS
  const sessionKey = course ? `portal_ui_${course.id || course?._id}_${localStorage.getItem("register_no") || "anon"}` : null;

  const [currentIdx, setCurrentIdx] = useState(() => {
    if (!sessionKey) return 0;
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        return JSON.parse(saved).currentIdx || 0;
      } catch (e) { return 0; }
    }
    return 0;
  });

  const [language, setLanguage] = useState(() => {
    if (!sessionKey) return "c";
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        return JSON.parse(saved).language || "c";
      } catch (e) { return "c"; }
    }
    return "c";
  });

  const [standardInput, setStandardInput] = useState(() => {
    if (!sessionKey) return "";
    const saved = localStorage.getItem(sessionKey);
    if (saved) {
      try {
        return JSON.parse(saved).standardInput || "";
      } catch (e) { return ""; }
    }
    return "";
  });

  // Sync session state to localStorage
  useEffect(() => {
    if (!sessionKey) return;
    const sessionData = { currentIdx, language, standardInput };
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  }, [currentIdx, language, standardInput, sessionKey]);

  useEffect(() => {
    if (!assessmentEndTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(assessmentEndTime).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(timer);
        // Auto-submit when time is up
        onSubmitAttempt();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [assessmentEndTime, onSubmitAttempt]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLeft.current) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
      }
      if (isDraggingTop.current && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newHeight > 20 && newHeight < 80) setTopHeight(newHeight);
      }
    };
    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingTop.current = false;
      document.body.style.cursor = "default";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const currentQ = questions[currentIdx] || questions[0] || {};
  const currentAnswers = answers[currentQ.questionNumber] || {};
  const studentCode = currentAnswers.omni_code || "";

  const handleCodeChange = (val) => {
    onAnswerChange(currentQ.questionNumber, {
      ...currentAnswers,
      omni_code: val
    });
  };

  const handleRun = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setTestResults(null);
    try {
      // Get testcases from the question value (unwrap component key if needed)
      const rv = currentQ.value || {};
      const componentKey = Object.keys(rv).find(k => k.startsWith('component-'));
      const innerVal = (componentKey && typeof rv[componentKey] === 'object') ? rv[componentKey] : rv;
      const rawTestCases = innerVal.testCases || innerVal.testcases || [];
      // Only run against visible (non-hidden) test cases for the "Run" button
      const visibleTcs = rawTestCases.filter(tc => !tc.hidden);
      // Normalize field names for the backend (backend expects input/output)
      const normalizedTcs = visibleTcs.map(tc => ({
        input: tc.input || tc.input_format || "",
        output: tc.expectedOutput || tc.output || tc.output_format || ""
      }));
      
      const res = await fetch("http://localhost:5000/api/question-banks/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: studentCode,
          language,
          testcases: normalizedTcs
        }),
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
    try {
      const register_no = localStorage.getItem("register_no");
      const course_id = course?.id || course?._id;
      
      const res = await fetch("http://localhost:5000/api/question-banks/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          register_no,
          course_id,
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

  const studentName = localStorage.getItem("userName") || "Student";
  const registerNo = localStorage.getItem("register_no") || "N/A";

  const rawQValue = currentQ.value || {};
  
  // Unwrap template component wrapper: value may be { "component-xxxxx": { problemStatement, testCases } }
  // Find the inner data by checking if the value has component-* keys
  const unwrapComponentValue = (val) => {
    if (!val || typeof val !== 'object') return val;
    const keys = Object.keys(val);
    // If there's a direct problemStatement or testCases, no unwrap needed
    if (val.problemStatement || val.testCases || val.testcases || val.question || val.content) return val;
    // Check for component-* key wrappers
    const componentKey = keys.find(k => k.startsWith('component-'));
    if (componentKey && typeof val[componentKey] === 'object') {
      return val[componentKey];
    }
    return val;
  };
  const qValue = unwrapComponentValue(rawQValue);
  
  // Extract question data — programming questions use: problemStatement, testCases, referenceSolution
  // Also support legacy field names: title, question, problem_statement, sample_input, sample_output, explanation
  const displayTitle = qValue.title || qValue.problem_title || currentQ.title || course?.course_name || course?.title || "Assessment Challenge";
  
  // Get testcases from the question value (ProgrammingQuestion stores them as testCases in the value)
  const questionTestCases = qValue.testCases || qValue.testcases || currentQ.testcases || [];
  // Only show visible (non-hidden) testcases to the student
  const visibleTestCases = questionTestCases.filter(tc => !tc.hidden);

  const scrapedContent = useMemo(() => {
    const data = {
      title: displayTitle,
      body: "",
      explanation: "",
      samples: { input: "", output: "" }
    };

    // 1. Direct field extraction (highest priority)
    // ProgrammingQuestion uses "problemStatement"
    if (qValue.problemStatement) {
      data.body = qValue.problemStatement;
    } else if (qValue.question) {
      data.body = qValue.question;
    } else if (qValue.problem_statement) {
      data.body = qValue.problem_statement;
    } else if (qValue.content) {
      data.body = qValue.content;
    } else if (qValue.description) {
      data.body = qValue.description;
    }

    // 2. Explanation
    if (qValue.explanation) {
      data.explanation = qValue.explanation;
    } else if (qValue.logic) {
      data.explanation = qValue.logic;
    }

    // 3. Sample I/O — extract from first visible testcase if no dedicated fields
    if (qValue.sample_input || qValue.sample_output) {
      data.samples.input = qValue.sample_input || "";
      data.samples.output = qValue.sample_output || "";
    } else if (visibleTestCases.length > 0) {
      data.samples.input = visibleTestCases[0].input || visibleTestCases[0].input_format || "";
      data.samples.output = visibleTestCases[0].expectedOutput || visibleTestCases[0].output || visibleTestCases[0].output_format || "";
    }

    // 4. Layout-based extraction (for template-rendered questions)
    if (!data.body && currentQ.layout) {
      currentQ.layout.forEach(c => {
        if (c.properties) {
          const text = c.properties.text || c.properties.content || c.properties.value;
          if (typeof text === 'string' && text.length > 10 && !data.body) {
            data.body = text;
          }
          const label = (c.properties.label || "").toLowerCase();
          if (label.includes("input") && !data.samples.input) data.samples.input = text;
          if (label.includes("output") && !data.samples.output) data.samples.output = text;
        }
      });
    }

    return data;
  }, [currentQ, qValue, displayTitle, visibleTestCases]);

  const displayQuestion = scrapedContent.body || "Analyze the problem requirements and implement an efficient solution in the editor.";
  const displayExplanation = scrapedContent.explanation || "";
  const displaySamples = scrapedContent.samples;

  if (!questions || questions.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
         <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm animate-pulse">
            <BookOpen size={24} className="text-indigo-400" />
         </div>
         <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Syncing Assessment Environment...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#f8fafc] text-slate-900 overflow-hidden" style={{ height: "100vh" }}>
      <header className="h-16 flex-shrink-0 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="flex items-center gap-2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all">
            <ArrowLeft size={20} />
            <span className="text-xs font-black uppercase tracking-widest pt-0.5">Exit Portal</span>
          </button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-slate-50/80 p-1 rounded-2xl border border-slate-100 shadow-sm">
          {questions.map((_, idx) => (
            <button key={idx} onClick={() => { setCurrentIdx(idx); setTestResults(null); }} className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentIdx === idx ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}>
              Question {idx + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5 ml-4">
          <button onClick={() => { if (window.confirm("Finish assessment?")) onSubmitAttempt(); }} disabled={submitting} className="flex items-center gap-3 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-95 group">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Final Submission</span>
              <span className="text-[13px] font-black leading-none">Finish Test</span>
            </div>
            <Send size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <div className="w-[1px] h-8 bg-slate-100 mx-2"></div>
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-100">SR</div>
          </div>
        </div>
      </header>

      <main ref={containerRef} className="flex flex-1 overflow-hidden relative">
        <section style={{ width: `${leftWidth}%` }} className="flex flex-col border-r border-slate-100 h-full overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            <div className="px-12 pt-12 pb-6">
              <div className="flex gap-12 border-b border-slate-50 pb-0 mb-8">
                <button className="relative pb-4 text-[11px] font-black text-indigo-600 uppercase tracking-widest">Description<div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-500 rounded-full"></div></button>
                <button className="pb-4 text-[11px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-400 transition-all">Sample Registry</button>
              </div>
              <div className="px-10 pb-16 space-y-12">
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                   <div className="flex items-center gap-3 mb-5"><span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50/50 px-3 py-1 rounded-lg">Problem</span></div>
                   <h2 className="text-[22px] font-black text-slate-800 mb-4 tracking-tight leading-snug">{displayTitle}</h2>
                   <div className="space-y-4"><span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Question</span><p className="text-[15px] leading-relaxed text-slate-600 font-medium">{displayQuestion}</p></div>
                </div>
                {displayExplanation && (
                  <div className="bg-slate-50/30 rounded-3xl border border-slate-100 p-8 shadow-sm">
                     <div className="flex items-center gap-3 mb-6"><span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Explanation</span></div>
                     <div className="space-y-4 text-[14px] leading-relaxed text-slate-600 font-bold tracking-tight">{displayExplanation}</div>
                  </div>
                )}
                {visibleTestCases.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-md">
                     <div className="flex items-center gap-3 mb-6"><span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sample Test Cases ({visibleTestCases.length})</span></div>
                     <div className="space-y-6">
                       {visibleTestCases.map((tc, idx) => (
                         <div key={idx} className="rounded-2xl border border-slate-100 overflow-hidden">
                           <div className="bg-slate-50/50 px-5 py-2 border-b border-slate-100">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Case #{idx + 1}</span>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                             <div className="p-5 border-r border-slate-50">
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-2">Input</span>
                               <div className="bg-slate-50 rounded-xl p-4 font-mono text-[13px] text-indigo-600"><pre className="whitespace-pre-wrap m-0">{tc.input || tc.input_format || "—"}</pre></div>
                             </div>
                             <div className="p-5">
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-2">Expected Output</span>
                               <div className="bg-indigo-50/30 rounded-xl p-4 font-mono text-[13px] text-indigo-700"><pre className="whitespace-pre-wrap m-0">{tc.expectedOutput || tc.output || tc.output_format || "—"}</pre></div>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
                {visibleTestCases.length === 0 && (displaySamples.input || displaySamples.output) && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-md">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {displaySamples.input && (<div className="space-y-4"><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sample Input</span><div className="bg-slate-50 rounded-2xl p-6 font-mono text-[13px] text-indigo-600"><pre className="whitespace-pre-wrap">{displaySamples.input}</pre></div></div>)}
                        {displaySamples.output && (<div className="space-y-4"><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sample Output</span><div className="bg-indigo-50/30 rounded-2xl p-6 font-mono text-[13px] text-indigo-700"><pre className="whitespace-pre-wrap">{displaySamples.output}</pre></div></div>)}
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="w-1 shrink-0 cursor-col-resize hover:bg-indigo-500/30 bg-slate-50 z-10 border-r border-slate-200" onMouseDown={(e) => { e.preventDefault(); isDraggingLeft.current = true; }}></div>

        <div ref={rightPaneRef} style={{ width: `${100 - leftWidth}%` }} className="flex flex-col h-full overflow-hidden">
          <div style={{ height: `${topHeight}%` }} className="flex flex-col overflow-hidden bg-white mt-1.5 mr-1.5 rounded-2xl border border-slate-100 shadow-sm relative">
            <div className="bg-white px-8 py-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Environment</span>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-6 py-2 outline-none text-[12px] font-black appearance-none pr-10 shadow-sm">
                  <option value="c">C</option><option value="cpp">C++</option><option value="python">PYTHON</option><option value="java">JAVA</option><option value="javascript">JAVASCRIPT</option>
                </select>
              </div>
            </div>
            <div className="flex-1 w-full bg-[#1e1e1e]">
              <MonacoEditor height="100%" theme="vs-dark" language={language === "c" || language === "cpp" ? "cpp" : language} value={studentCode} onChange={handleCodeChange} options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }} />
            </div>
          </div>

          <div className="h-1 shrink-0 cursor-row-resize hover:bg-indigo-500/30 bg-slate-50 z-10 border-y border-slate-200" onMouseDown={(e) => { e.preventDefault(); isDraggingTop.current = true; }}></div>

          <div style={{ height: `${100 - topHeight}%` }} className="flex flex-col overflow-hidden bg-white mb-1.5 mr-1.5 mt-1.5 rounded-2xl border border-slate-100 shadow-sm relative">
            <div className="px-6 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tabSwitchCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tabSwitchCount > 0 ? `Alert: ${tabSwitchCount} Tab Switches` : "System Status: Stable"}</span>
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={handleRun} disabled={isExecuting} className="bg-white hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all border border-slate-200 shadow-sm flex items-center gap-2"><Play size={10} fill="currentColor" /> {isExecuting ? "Running..." : "Run"}</button>
                 <button onClick={handleSubmitQuestion} disabled={isSubmittingQuestion} className={`bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${isSubmittingQuestion ? "opacity-70" : ""}`}><Send size={10} fill="currentColor" /> {isSubmittingQuestion ? "Submitting..." : "Submit"}</button>
               </div>
            </div>

            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col min-w-0 border-r border-slate-50">
                <div className="px-6 py-4 border-b border-slate-50"><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Standard Input</span></div>
                <div className="flex-1 p-0 overflow-hidden"><textarea value={standardInput} onChange={(e) => setStandardInput(e.target.value)} className="w-full h-full bg-transparent p-6 text-[13px] font-semibold text-slate-400 outline-none resize-none" placeholder="Type input here..." /></div>
              </div>
              <div className="flex-1 flex flex-col min-w-0 bg-[#fcfdfe] overflow-y-auto">
                <div className="px-6 py-4 border-b border-slate-50 sticky top-0 bg-[#fcfdfe] z-10"><span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Console Output</span></div>
                <div className="flex-1 p-6">
                  {!testResults && !isExecuting && !isSubmittingQuestion && (<div className="flex flex-col items-center justify-center h-full gap-4 text-slate-200"><Terminal size={48} className="opacity-40" /><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Output Pipeline Empty</span></div>)}
                  {(isExecuting || isSubmittingQuestion) && (<div className="flex flex-col items-center justify-center h-full gap-4"><Loader2 className="animate-spin text-indigo-500" size={32} /><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{isExecuting ? "Executing Code..." : "Evaluating Testcases..."}</span></div>)}
                  {testResults?.type === 'error' && (<div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-mono text-xs">{testResults.message}</div>)}
                  {testResults?.results && (
                    <div className="space-y-4">
                       {testResults.type === 'submit' && (
                         <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-6">
                           <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Evaluation Score</span><span className="text-lg font-black text-indigo-700">{testResults.score}/50</span></div>
                           <div className="w-full h-1.5 bg-indigo-200/50 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(testResults.score / 50) * 100}%` }}></div></div>
                         </div>
                       )}
                       <div className="space-y-2">
                         {testResults.results.map((res, i) => (
                           <div key={i} className={`p-4 rounded-xl border ${res.passed ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                             <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Case #{i + 1}</span><span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${res.passed ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>{res.passed ? 'Passed' : 'Failed'}</span></div>
                             {testResults.type === 'run' && (<div className="grid grid-cols-2 gap-4"><div><div className="text-[8px] font-black text-slate-300 uppercase mb-1">Expected</div><div className="text-[11px] font-mono font-bold text-slate-500">{res.expected}</div></div><div><div className="text-[8px] font-black text-slate-300 uppercase mb-1">Actual</div><div className={`text-[11px] font-mono font-bold ${res.passed ? 'text-emerald-600' : 'text-rose-500'}`}>{res.actual || 'No output'}</div></div></div>)}
                             {res.error && (<div className="mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-rose-500">{res.error}</div>)}
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
