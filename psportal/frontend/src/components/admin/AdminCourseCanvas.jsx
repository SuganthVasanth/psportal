import React, { useState, useEffect } from "react";
import { 
  ClipboardList, 
  UserPlus, 
  Hammer, 
  CalendarCheck, 
  BarChart, 
  ChevronRight, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

const API_BASE = "http://localhost:5000";

const STAGES = [
  { id: "definition", label: "Course Definition", icon: ClipboardList, color: "slate" },
  { id: "assignment", label: "Faculty Assignment", icon: UserPlus, color: "indigo" },
  { id: "development", label: "Content Builder", icon: Hammer, color: "amber" },
  { id: "review", label: "Admin Review", icon: Clock, color: "blue" },
  { id: "live", label: "Live Assessment", icon: CalendarCheck, color: "emerald" },
  { id: "analyzed", label: "Success Analytics", icon: BarChart, color: "rose" }
];

export default function AdminCourseCanvas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/superadmin/lifecycle-canvas`)
      .then(res => res.json())
      .then(d => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center p-20 text-slate-400 font-medium">Loading Course Canvas...</div>;
  if (error) return <div className="p-10 text-red-500 bg-red-50 rounded-xl m-8 border border-red-100 flex items-center gap-2"><AlertCircle size={20} /> Error: {error}</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-black text-slate-800">Course Lifecycle Canvas</h2>
        <p className="text-slate-500 text-sm mt-1">End-to-End tracking from creation to student analytics</p>
      </div>

      <div className="flex-1 overflow-x-auto p-8 pt-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max pb-8">
          {STAGES.map(stage => {
            const coursesInStage = data.filter(c => c.stage === stage.id);
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="w-[320px] flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100/80 overflow-hidden">
                <div className={`p-4 border-b border-slate-100 bg-white flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-${stage.color}-50 text-${stage.color}-600`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-black text-slate-800 text-sm tracking-tight">{stage.label}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{coursesInStage.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {coursesInStage.map(course => (
                    <div key={course.id} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {course.logo ? (
                            <img src={course.logo} alt="" className="w-8 h-8 rounded-lg object-contain bg-slate-50" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                              {course.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{course.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{course.status}</p>
                          </div>
                        </div>
                        <button className="text-slate-300 hover:text-slate-500"><MoreVertical size={16} /></button>
                      </div>

                      {/* Content Progress Bar */}
                      {(stage.id === "development" || stage.id === "review") && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Builder Progress</span>
                            <span className="text-[10px] font-black text-indigo-600">{course.contentProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-1000" 
                              style={{ width: `${course.contentProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Assignment Tags */}
                      {course.assignments?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
                          {course.assignments.slice(0, 2).map((a, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-slate-400" />
                              {a.facultyName.split(' ')[0]}
                            </span>
                          ))}
                          {course.assignments.length > 2 && <span className="text-[9px] font-black text-slate-400 ml-1">+{course.assignments.length - 2} more</span>}
                        </div>
                      )}

                      {/* Success Stats */}
                      {(stage.id === "live" || stage.id === "analyzed") && (
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Passing</span>
                            <span className="text-sm font-black text-emerald-600">{course.stats.passRate}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Attempts</span>
                            <span className="text-sm font-black text-slate-800">{course.stats.totalStudents}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex -space-x-2">
                           <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">?</div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                           <span className="text-[10px] font-bold">Details</span>
                           <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {coursesInStage.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                      <div className="w-12 h-12 bg-slate-200 rounded-full mb-3" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Empty Stage</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
