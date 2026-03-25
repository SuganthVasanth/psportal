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
}) {
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
      className={`flex flex-col h-screen rounded-r-3xl overflow-hidden shadow-[4px_0_32px_rgba(30,39,97,0.18)] relative ${
        collapsed ? "w-20" : "w-[260px]"
      }`}
      style={{ background: "linear-gradient(160deg, #2d3a8c 0%, #1e2761 60%, #16204f 100%)" }}
    >
      <div className="absolute w-40 h-40 -top-10 -right-10 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute w-24 h-24 bottom-16 -left-8 rounded-full bg-white/[0.04] pointer-events-none" />

      <div className="flex-shrink-0 px-6 py-7 flex items-center gap-2.5 relative z-10">
        <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
        {!collapsed && <span className="text-white text-xl font-bold tracking-[-0.3px]">{brand}</span>}
        <button
          type="button"
          className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/15 text-white hover:bg-white/25 transition-colors duration-200"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div ref={navScrollRef} className="flex-1 overflow-y-auto px-3 relative z-10" style={{ scrollbarWidth: "none" }}>
        <div
          className="absolute left-3 right-3 rounded-[14px] pointer-events-none z-0"
          style={{
            height: "56px",
            top: indicatorTop,
            background: "rgba(255,255,255,0.13)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
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
                          className={`text-[10px] font-bold tracking-[0.12em] uppercase text-white/40 px-3.5 pt-2.5 pb-1 ${
                            groupIdx === 0 ? "mt-0" : "mt-2"
                          }`}
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
                              className="flex items-center gap-3 px-3.5 cursor-pointer select-none relative z-10"
                              style={{ height: "56px" }}
                            >
                              <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 w-full ${isActive ? "text-white font-semibold" : "text-white/50 font-normal"}`
                                }
                                end={Boolean(item.end)}
                              >
                                {({ isActive }) => (
                                  <>
                                    <span
                                      className={`flex items-center justify-center w-8 h-8 rounded-[9px] transition-colors duration-200 ${
                                        isActive ? "bg-white/20" : ""
                                      }`}
                                    >
                                      {renderIcon(Icon)}
                                    </span>
                                    {!collapsed && (
                                      <span
                                        className={`flex-1 text-sm truncate transition-colors duration-200 ${
                                          isActive ? "text-white font-semibold" : "text-white/50 font-normal"
                                        }`}
                                      >
                                        {name}
                                      </span>
                                    )}
                                    {isActive && !collapsed && (
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
                      {groupIdx < sections.length - 1 && <div className="h-px bg-white/[0.07] mx-3.5 my-1" />}
                    </div>
                  );
                });
              })()}
        </div>
      </div>

      <div className="flex-shrink-0 px-3 pb-6 pt-3 border-t border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3 px-3.5" style={{ height: "56px" }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-[9px] bg-white/20 text-white">
            {initials || "U"}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-white text-sm font-semibold leading-tight">{profileName}</span>
              <span className="text-white/70 text-[11px]">{profileRole}</span>
            </div>
          )}
        </div>

        <div
          onClick={onLogout}
          className="flex items-center gap-3 px-3.5 cursor-pointer select-none text-white/45 hover:text-white/70 transition-colors duration-200"
          style={{ height: "56px" }}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-[9px]">
            <LogOut size={18} />
          </span>
          {!collapsed && <span className="text-sm font-medium">Log Out</span>}
        </div>
      </div>
    </aside>
  );
}
