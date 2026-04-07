import React, { createElement, isValidElement } from "react";
import { NavLink } from "react-router-dom";
import { GraduationCap, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import "./StudentSidebar.css";

function labelOf(item) {
  return item.label || item.name || "Untitled";
}

function renderIcon(icon, opts = {}) {
  const { size = 18, className = "" } = opts;
  if (isValidElement(icon)) return icon;
  if (!icon) return null;
  return createElement(icon, { size, className });
}

export default function SmartSidebar({
  sections = [],
  collapsed = false,
  onToggle,
  profileName = "User",
  profileRole = "User",
  onLogout,
  brand = "PCDP Portal",
  subtitle = "Skills Platform",
  logoUrl,
  /** Unused for styling; prefer `shell`. */
  surface = "dark",
  /**
   * "light" = white rail + solid black active pills (student / reference UI).
   * "dark"  = navy gradient rail (admin / staff).
   */
  shell,
}) {
  void surface;
  const resolvedShell = shell ?? "light";
  const isDarkShell = resolvedShell === "dark";

  const initials = String(profileName)
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const itemRowClass = ({ isActive }) =>
    [
      "flex items-center gap-3 w-full rounded-2xl px-3 py-2.5 min-h-[48px] transition-all duration-200",
      isActive
        ? "text-white font-semibold bg-black shadow-[0_6px_20px_rgba(0,0,0,0.22)]"
        : isDarkShell
          ? "text-white/60 font-medium hover:bg-white/[0.08] hover:text-white/90"
          : "text-[#64748b] font-medium hover:bg-slate-50 hover:text-slate-800",
    ].join(" ");

  const collapsedItemRowClass = ({ isActive }) =>
    [
      "flex items-center justify-center w-full rounded-2xl p-2.5 min-h-[44px] transition-all duration-200",
      isActive
        ? "text-white bg-black shadow-[0_6px_20px_rgba(0,0,0,0.22)]"
        : isDarkShell
          ? "text-white/60 hover:bg-white/[0.08]"
          : "text-[#64748b] hover:bg-slate-50",
    ].join(" ");

  const iconClass = (isActive) =>
    isActive ? "text-white" : isDarkShell ? "text-white/55" : "text-[#64748b]";

  return (
    <aside
      className={`smart-sidebar-shell flex flex-col h-screen overflow-hidden relative ${
        isDarkShell
          ? `shadow-[4px_0_32px_rgba(0,27,61,0.22)] border-r border-white/[0.12] bg-gradient-to-br from-[#1a3352] via-[#0f2744] to-[#001b3d]`
          : "border-r border-[#e2e8f0] bg-white shadow-[2px_0_12px_rgba(15,23,42,0.04)]"
      } ${collapsed ? "w-[72px]" : "w-[268px]"}`}
    >
      {isDarkShell && (
        <>
          <div className="absolute w-40 h-40 -top-10 -right-10 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute w-24 h-24 bottom-24 -left-8 rounded-full bg-white/[0.04] pointer-events-none" />
        </>
      )}

      <div className={`flex-shrink-0 flex items-center gap-3 relative z-10 ${collapsed ? "px-3 py-5 justify-center" : "px-5 py-6"}`}>
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-10 h-10 rounded-xl object-contain" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#001b3d] flex items-center justify-center shadow-md shrink-0">
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.2} aria-hidden />
          </div>
        )}
        {!collapsed && (
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className={`text-[17px] font-bold tracking-tight leading-tight ${isDarkShell ? "text-white" : "text-[#0f172a]"}`}
            >
              {brand}
            </span>
            <span className={`text-xs font-medium mt-0.5 ${isDarkShell ? "text-white/50" : "text-slate-400"}`}>
              {subtitle}
            </span>
          </div>
        )}
        <button
          type="button"
          className={
            isDarkShell
              ? `inline-flex items-center justify-center w-8 h-8 rounded-[10px] text-white bg-white/15 border border-white/10 hover:bg-white/25 transition-colors duration-200 ${collapsed ? "absolute top-4 right-2" : "shrink-0 ml-auto"}`
              : `inline-flex items-center justify-center w-8 h-8 rounded-[10px] text-slate-500 bg-slate-50 border border-slate-200/90 hover:bg-slate-100 transition-colors duration-200 ${collapsed ? "absolute top-4 right-2" : "shrink-0 ml-auto"}`
          }
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-2 relative z-10 smart-sidebar-nav"
        style={{ scrollbarWidth: "thin" }}
      >
        {sections.map((section, groupIdx) => (
          <div key={section.title || section.label || section.id}>
            {!collapsed && (
              <p
                className={`text-[10px] font-bold tracking-[0.14em] uppercase px-3.5 ${
                  isDarkShell ? "text-white/40" : "text-slate-400"
                } ${groupIdx === 0 ? "pt-1 pb-2" : "pt-5 pb-2"}`}
              >
                {section.title || section.label || "SECTION"}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {(section.items || []).map((item) => {
                const Icon = item.icon;
                const name = labelOf(item);
                return (
                  <div key={item.id || name} className="flex items-center px-1.5">
                    <NavLink to={item.path} className={collapsed ? collapsedItemRowClass : itemRowClass} end={Boolean(item.end)}>
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center justify-center w-8 h-8 shrink-0 [&_svg]:shrink-0">
                            {renderIcon(Icon, { className: iconClass(isActive) })}
                          </span>
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-[13px] truncate">{name}</span>
                              {/* {isActive && (
                                <Star
                                  className="w-3.5 h-3.5 text-amber-300 fill-amber-300 flex-shrink-0 drop-shadow-sm"
                                  aria-hidden
                                />
                              )} */}
                            </>
                          )}
                        </>
                      )}
                    </NavLink>
                  </div>
                );
              })}
            </div>
            {groupIdx < sections.length - 1 && !collapsed && (
              <div className={`h-px mx-3.5 my-3 ${isDarkShell ? "bg-white/[0.08]" : "bg-slate-100"}`} />
            )}
          </div>
        ))}
      </div>

      <div
        className={`flex-shrink-0 px-3 pb-5 pt-3 relative z-10 border-t ${
          isDarkShell ? "border-white/[0.1] bg-transparent" : "border-slate-100 bg-white"
        }`}
      >
        <div className="flex items-center gap-3 px-2 py-1" style={{ minHeight: "48px" }}>
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold shadow-sm shrink-0 ${
              isDarkShell ? "bg-white/20 text-white" : "bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white"
            }`}
          >
            {initials || "U"}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span
                className={`text-sm font-semibold leading-tight truncate ${isDarkShell ? "text-white" : "text-slate-800"}`}
              >
                {profileName}
              </span>
              <span className={`text-[11px] ${isDarkShell ? "text-white/65" : "text-slate-500"}`}>{profileRole}</span>
            </div>
          )}
        </div>

        <div
          onClick={onLogout}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onLogout?.();
            }
          }}
          className={
            isDarkShell
              ? "flex items-center gap-3 px-2 py-2.5 mt-1 cursor-pointer select-none transition-colors duration-200 rounded-full mx-0.5 text-white/50 hover:text-white/85 hover:bg-white/[0.08]"
              : "flex items-center gap-3 px-2 py-2.5 mt-1 cursor-pointer select-none transition-colors duration-200 rounded-full mx-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }
        >
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-xl ${isDarkShell ? "text-white/55" : "text-slate-500"}`}
          >
            <LogOut size={18} />
          </span>
          {!collapsed && <span className="text-sm font-medium">Log Out</span>}
        </div>
      </div>
    </aside>
  );
}
