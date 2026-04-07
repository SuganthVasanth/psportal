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

  // Logic to identify display title and problem statement
  const qValue = mergedValue; // Use merged value for all display extraction
  const displayTitle = qValue.title || qValue.problem_title || currentQ.title || `Question ${currentIdx + 1}`;
  const displayQuestion = qValue.problemStatement || qValue.question || qValue.content || "";

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
  const questionTestCases = qValueFull.testCases || qValueFull.testcases || currentQ.testcases || [];
  const visibleTestCases = questionTestCases.filter(tc => !tc.hidden);

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
  
  // Smarter Option Extraction: Check properties FIRST, then look in the merged value for injected options
  const mcqVal = mergedValue[mcqComp?.id] || {};
  const rawOptions = mcqComp?.properties?.options || 
                     mcqComp?.properties?.optionLabels || 
                     mcqComp?.config?.optionLabels || 
                     mcqVal.options || 
                     [];
                     
  const mcqOptions = Array.isArray(rawOptions) 
    ? rawOptions.map(opt => (typeof opt === 'object' ? (opt.label || opt.text || opt.value) : opt)).filter(Boolean)
    : [];

  // Robust Title Extraction: Prioritize merged value, then placeholder
  const layoutTitle = (typeof mergedValue[textComp?.id] === 'string' 
                        ? mergedValue[textComp.id] 
                        : mergedValue[textComp?.id]?.value) || 
                      textComp?.properties?.placeholder;

  const displayQTitle = layoutTitle || displayTitle;

  const isModernMCQ = !!mcqComp && mcqOptions.length > 0;
  const selectedOptionIdx = currentAnswers[mcqComp?.id] != null ? mcqOptions.indexOf(currentAnswers[mcqComp.id]) : null;

  const handleMCQSelect = (idx) => {
    if (submittedQuestions.has(currentQ.questionNumber)) return;
    const newValue = { ...currentAnswers, [mcqComp.id]: mcqOptions[idx] };
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
    <div className="flex bg-white text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden" style={{ height: "100vh", width: "100vw" }}>
      {/* Sidebar */}
      <aside className="w-[300px] border-r border-slate-100 bg-[#fbfcfd] flex flex-col flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Assessment</h1>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-lg border border-slate-200/50">
             <div className="p-1 px-1.5"><Monitor size={14} className="text-slate-400" /></div>
             <div className="p-1 px-1.5 bg-white border border-slate-200 rounded-md shadow-sm"><Clock size={14} className="text-slate-900" /></div>
          </div>
        </div>
        
        {/* <div className="px-8 mb-6">
           <div className="flex items-center gap-2">
              <input type="text" placeholder="Jump to #" value={jumpTo} onChange={(e) => setJumpTo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleJump()} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300" />
              <button onClick={handleJump} className="bg-slate-500 hover:bg-slate-600 active:scale-95 transition-all text-white rounded-xl px-5 py-2 text-xs font-black shadow-lg shadow-slate-100">Go</button>
           </div>
           
           <div className="flex items-center gap-4 mt-4 px-1">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MCQ</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</span></div>
           </div>
        </div> */}

        <nav className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar translate-z-0">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
               const isCode = q.layout?.some(l => l.component === 'testCaseBuilder' || l.type === 'programming_question');
               const isActive = currentIdx === idx;
               const isSubmitted = submittedQuestions.has(q.questionNumber);

               return (
                  <button key={idx} onClick={() => { setCurrentIdx(idx); setTestResults(null); }} className={`relative h-11 rounded-xl transition-all font-black text-xs flex items-center justify-center group ${isActive ? "bg-slate-900 text-white shadow-xl scale-105 z-10" : isSubmitted ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200"}`}>
                    {idx + 1}
                    <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isCode ? 'bg-emerald-500' : 'bg-indigo-500'} ${isActive ? 'scale-150 ring-2 ring-white/30' : 'opacity-40 group-hover:opacity-100'}`} />
                  </button>
               );
            })}
          </div>
        </nav>

        <div className="p-8 bg-slate-50/80 border-t border-slate-200/50">
            <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Time</span><Clock size={14} className="text-slate-300" /></div>
            <div className={`text-3xl font-black tabular-nums transition-colors tracking-tighter ${timeLeft < 300 ? "text-rose-500 animate-pulse" : "text-slate-900"}`}>{formatTime(timeLeft)}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-white">
        <header className="h-16 flex-shrink-0 px-10 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-300 hover:text-slate-900 transition-colors active:scale-95"><ChevronLeft size={22} /></button>
                <div className="h-6 w-px bg-slate-100 mx-1" />
                <h2 className="text-[15px] font-black text-slate-900 tracking-tight truncate max-w-[400px]">{course?.name || "Skill Assessment"}</h2>
            </div>
            <div className="flex items-center gap-4">
                {tabSwitchCount > 0 && <div className="px-3 py-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[10px] font-black tracking-widest uppercase">Warnings: {tabSwitchCount}</div>}
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-900 font-black text-xs">SV</div>
            </div>
        </header>

        {isProgramming ? (
          <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
            <div className="flex flex-col border-r border-slate-100 h-full overflow-hidden bg-white">
                <div className="flex border-b border-slate-100 bg-slate-50/30">
                    <button onClick={() => setActiveTab('description')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'description' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Description</button>
                    <button onClick={() => setActiveTab('submissions')} className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'submissions' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Submissions</button>
                </div>
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {activeTab === 'description' ? (
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100/50 shadow-sm">Medium</span>
                                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">Coding</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{displayTitle}</h2>
                            <div className="prose prose-slate max-w-none"><p className="text-[17px] text-slate-600 leading-relaxed font-bold opacity-80">{displayQuestion}</p></div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4"><BookOpen size={64} className="opacity-10" /><p className="text-xs font-black tracking-widest uppercase opacity-30">No Submissions Yet</p></div>
                    )}
                </div>
            </div>
            <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
                <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-[#252525]">
                    <div className="flex items-center gap-3">
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-[#1e1e1e] text-white border border-white/10 rounded px-3 py-1 text-[11px] font-bold outline-none uppercase tracking-widest">
                            <option value="cpp">C++</option><option value="python">Python</option><option value="java">Java</option><option value="javascript">JavaScript</option>
                        </select>
                    </div>
                    <div className="flex gap-2 text-white/40"><Play size={14} /><Terminal size={14} /></div>
                </div>
                <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                    <MonacoEditor height="100%" language={language === 'python' ? 'python' : 'cpp'} theme="vs-dark" value={studentCode} onChange={handleCodeChange} options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, padding: { top: 20 } }} />
                </div>
                <div className="h-[240px] flex-shrink-0 flex flex-col border-t border-white/5 bg-[#252525]">
                    <div className="flex border-b border-white/5 bg-[#1e1e1e]/50">
                        <button onClick={() => setBottomTab('testcase')} className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${bottomTab === 'testcase' ? 'text-white border-b-2 border-indigo-500' : 'text-white/40 hover:text-white/60 border-transparent'}`}>Testcases</button>
                        <button onClick={() => setBottomTab('result')} className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${bottomTab === 'result' ? 'text-white border-b-2 border-indigo-500' : 'text-white/40 hover:text-white/60 border-transparent'}`}>Results</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] text-white/80 custom-scrollbar">
                        {bottomTab === 'testcase' ? (
                            <div className="space-y-4">
                                {visibleTestCases.slice(0, 3).map((tc, i) => (
                                    <div key={i} className="flex gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <span className="text-[10px] font-bold text-white/20 uppercase pt-1">#{i + 1}</span>
                                        <div className="flex-1 truncate"><div className="text-white/30 text-[10px] uppercase mb-1">Input</div><div className="text-emerald-400">{tc.input || tc.input_format}</div></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                {!testResults && !isExecuting && !isSubmittingQuestion && <div className="h-full flex items-center justify-center text-white/10 text-[10px] uppercase font-bold tracking-widest">Execute code to see results</div>}
                                {(isExecuting || isSubmittingQuestion) && <div className="h-full flex flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-indigo-400" size={24} /><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Compiling...</span></div>}
                                {testResults?.type === 'error' && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs">{testResults.message}</div>}
                                {testResults?.results && (
                                  <div className="space-y-3">
                                     {testResults.type === 'submit' && <div className="text-indigo-400 text-[10px] font-bold uppercase mb-4 tracking-widest">Score: {testResults.score}/50</div>}
                                     {testResults.results.map((res, i) => (
                                       <div key={i} className={`p-4 rounded-xl border ${res.passed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                                         <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-white/40 uppercase">Case #{i + 1}</span><div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${res.passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{res.passed ? 'Passed' : 'Failed'}</div></div>
                                         <div className="grid grid-cols-2 gap-4 text-[11px]"><div className="opacity-40">Expected: {res.expected}</div><div className={res.passed ? 'text-emerald-400' : 'text-rose-400'}>Actual: {res.actual || 'No output'}</div></div>
                                       </div>
                                     ))}
                                  </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="h-[64px] flex-shrink-0 flex items-center justify-between px-6 border-t border-white/5 bg-[#1e1e1e]">
                    <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-widest"><Terminal size={14} /> Console</button>
                    <div className="flex gap-3">
                        <button onClick={handleRun} disabled={isExecuting} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-bold text-xs transition-all disabled:opacity-50">Run</button>
                        <button onClick={handleSubmitQuestion} disabled={isSubmittingQuestion} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50">Submit</button>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-16 pt-20 scroll-smooth custom-scrollbar bg-white">
            <div className="max-w-4xl mx-auto w-full pb-32">
                {/* <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-100">
                    <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100/50 shadow-sm">Medium</span>
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">MCQ</span>
                </div> */}
                
                <div className="mb-12">
                   <h2 className="text-[32px] font-black text-slate-900 leading-[1.1] tracking-tight mb-12">{displayQTitle || `Question ${currentIdx + 1}`}</h2>
                   <div className="min-h-[400px]">
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
                   </div>
                </div>

                <div className="flex flex-col gap-6 pt-10 mt-10 border-t border-slate-100">
                    <div className="flex items-center justify-between pt-10 border-t border-slate-50 mt-4">
                        <button disabled={currentIdx === 0} onClick={() => { setCurrentIdx(prev => prev - 1); setTestResults(null); }} className="px-12 py-4 rounded-2xl text-slate-400 font-black text-sm uppercase tracking-widest bg-transparent hover:bg-slate-50 transition-all disabled:opacity-0 active:scale-95">Previous</button>
                        <button onClick={currentIdx === questions.length - 1 ? onSubmitAttempt : () => { setCurrentIdx(prev => prev + 1); setTestResults(null); }} className={`px-14 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all ${currentIdx === questions.length - 1 ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-slate-900 hover:bg-black shadow-slate-300'}`}>{currentIdx === questions.length - 1 ? 'Finish Attempt' : 'Next'}</button>
                    </div>
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
