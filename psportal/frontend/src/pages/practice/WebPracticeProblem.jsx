import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Trophy, Layout, ExternalLink, Info, Terminal, Beaker, Code2 } from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import CodeCompiler from "../../components/CodeCompiler";
import "./WebPracticeProblem.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function WebPracticeProblem() {
  const { level, problemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const levelNum = Math.max(1, Math.min(3, parseInt(level, 10) || 1));
  const registerNo = (localStorage.getItem("register_no") || "").trim();
  const [problem, setProblem] = useState(null);
  const [details, setDetails] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [savedSubmission, setSavedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("problem");

  const lastSavedText = savedSubmission?.lastSubmittedAt
    ? new Date(savedSubmission.lastSubmittedAt).toLocaleString()
    : "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const selectedFromState = location?.state?.selectedProblem;
        const [problemsRes, casesRes, detailsRes] = await Promise.all([
          selectedFromState ? Promise.resolve({ ok: true, json: async () => [selectedFromState] }) : fetch(`${API_BASE}/api/coding/problems/${levelNum}`),
          fetch(`${API_BASE}/api/coding/testcases/${levelNum}/${encodeURIComponent(problemId)}`),
          fetch(`${API_BASE}/api/coding/problem/${encodeURIComponent(problemId)}`),
        ]);
        const problemsData = await problemsRes.json().catch(() => []);
        const casesData = await casesRes.json().catch(() => []);
        const detailsData = await detailsRes.json().catch(() => ({}));
        const selected =
          selectedFromState?.problemId === problemId
            ? selectedFromState
            : (Array.isArray(problemsData) ? problemsData : []).find((p) => p.problemId === problemId);
        setProblem(
          selected || {
            problemId,
            title: problemId,
            rating: null,
            tags: [],
            link: `https://codeforces.com/problemset/problem/${String(problemId).split("-")[0]}/${String(problemId).split("-")[1] || ""}`,
          }
        );
        setTestCases(Array.isArray(casesData) ? casesData : []);
        setDetails(detailsData && typeof detailsData === "object" ? detailsData : null);

        if (registerNo) {
          const subRes = await fetch(
            `${API_BASE}/api/coding/submission?level=${levelNum}&problemId=${encodeURIComponent(problemId)}&register_no=${encodeURIComponent(registerNo)}`
          );
          const subData = await subRes.json().catch(() => ({}));
          if (subData?.exists) setSavedSubmission(subData);
          else setSavedSubmission(null);
        } else {
          setSavedSubmission(null);
        }
      } catch (e) {
        setError("Failed to load problem.");
        setProblem(null);
        setDetails(null);
        setTestCases([]);
        setSavedSubmission(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [levelNum, problemId, location?.state, registerNo]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="dashboard-container-inner web-problem-state">
          <p className="web-problem-state-text">Loading problem details...</p>
        </div>
      </StudentLayout>
    );
  }

  if (!problem) {
    return (
      <StudentLayout>
        <div className="dashboard-container-inner web-problem-state">
          <p className="web-problem-state-error">{error || "Problem not found."}</p>
          <button type="button" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl" onClick={() => navigate("/web-practice")}>
            Back
          </button>
        </div>
      </StudentLayout>
    );
  }

  const handleSubmit = async ({ evaluated, code, language, stdin }) => {
    const verdict = evaluated?.verdict || (evaluated?.success ? "Accepted" : "Failed");
    setSavedSubmission((prev) => ({
      ...(prev || {}),
      code: code ?? prev?.code ?? "",
      stdin: stdin ?? prev?.stdin ?? "",
      language: language ?? prev?.language ?? "c",
      isAccepted: verdict === "Accepted" ? true : prev?.isAccepted ?? false,
      lastVerdict: verdict,
      lastSubmittedAt: new Date().toISOString(),
    }));
    return evaluated;
  };

  return (
    <StudentLayout>
      <div className="h-[calc(100vh-72px)] bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
        {/* Professional Header */}
        {/* <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
            <button 
              type="button" 
              className="mr-2 p-2.5 hover:bg-slate-100 rounded-xl transition-all border border-transparent shadow-sm hover:shadow-md hover:border-slate-200 text-slate-500"
              onClick={() => navigate("/web-practice")}
              title="Back to Web Practice"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-200">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {problem.title}
              </h1>
              <p className="text-[11px] text-indigo-600 font-bold tracking-widest uppercase flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                Web Practice Arena
              </p>
            </div>
          </div>
        </header> */}

        {/* Core Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0 bg-[#f9fafb]">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
               {/* Detailed Specifications Panel */}
               <div className="w-full lg:w-[60%] xl:w-[55%] 2xl:w-[50%] flex-none border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col shadow-sm">
                      <div className="p-8 pb-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-5">
                           <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-[11px] uppercase tracking-[0.2em]">
                             <Layout className="w-4 h-4" />
                             Specifications
                           </div>
                           {problem.link && (
                            <a
                              href={problem.link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-400 transition-all border border-slate-200 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200"
                              title="Original Source"
                            >
                              <ExternalLink className="w-4.5 h-4.5" />
                            </a>
                           )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 leading-tight">{problem.title}</h2>
                        <div className="mt-5 flex flex-wrap items-center gap-2.5">
                           <span className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                              REF: {problem.problemId}
                           </span>
                           <span
                             className={`px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-lg border ${
                               savedSubmission?.isAccepted 
                               ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                               : "bg-slate-50 text-slate-500 border-slate-200"
                             }`}
                           >
                              {savedSubmission?.isAccepted ? "Completed" : "In progress"}
                           </span>
                           {problem.rating != null && (
                             <span className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                               Rating {problem.rating}
                             </span>
                           )}
                        </div>
                      </div>

                      {/* Professional Tabbed View */}
                      <div className="flex-1 flex flex-col min-h-0">
                         <div className="flex border-b border-slate-100 px-8">
                            <button 
                              onClick={() => setActiveTab("problem")}
                              className={`flex-1 py-4 text-[11px] font-extrabold uppercase tracking-[0.15em] transition-all relative ${
                                activeTab === "problem" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              Description
                              {activeTab === "problem" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />}
                            </button>
                            <button 
                              onClick={() => setActiveTab("testcases")}
                              className={`flex-1 py-4 text-[11px] font-extrabold uppercase tracking-[0.15em] transition-all relative ${
                                activeTab === "testcases" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              Sample Registry
                              {activeTab === "testcases" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />}
                            </button>
                         </div>

                         <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-100">
                            {activeTab === "problem" ? (
                              <div className="space-y-8 animate-in fade-in slide-in-from-right-2">
                                <div className="space-y-6">
                                  <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-2">
                                     <Info className="w-5 h-5 text-indigo-500" />
                                     Problem Description
                                  </h3>
                                  <div className="text-[14px] text-slate-600 leading-[1.8] font-medium whitespace-pre-wrap">
                                     {details?.description || "Loading description..."}
                                  </div>
                                  
                                  {details?.input && (
                                    <>
                                      <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mt-8 mb-3">Input Format</h4>
                                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {details.input}
                                      </div>
                                    </>
                                  )}
                                  
                                  {details?.output && (
                                    <>
                                      <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mt-8 mb-3">Output Format</h4>
                                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {details.output}
                                      </div>
                                    </>
                                  )}

                                  {Array.isArray(details?.examples) && details.examples.length > 0 && (
                                    <>
                                      <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mt-8 mb-4">Examples</h4>
                                      <div className="space-y-4">
                                        {details.examples.map((ex, i) => (
                                          <div key={i} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            <div className="p-4 bg-slate-50 space-y-4">
                                               <div>
                                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Input</div>
                                                  <pre className="text-xs bg-slate-100/50 p-3 rounded-lg text-slate-700 overflow-x-auto border border-slate-200/50 leading-relaxed">
                                                    {ex.input}
                                                  </pre>
                                               </div>
                                               <div>
                                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Output</div>
                                                  <pre className="text-xs bg-indigo-50/50 p-3 rounded-lg text-indigo-700 overflow-x-auto border border-indigo-100/50 leading-relaxed font-bold">
                                                    {ex.output}
                                                  </pre>
                                               </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}

                                  {details?.note && (
                                    <>
                                      <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mt-8 mb-3">Note</h4>
                                      <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100/50 text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {details.note}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                                 {testCases.length === 0 ? (
                                   <div className="py-20 text-center space-y-4">
                                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto border border-slate-100">
                                         <Beaker className="w-8 h-8 text-slate-200" />
                                      </div>
                                      <p className="text-sm text-slate-300 font-bold uppercase tracking-widest">Registry Entry Vacant</p>
                                   </div>
                                 ) : (
                                   testCases.map((tc) => (
                                     <div key={tc.index} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                                       <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Register #{tc.index}</span>
                                          <Terminal className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                       </div>
                                       <div className="p-6 space-y-5">
                                          <div>
                                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Input Pattern</div>
                                             <pre className="text-xs bg-slate-50/80 p-4 rounded-xl text-slate-700 overflow-x-auto border border-slate-100/50 leading-relaxed shadow-inner">
                                              {tc.input}
                                             </pre>
                                          </div>
                                          <div>
                                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Expected Response</div>
                                             <pre className="text-xs bg-indigo-50/30 p-4 rounded-xl text-indigo-700 overflow-x-auto border border-indigo-100/30 leading-relaxed shadow-inner font-bold">
                                              {tc.expectedOutput}
                                             </pre>
                                          </div>
                                       </div>
                                     </div>
                                   ))
                                 )}
                              </div>
                            )}
                         </div>
                      </div>
               </div>

               {/* Professional Integrated IDE Area */}
               <div className="flex-1 min-w-0 p-2 flex flex-col bg-slate-50">
                  <div className="flex-1 rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-200 overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-indigo-100 min-w-0">
                    {/* <div className="px-8 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex items-center justify-between flex-wrap gap-4">
                       <div className="flex items-center gap-5">
                          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                             <span className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.1em]">Monaco Virtual Engine</span>
                          </div>
                          {savedSubmission && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                              Verdict: {savedSubmission.lastVerdict || "Attempted"}
                            </span>
                          )}
                       </div>
                       <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-3">
                          Environment Ready
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       </div>
                    </div> */}
                    <div className="flex-1 overflow-hidden relative flex flex-col min-w-0">
                      <CodeCompiler
                        key={`${levelNum}-${problem.problemId}`}
                        problem={problem}
                        testCases={testCases}
                        onSubmit={handleSubmit}
                        showSubmit
                        submitMode="backend"
                        submitMeta={{ level: levelNum, problemId: problem.problemId, register_no: registerNo }}
                        initialLanguage={savedSubmission?.language || "c"}
                        initialCode={savedSubmission?.code || ""}
                        initialStdin={savedSubmission?.stdin || ""}
                        resizable={false}
                        editorHeight="600px"
                      />
                    </div>
                  </div>
               </div>
            </div>
          </main>
        </div>
      </div>
    </StudentLayout>
  );
}

