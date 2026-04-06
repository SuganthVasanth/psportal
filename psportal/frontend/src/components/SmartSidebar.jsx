import React, { createElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import "./StudentSidebar.css";

function labelOf(item) {
  return item.label || item.name || "Untitled";
}

function renderIcon(icon) {
  if (isValidElement(icon)) return icon;
  if (!icon) return null;
  // Supports function components and forwardRef component objects (e.g. lucide-react icons).
  return createElement(icon, { size: 18 });
}

export default function SmartSidebar({
  sections = [],
  collapsed = false,
  onToggle,
  profileName = "User",
  profileRole = "User",
  onLogout,
  brand = "PCDP Portal",
  logoUrl = "https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png",
  /** "dark" = default staff/student nav; "soft" = light indigo gradient (e.g. assessment booking) */
  surface = "dark",
}) {
  const isSoft = surface === "soft";
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorTop, setIndicatorTop] = useState(0);
  const itemRefs = useRef([]);
  const navScrollRef = useRef(null);

  const flatItems = useMemo(() => sections.flatMap((section) => section.items || []), [sections]);

  useEffect(() => {
    const idx = flatItems.findIndex(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`) ||
        (item.path !== "/" && location.pathname.startsWith(item.path))
    );
    if (idx >= 0) setActiveIndex(idx);
  }, [location.pathname, flatItems]);

  useEffect(() => {
    if (activeIndex >= flatItems.length) {
      setActiveIndex(flatItems.length > 0 ? flatItems.length - 1 : 0);
    }
  }, [activeIndex, flatItems.length]);

  const syncIndicatorToActiveItem = () => {
    const el = itemRefs.current[activeIndex];
    if (el instanceof HTMLElement) {
      setIndicatorTop(el.offsetTop);
    }
  };

  useEffect(() => {
    syncIndicatorToActiveItem();
  }, [activeIndex, collapsed, sections, location.pathname]);

  useEffect(() => {
    const onResize = () => syncIndicatorToActiveItem();
    const onScroll = () => syncIndicatorToActiveItem();
    const nav = navScrollRef.current;
    window.addEventListener("resize", onResize);
    nav?.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("resize", onResize);
      nav?.removeEventListener("scroll", onScroll);
    };
  }, [activeIndex, collapsed, sections]);

  const initials = String(profileName)
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={`flex flex-col h-screen rounded-r-2xl overflow-hidden relative ${
        collapsed ? (isSoft ? "w-[72px]" : "w-20") : isSoft ? "w-[220px]" : "w-[260px]"
      } ${isSoft ? "shadow-[4px_0_24px_rgba(67,56,202,0.08)] border-r border-indigo-100/90" : "shadow-[4px_0_32px_rgba(30,39,97,0.18)]"}`}
      style={{
        background: isSoft
          ? "linear-gradient(165deg, #f0f4ff 0%, #e8eeff 42%, #e0e7ff 100%)"
          : "linear-gradient(160deg, #2d3a8c 0%, #1e2761 60%, #16204f 100%)",
      }}
    >
      {isSoft ? (
        <>
          <div className="absolute w-44 h-44 -top-16 -right-12 rounded-full bg-indigo-400/[0.09] pointer-events-none" />
          <div className="absolute w-28 h-28 bottom-24 -left-8 rounded-full bg-sky-400/[0.08] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute w-40 h-40 -top-10 -right-10 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute w-24 h-24 bottom-16 -left-8 rounded-full bg-white/[0.04] pointer-events-none" />
        </>
      )}

      <div className={`flex-shrink-0 flex items-center gap-2.5 relative z-10 ${isSoft ? "px-4 py-5" : "px-6 py-7"}`}>
        <img src={logoUrl} alt="Logo" className={`object-contain ${isSoft ? "w-7 h-7" : "w-8 h-8"}`} />
        {!collapsed && (
          <span
            className={`text-xl font-bold tracking-[-0.3px] ${isSoft ? "text-slate-800" : "text-white"}`}
          >
            {brand}
          </span>
        )}
        <button
          type="button"
          className={
            isSoft
              ? "ml-auto inline-flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/70 text-slate-600 shadow-sm border border-indigo-100/80 hover:bg-white transition-colors duration-200"
              : "ml-auto inline-flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/15 text-white hover:bg-white/25 transition-colors duration-200"
          }
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div ref={navScrollRef} className="flex-1 overflow-y-auto px-3 relative z-10" style={{ scrollbarWidth: "none" }}>
        <div
          className={`absolute left-2 right-2 rounded-xl pointer-events-none z-0 ${
            isSoft ? "ring-1 ring-indigo-100/80" : ""
          }`}
          style={{
            height: "52px",
            top: indicatorTop,
            background: isSoft ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.13)",
            backdropFilter: isSoft ? "blur(8px)" : "blur(4px)",
            boxShadow: isSoft
              ? "0 4px 14px rgba(67, 56, 202, 0.10)"
              : "0 2px 16px rgba(0,0,0,0.10)",
            transition: "top 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        <div>
              {(() => {
                let globalIndex = 0;
                return sections.map((section, groupIdx) => {
                  return (
                    <div key={section.title || section.label || section.id}>
                      {!collapsed && (
                        <p
                          className={`text-[10px] font-bold tracking-[0.12em] uppercase px-3.5 pt-2.5 pb-1 ${
                            groupIdx === 0 ? "mt-0" : "mt-2"
                          } ${isSoft ? "text-slate-400" : "text-white/40"}`}
                        >
                          {section.title || section.label || "SECTION"}
                        </p>
                      )}
                      <div>
                        {(section.items || []).map((item, idx) => {
                          const index = globalIndex++;
                          const Icon = item.icon;
                          const name = labelOf(item);
                          return (
                            <div
                              key={item.id || name}
                              ref={(el) => {
                                itemRefs.current[index] = el;
                              }}
                              onClick={() => setActiveIndex(index)}
                              className="flex items-center gap-2 px-2.5 cursor-pointer select-none relative z-10"
                              style={{ height: "52px" }}
                            >
                              <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                  isSoft
                                    ? `flex items-center gap-3 w-full rounded-xl pl-2.5 pr-2 py-1.5 transition-all duration-200 ${
                                        isActive
                                          ? "bg-white/95 text-indigo-900 font-semibold shadow-sm ring-1 ring-indigo-100/90 border-l-[3px] border-indigo-600"
                                          : "text-slate-600 font-medium border-l-[3px] border-transparent hover:bg-white/55"
                                      }`
                                    : `flex items-center gap-3 w-full ${
                                        isActive ? "text-white font-semibold" : "text-white/50 font-normal"
                                      }`
                                }
                                end={Boolean(item.end)}
                              >
                                {({ isActive }) => (
                                  <>
                                    <span
                                      className={`flex items-center justify-center w-8 h-8 rounded-[10px] transition-colors duration-200 ${
                                        isSoft
                                          ? isActive
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "text-slate-500 bg-white/45"
                                          : isActive
                                            ? "bg-white/20"
                                            : ""
                                      }`}
                                    >
                                      {renderIcon(Icon)}
                                    </span>
                                    {!collapsed && (
                                      <span
                                        className={`flex-1 text-[13px] truncate transition-colors duration-200 ${
                                          isSoft
                                            ? isActive
                                              ? "text-indigo-950 font-semibold"
                                              : "text-slate-600 font-medium"
                                            : isActive
                                              ? "text-white font-semibold"
                                              : "text-white/50 font-normal"
                                        }`}
                                      >
                                        {name}
                                      </span>
                                    )}
                                    {isActive && !collapsed && !isSoft && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0"
                                        style={{ boxShadow: "0 0 6px rgba(147,197,253,0.8)" }}
                                      />
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </div>
                          );
                        })}
                      </div>
                      {groupIdx < sections.length - 1 && (
                        <div className={`h-px mx-3.5 my-1 ${isSoft ? "bg-indigo-200/50" : "bg-white/[0.07]"}`} />
                      )}
                    </div>
                  );
                });
              })()}
        </div>
      </div>

      <div
        className={`flex-shrink-0 px-3 pb-5 pt-2 relative z-10 border-t ${
          isSoft ? "border-indigo-200/60 bg-white/20" : "border-white/[0.08]"
        }`}
      >
        <div className="flex items-center gap-3 px-2" style={{ height: "52px" }}>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-[10px] text-xs font-bold ${
              isSoft ? "bg-indigo-600 text-white shadow-sm" : "bg-white/20 text-white"
            }`}
          >
            {initials || "U"}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className={`text-sm font-semibold leading-tight truncate ${isSoft ? "text-slate-800" : "text-white"}`}>
                {profileName}
              </span>
              <span className={`text-[11px] ${isSoft ? "text-slate-500" : "text-white/70"}`}>{profileRole}</span>
            </div>
          )}
        </div>

        <div
          onClick={onLogout}
          className={`flex items-center gap-3 px-2 cursor-pointer select-none transition-colors duration-200 rounded-xl mx-1 ${
            isSoft
              ? "text-slate-500 hover:text-indigo-700 hover:bg-white/60"
              : "text-white/45 hover:text-white/70"
          }`}
          style={{ height: "48px" }}
        >
          <span className={`flex items-center justify-center w-8 h-8 rounded-[10px] ${isSoft ? "text-slate-500" : ""}`}>
            <LogOut size={18} />
          </span>
          {!collapsed && <span className="text-sm font-medium">Log Out</span>}
        </div>
      </div>
    </aside>
  );
}
