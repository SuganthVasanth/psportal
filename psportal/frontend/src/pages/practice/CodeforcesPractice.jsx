import React, { useEffect, useMemo, useState } from "react";
import { 
  ChevronRight, 
  ExternalLink, 
  Code2, 
  Settings2, 
  Search, 
  Trophy, 
  Layout, 
  Terminal,
  Info,
  Beaker
} from "lucide-react";
import StudentLayout from "../../components/StudentLayout";
import CodeCompiler from "../../components/CodeCompiler";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function CodeforcesPractice() {
  const [level, setLevel] = useState(1);
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingCases, setLoadingCases] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      setLoadingProblems(true);
      setError("");
      setSelected(null);
      setTestCases([]);
      try {
        const res = await fetch(`${API_BASE}/api/coding/problems/${level}`);
        const data = await res.json().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        setProblems(list);
        setSelected(list[0] || null);
      } catch (e) {
        setProblems([]);
        setError("Failed to fetch Codeforces problems.");
      } finally {
        setLoadingProblems(false);
      }
    };
    fetchProblems();
  }, [level]);

  useEffect(() => {
    const fetchCases = async () => {
      if (!selected?.problemId) return;
      setLoadingCases(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/coding/testcases/${level}/${encodeURIComponent(selected.problemId)}`
        );
        const data = await res.json().catch(() => []);
        setTestCases(Array.isArray(data) ? data : []);
      } catch {
        setTestCases([]);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchCases();
  }, [selected?.problemId, level]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("problem"); // "problem" or "testcases"

  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems;
    return problems.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problemId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [problems, searchQuery]);

  const editorHeight = useMemo(() => "600px", []);

  return (
    <StudentLayout>
      <div className="h-[calc(100vh-72px)] bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
        {/* Professional Header */}
        {/* <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-5">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-200">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Codeforces Arena
              </h1>
              <p className="text-[11px] text-indigo-600 font-bold tracking-widest uppercase flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                Competitive Training System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200/60 shadow-inner">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skill Level</span>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 cursor-pointer"
              >
                <option value={1}>Tier 1: Fundamentals</option>
                <option value={2}>Tier 2: Algorithmic Patterns</option>
                <option value={3}>Tier 3: Advanced Optimization</option>
              </select>
            </div>
            <button className="p-3 hover:bg-slate-100 rounded-xl transition-all border border-transparent shadow-sm hover:shadow-md hover:border-slate-200 text-slate-500">
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </header> */}

        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <Info className="w-5 h-5 text-red-500" />
            {error}
          </div>
        )}

        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* <aside className="w-[420px] border-r border-slate-200 bg-white flex flex-col min-h-0">
            <div className="p-6 pb-4 space-y-5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Master a specific problem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-5 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
              {loadingProblems ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="inline-flex p-5 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                    <Search className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-bold px-10 leading-relaxed uppercase tracking-tighter">No problems match your current criteria</p>
                </div>
              ) : (
                filteredProblems.map((p) => (
                  <button
                    key={p.problemId}
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`w-full text-left group transition-all duration-300 relative ${
                      selected?.problemId === p.problemId
                        ? "bg-indigo-50 ring-1 ring-indigo-500 shadow-md shadow-indigo-100/50"
                        : "hover:bg-slate-50"
                    } p-4 rounded-2xl`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 pr-2">
                        <h4 className={`text-[15px] font-bold truncate leading-snug ${
                          selected?.problemId === p.problemId ? "text-indigo-700" : "text-slate-700 group-hover:text-slate-900"
                        }`}>
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2.5">
                          {p.rating && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-white text-orange-600 border border-orange-200 shadow-sm">
                              {p.rating}
                            </span>
                          )}
                          {(p.tags || []).slice(0, 1).map((t) => (
                            <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-600/10 text-indigo-700 border border-indigo-100 uppercase tracking-tighter">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 mt-0.5 transition-all duration-300 ${
                        selected?.problemId === p.problemId 
                        ? "text-indigo-600 translate-x-0 opacity-100" 
                        : "text-slate-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                      }`} />
                    </div>
                  </button>
                ))
              )}
            </div> */}
          {/* </aside> */}

          {/* Core Content Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#f9fafb]">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
               {/* Detailed Specifications Panel */}
               <div className="w-full lg:w-[60%] xl:w-[55%] 2xl:w-[50%] flex-none border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col shadow-sm">
                  {selected ? (
                    <>
                      <div className="p-8 pb-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-5">
                           <div className="flex items-center gap-2.5 text-indigo-600 font-bold text-[11px] uppercase tracking-[0.2em]">
                             <Layout className="w-4 h-4" />
                             Specifications
                           </div>
                           {selected.link && (
                            <a
                              href={selected.link}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-400 transition-all border border-slate-200 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200"
                              title="Original Source"
                            >
                              <ExternalLink className="w-4.5 h-4.5" />
                            </a>
                           )}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 leading-tight">{selected.title}</h2>
                        <div className="mt-5 flex flex-wrap gap-2.5">
                           <span className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                              REF: {selected.problemId}
                           </span>
                           {selected.tags?.map(t => (
                             <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                               {t}
                             </span>
                           ))}
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
                                 <div className="space-y-4">
                                    <h3 className="text-[13px] font-black text-slate-800 flex items-center gap-3">
                                       <Info className="w-5 h-5 text-indigo-500" />
                                       Analysis Objective
                                    </h3>
                                    <p className="text-[15px] text-slate-600 leading-[1.7] font-medium">
                                       This competitive challenge requires a robust algorithmic approach. 
                                       Ensure your solution utilizes modern memory management and efficient time complexity.
                                    </p>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner mt-6">
                                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                          Technical Strategy
                                       </div>
                                       <p className="text-[13px] text-slate-500 leading-relaxed font-bold">
                                          Target O(n log n) efficiency for the dataset limit. 
                                          Implement edge-case handling for null or maximum boundary inputs as specified in the registry.
                                       </p>
                                    </div>
                                 </div>
                              </div>
                            ) : (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                                 {loadingCases ? (
                                   <div className="py-20 text-center">
                                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-5" />
                                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Compiling Registry Data...</p>
                                   </div>
                                 ) : testCases.length === 0 ? (
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
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-16 text-center text-slate-400">
                       <div className="space-y-6 max-w-[300px]">
                          <div className="w-24 h-24 bg-slate-50 rounded-[40px] mx-auto flex items-center justify-center shadow-lg shadow-slate-100 border border-slate-100 rotate-6 transition-transform hover:rotate-0 duration-500 group">
                             <Code2 className="w-10 h-10 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <p className="text-[13px] font-bold uppercase tracking-widest leading-relaxed">Initialize system by selecting an arena objective</p>
                       </div>
                    </div>
                  )}
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
                       </div>
                       <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-3">
                          Environment Ready
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       </div>
                    </div> */}
                    <div className="flex-1 overflow-hidden relative flex flex-col min-w-0">
                      <CodeCompiler
                        initialLanguage="c"
                        showSubmit
                        editorHeight={editorHeight}
                        submitMode="backend"
                        submitMeta={{ level, problemId: selected?.problemId }}
                        problem={selected}
                        resizable={false}
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

