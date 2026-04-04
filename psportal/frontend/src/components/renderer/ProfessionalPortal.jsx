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
  const studentCode = currentAnswers.omni_code || "";

  const handleCodeChange = (val) => {
    onAnswerChange(currentQ.questionNumber, { ...currentAnswers, omni_code: val });
  };

  const isProgramming = currentQ.layout?.some(l => l.component === "testCaseBuilder" || l.type === "programming_question") || 
                        course?.type?.toLowerCase().includes("programming");

  // Logic to identify display title and problem statement
  const qValue = currentQ.value || {};
  const displayTitle = qValue.title || qValue.problem_title || currentQ.title || `Question ${currentIdx + 1}`;
  const displayQuestion = qValue.problemStatement || qValue.question || qValue.content || "";

  const [jumpTo, setJumpTo] = useState("");

  const handleJump = () => {
    const num = parseInt(jumpTo);
    if (!isNaN(num) && num > 0 && num <= questions.length) {
      setCurrentIdx(num - 1);
      setJumpTo("");
    }
  };

  return (
    <div className="flex bg-white text-slate-900 font-sans selection:bg-slate-200" style={{ height: "100vh", width: "100vw" }}>
      {/* Sidebar */}
      <aside className="w-[320px] border-r border-slate-100 bg-[#fcfdfe] flex flex-col flex-shrink-0 z-20">
        <div className="p-8 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assessment</h1>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
             <div className="p-1 px-1.5"><Monitor size={14} className="text-slate-400" /></div>
             <div className="p-1 px-1.5 bg-white border border-slate-200 rounded-md shadow-sm"><CheckCircle size={14} className="text-slate-900" /></div>
          </div>
        </div>

        <div className="px-8 mb-6">
           <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Jump to #" 
                value={jumpTo}
                onChange={(e) => setJumpTo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 outline-none focus:border-slate-400 transition-colors"
              />
              <button 
                onClick={handleJump}
                className="bg-slate-400 hover:bg-slate-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm"
              >
                Go
              </button>
           </div>
        </div>

        <div className="px-8 mb-4 border-b border-slate-100 pb-4">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MCQ</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</span>
              </div>
           </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <div className="grid grid-cols-4 gap-2.5">
            {questions.map((q, idx) => {
               const isCode = q.layout?.some(l => l.component === 'testCaseBuilder');
               const isActive = currentIdx === idx;
               const isAnswered = answers[q.questionNumber] && Object.keys(answers[q.questionNumber]).length > 0;

               return (
                  <button 
                    key={idx}
                    onClick={() => { setCurrentIdx(idx); setTestResults(null); }}
                    className={`relative w-full h-11 rounded-lg transition-all duration-200 font-bold text-xs flex items-center justify-center ${
                      isActive 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                    <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isCode ? 'bg-emerald-500' : 'bg-indigo-500'} ${isActive ? 'scale-125 ring-2 ring-indigo-400/50' : 'opacity-40'}`} />
                    {isActive && (
                       <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-blue-600 shadow-sm" />
                    )}
                  </button>
               );
            })}
          </div>
        </nav>

        <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Assessment Timer</span>
                <Clock size={14} className="text-slate-300" />
            </div>
            <div className={`text-4xl font-black tabular-nums tracking-tighter ${timeLeft < 300 ? "text-rose-500" : "text-slate-800"}`}>
                {formatTime(timeLeft)}
            </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        <header className="h-20 flex-shrink-0 px-12 flex items-center justify-between border-b border-slate-50 relative bg-white z-10">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><ChevronLeft size={20} /></button>
                <div className="h-6 w-px bg-slate-100 mx-2" />
                <h2 className="text-base font-black text-slate-800 tracking-tight">{course?.name || "Skill Assessment"}</h2>
            </div>
            
            <div className="flex items-center gap-6">
                {tabSwitchCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-500">
                        <AlertCircle size={14} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{tabSwitchCount} Warnings</span>
                    </div>
                )}
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-[10px]">SV</div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 pt-16 scroll-smooth custom-scrollbar bg-white">
            <div className="max-w-4xl mx-auto w-full pb-32">
                <div className="flex items-center gap-3 mb-10">
                    <span className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100/50 shadow-sm">Medium</span>
                    <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 shadow-sm">{isProgramming ? "Coding" : "MCQ"}</span>
                </div>

                <div className="mb-10">
                    <h3 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">
                        {displayTitle === `Question ${currentIdx + 1}` ? displayQuestion : displayTitle}
                    </h3>
                </div>

                <div className="min-h-[300px]">
                    {isProgramming ? (
                        <div className="h-[600px] bg-slate-900 rounded-[32px] overflow-hidden border-8 border-slate-900 shadow-2xl relative">
                           <div className="absolute top-4 left-6 z-10 flex items-center gap-4">
                              <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-white/10 hover:bg-white/20 text-white border-none rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none transition-all backdrop-blur-md"
                              >
                                  <option value="cpp">C++</option>
                                  <option value="python">Python</option>
                                  <option value="java">Java</option>
                              </select>
                           </div>
                           <MonacoEditor
                                height="100%"
                                language={language}
                                theme="vs-dark"
                                value={studentCode}
                                onChange={handleCodeChange}
                                options={{ fontSize: 16, fontWeight: 'bold', minimap: { enabled: false } }}
                           />
                        </div>
                    ) : (
                        <TemplateQuestionForm
                            templateId={currentQ.template_id}
                            layout={currentQ.layout}
                            value={{ ...(currentQ.value || {}), ...(answers[currentQ.questionNumber] || {}) }}
                            onChange={(val) => onAnswerChange(currentQ.questionNumber, val)}
                            studentMode={true}
                        />
                    )}
                </div>

                {!isProgramming && (
                    <div className="mt-12">
                        <button 
                            className="px-10 py-3 bg-[#71717a] hover:bg-slate-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-sm active:scale-95"
                            onClick={() => { /* Persist question state ... */ }}
                        >
                            Submit
                        </button>
                    </div>
                )}

                <footer className="mt-12 pt-10 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                        <button 
                            disabled={currentIdx === 0}
                            onClick={() => { setCurrentIdx(prev => prev - 1); setTestResults(null); }}
                            className="px-10 py-3 rounded-xl text-slate-400 font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-0"
                        >
                            Previous
                        </button>
                        
                        <button 
                            onClick={currentIdx === questions.length - 1 ? onSubmitAttempt : () => { setCurrentIdx(prev => prev + 1); setTestResults(null); }}
                            className={`px-12 py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 ${
                              currentIdx === questions.length - 1 ? "bg-rose-500 hover:bg-rose-600" : "bg-slate-900 hover:bg-black"
                            }`}
                        >
                            {currentIdx === questions.length - 1 ? "Finish Attempt" : "Next"}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
      </main>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}
