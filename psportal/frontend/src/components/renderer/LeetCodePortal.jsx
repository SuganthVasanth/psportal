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
  BookOpen
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

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(h.toString().padStart(2, "0"));
    parts.push(m.toString().padStart(2, "0"));
    parts.push(s.toString().padStart(2, "0"));
    return parts.join(":");
  };

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

  // We use 'omni_code' as the standard key for the portal's integrated editor
  const studentCode = currentAnswers.omni_code || "";

  const handleCodeChange = (val) => {
    onAnswerChange(currentQ.questionNumber, {
      ...currentAnswers,
      omni_code: val
    });
  };

  const studentName = localStorage.getItem("userName") || "Student";
  const registerNo = localStorage.getItem("register_no") || "N/A";

  // DYNAMIC METADATA EXTRACTION
  const qValue = currentQ.value || {};
  const displayTitle = qValue.title || qValue.problem_title || currentQ.title || course?.course_name || course?.title || "Assessment Challenge";
  const displayRef = qValue.ref || qValue.problem_id || "REF-001";
  
  // Normalizing tags
  const rawTags = qValue.tags || ["Programming", "Logic"];
  const tagsArray = Array.isArray(rawTags)
    ? rawTags
    : String(rawTags).split(",").map(t => t.trim()).filter(Boolean);

  // 🚀 SUPER SCRAPER: Aggressively find ANY usable content in the question object
  const scrapedContent = useMemo(() => {
    const data = {
      title: displayTitle,
      body: "",
      explanation: "",
      samples: { input: qValue.sample_input || "", output: qValue.sample_output || "" }
    };

    const allStrings = [];
    
    // 1. Scrape qValue (User/Faculty inputs)
    const crawl = (obj) => {
      if (!obj) return;
      Object.values(obj).forEach(val => {
        if (typeof val === 'string' && val.length > 10) allStrings.push(val);
        else if (typeof val === 'object') crawl(val);
      });
    };
    crawl(qValue);

    // 2. Scrape layout properties (Static text)
    if (currentQ.layout) {
      currentQ.layout.forEach(c => {
        if (c.properties) {
          const text = c.properties.text || c.properties.content || c.properties.value;
          if (typeof text === 'string' && text.length > 10) allStrings.push(text);
          
          // Special check for samples
          const label = (c.properties.label || "").toLowerCase();
          if (label.includes("sample index") || label.includes("input")) data.samples.input = text;
          if (label.includes("output")) data.samples.output = text;
        }
      });
    }

    // 3. Deduplicate and Sort by length
    const uniqueStrings = [...new Set(allStrings)].sort((a, b) => b.length - a.length);

    // 4. Heuristic Assignment
    if (uniqueStrings.length > 0) {
      // If the longest string isn't already the title, it's the BODY
      if (uniqueStrings[0] !== data.title) {
         data.body = uniqueStrings[0];
         // Second longest is likely explanation or logic
         if (uniqueStrings[1] && uniqueStrings[1] !== data.title) {
            data.explanation = uniqueStrings[1];
         }
      } else if (uniqueStrings[1]) {
         data.body = uniqueStrings[1];
         if (uniqueStrings[2]) data.explanation = uniqueStrings[2];
      }
    }

    // Final overrides if explicit keys exist
    if (qValue.explanation || qValue.logic) data.explanation = qValue.explanation || qValue.logic;
    if (qValue.question || qValue.problem_statement) data.body = qValue.question || qValue.problem_statement;
    
    return data;
  }, [currentQ, qValue, displayTitle, currentIdx]);

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

      {/* PREMIUM HEADER */}
      <header className="h-16 flex-shrink-0 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          {/* BACK BUTTON */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
            <span className="text-xs font-black uppercase tracking-widest pt-0.5">Exit Portal</span>
          </button>
        </div>

        {/* QUESTION SELECTOR (CENTERED) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-slate-50/80 p-1 rounded-2xl border border-slate-100 shadow-sm">
          {questions.slice(0, 2).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                currentIdx === idx 
                ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Question {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-5 ml-4">
          {/* FINISH TEST BUTTON */}
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to finish the assessment? This will submit all your answers.")) {
                onSubmitAttempt();
              }
            }}
            disabled={submitting}
            className="flex items-center gap-3 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl shadow-lg shadow-rose-100 transition-all active:scale-95 group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Final Submission</span>
              <span className="text-[13px] font-black leading-none">Finish Test</span>
            </div>
            <Send size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="w-[1px] h-8 bg-slate-100 mx-2"></div>

          {/* NOTIFICATIONS */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* USER AVATAR */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-100">
              SR
            </div>
          </div>
        </div>
      </header>

      <main ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANE - Problem Description */}
        <section style={{ width: `${leftWidth}%` }} className="flex flex-col border-r border-slate-100 h-full overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="px-12 pt-12 pb-6">
            {/* HEADER REMOVED PER USER REQUEST */}
            {/* TABS INDICATOR */}
            <div className="px-12 flex gap-12 border-b border-slate-50 pb-0 mb-8">
              <button className="relative pb-4 text-[11px] font-black text-indigo-600 uppercase tracking-widest transition-all">
                Description
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-indigo-500 rounded-full"></div>
              </button>
              <button className="pb-4 text-[11px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-400 transition-all">
                Sample Registry
              </button>
            </div>

            {/* CLEAN PROBLEM CONTENT */}
            <div className="px-10 pb-16 space-y-12">
               
               {/* 1. PROBLEM CARD */}
               <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:border-indigo-100 transition-all group">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50/50 px-3 py-1 rounded-lg">Problem</span>
                  </div>
                  <h2 className="text-[22px] font-black text-slate-800 mb-4 tracking-tight leading-snug">
                    {displayTitle}
                  </h2>
                  <div className="space-y-4">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Question</span>
                    <p className="text-[15px] leading-relaxed text-slate-600 font-medium">
                      {displayQuestion}
                    </p>
                  </div>
               </div>

               {/* 2. EXPLANATION / LOGIC */}
               {displayExplanation && (
                 <div className="bg-slate-50/30 rounded-3xl border border-slate-100 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Explanation</span>
                    </div>
                    <div className="space-y-4 text-[14px] leading-relaxed text-slate-600 font-bold tracking-tight">
                       {displayExplanation}
                    </div>
                 </div>
               )}

               {/* 3. SAMPLE INPUT/OUTPUT */}
               {(displaySamples.input || displaySamples.output) && (
                 <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-md shadow-slate-200/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {displaySamples.input && (
                         <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sample Input</span>
                            <div className="bg-slate-50 rounded-2xl p-6 font-mono text-[13px] text-indigo-600 border border-slate-100/50">
                               <pre className="whitespace-pre-wrap">{displaySamples.input}</pre>
                            </div>
                         </div>
                       )}
                       {displaySamples.output && (
                         <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sample Output</span>
                            <div className="bg-indigo-50/30 rounded-2xl p-6 font-mono text-[13px] text-indigo-700 border border-indigo-100/30">
                               <pre className="whitespace-pre-wrap">{displaySamples.output}</pre>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {/* 4. PUBLIC TEST CASES */}
               {currentQ.testcases && currentQ.testcases.length > 0 && (
                  <div className="space-y-6">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Sample Test Cases</span>
                     <div className="grid grid-cols-1 gap-4">
                        {currentQ.testcases.map((tc, idx) => (
                           <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 hover:shadow-md transition-all group flex flex-col gap-4">
                              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Case #{idx + 1}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Input format: 3</span>
                                    <div className="text-[12px] font-bold text-slate-600 font-mono italic">
                                       {tc.input_format || "1 2 3"}
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Output format: 6</span>
                                    <div className="text-[12px] font-bold text-indigo-500 font-mono italic">
                                       {tc.output_format || "6"}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>
          </div>
        </div>
      </section>

        {/* HORIZONTAL DRAGGER */}
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-indigo-500/30 bg-slate-50 z-10 transition-colors border-r border-slate-200 group"
          onMouseDown={(e) => { e.preventDefault(); isDraggingLeft.current = true; document.body.style.cursor = "col-resize"; }}
        >
          <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <div className="w-[1px] h-8 bg-indigo-400"></div>
          </div>
        </div>

        {/* RIGHT PANE - Editor & Console */}
        <div ref={rightPaneRef} style={{ width: `${100 - leftWidth}%` }} className="flex flex-col h-full overflow-hidden">

          {/* TOP COMPONENT - Monaco Editor */}
          <div style={{ height: `${topHeight}%` }} className="flex flex-col overflow-hidden bg-white mt-1.5 mr-1.5 rounded-2xl border border-slate-100 shadow-sm relative">
            <div className="bg-white px-8 py-5 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-12">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Environment</span>
                  <div className="relative group">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-6 py-2 cursor-pointer hover:border-indigo-400 transition-all outline-none text-[12px] font-black min-w-[100px] appearance-none pr-10 shadow-sm"
                    >
                      <option value="c">C</option>
                      <option value="cpp">C++</option>
                      <option value="python">PYTHON</option>
                      <option value="java">JAVA</option>
                      <option value="javascript">JAVASCRIPT</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full bg-[#1e1e1e]">
              <MonacoEditor
                height="100%"
                theme="vs-dark"
                language={language === "c" || language === "cpp" ? "cpp" : language}
                value={studentCode}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  fontWeight: "500",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  roundedSelection: true,
                  padding: { top: 24, bottom: 24 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  cursorStyle: "line",
                  smoothScrolling: true,
                  automaticLayout: true,
                  scrollbar: {
                    vertical: 'hidden',
                    horizontal: 'hidden'
                  }
                }}
              />
            </div>
          </div>

          {/* VERTICAL DRAGGER */}
          <div
            className="h-1 shrink-0 cursor-row-resize hover:bg-indigo-500/30 bg-slate-50 z-10 border-y border-slate-200 transition-colors group"
            onMouseDown={(e) => { e.preventDefault(); isDraggingTop.current = true; document.body.style.cursor = "row-resize"; }}
          >
            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <div className="w-8 h-[1px] bg-indigo-400"></div>
            </div>
          </div>

          {/* BOTTOM COMPONENT - Testcases / Console */}
          <div style={{ height: `${100 - topHeight}%` }} className="flex flex-col overflow-hidden bg-white mb-1.5 mr-1.5 mt-1.5 rounded-2xl border border-slate-100 shadow-sm relative">
            
            {/* INTEGRATED ACTION BAR */}
            <div className="px-6 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tabSwitchCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {tabSwitchCount > 0 ? `Alert: ${tabSwitchCount} Tab Switches` : "System Status: Stable"}
                  </span>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => alert("Initializing code execution environment...")}
                   className="bg-white hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all border border-slate-200 shadow-sm active:scale-95 flex items-center gap-2"
                 >
                   <Play size={10} fill="currentColor" /> Run
                 </button>
                 <button 
                   onClick={onSubmitAttempt}
                   disabled={submitting}
                   className={`bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-200/50 ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                 >
                   <Send size={10} fill="currentColor" /> {submitting ? "Submitting..." : "Submit"}
                 </button>
               </div>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* STANDARD INPUT */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-slate-50">
                <div className="px-6 py-4 border-b border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                    Standard Input
                  </span>
                </div>
                <div className="flex-1 p-0 overflow-hidden">
                  <textarea
                    value={standardInput}
                    onChange={(e) => setStandardInput(e.target.value)}
                    className="w-full h-full bg-transparent p-6 text-[13px] font-semibold text-slate-400 outline-none resize-none placeholder:text-slate-200"
                    placeholder="Type input parameters here..."
                  />
                </div>
              </div>

              {/* CONSOLE OUTPUT */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#fcfdfe]">
                <div className="px-6 py-4 border-b border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">
                    Console Output
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                  <div className="flex flex-col items-center gap-4 text-slate-200">
                    <Terminal size={48} strokeWidth={1} className="opacity-40" />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        Output Pipeline Empty
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
