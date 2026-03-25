import React, { createElement, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import "./frontend/src/components/StudentSidebar.css";

function labelOf(item) {
  return item.label || item.name || "Untitled";
}

function renderIcon(icon) {
  if (isValidElement(icon)) return icon;
  if (!icon) return null;
  return createElement(icon, { size: 20 });
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
  const [indicatorHeight, setIndicatorHeight] = useState(56);
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
      setIndicatorHeight(el.offsetHeight || 56);
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

  const sidebarStyle = {
    background: "linear-gradient(160deg, #C38EB4, #A6789C)",
    overflow: "visible",
  };

  const indicatorStyle = {
    top: indicatorTop,
    height: indicatorHeight,
    right: -16,
    background: "#ffffff",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };

  return (
    <aside className={`student-sidebar-premium ${collapsed ? "collapsed" : ""}`} style={sidebarStyle}>
      <div className="sidebar-header-premium">
        <img src={logoUrl} alt="Logo" className="sidebar-logo-premium" />
        {!collapsed && <span className="sidebar-brand-premium">{brand}</span>}
        <button
          type="button"
          className="sidebar-collapse-btn-premium"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav-premium" ref={navScrollRef}>
        <div className="sidebar-nav-track-premium">
          <div className="sidebar-nav-inner-premium">
            <div className="sidebar-active-pill-premium" style={indicatorStyle} />
            <div className="sidebar-nav-sections-premium">
              {(() => {
                let running = 0;
                return sections.map((section) => {
                  const sectionStart = running;
                  running += (section.items || []).length;
                  return (
                    <div className="nav-section-premium" key={section.title || section.label || section.id}>
                      {!collapsed && (
                        <div className="section-title-premium">{section.title || section.label || "SECTION"}</div>
                      )}
                      <ul className="sidebar-nav-list-premium">
                        {(section.items || []).map((item, idx) => {
                          const index = sectionStart + idx;
                          const Icon = item.icon;
                          const name = labelOf(item);
                          return (
                            <li
                              className="sidebar-nav-item-premium"
                              key={item.id || name}
                              data-nav-index={index}
                              ref={(el) => {
                                itemRefs.current[index] = el;
                              }}
                            >
                              <NavLink
                                to={item.path}
                                className={({ isActive }) => `nav-item-premium ${isActive ? "active" : ""}`}
                                onClick={() => setActiveIndex(index)}
                                end={Boolean(item.end)}
                              >
                                {({ isActive }) => (
                                  <>
                                    <span
                                      className="icon-wrapper-premium"
                      style={{
                                        background: isActive ? "#f3e8ff" : "transparent",
                                        color: isActive ? "#7c3aed" : "rgba(255,255,255,0.6)",
                                        borderRadius: 10,
                                      }}
                                    >
                                      {renderIcon(Icon)}
                      </span>
                                    {!collapsed && (
                                      <span style={{ color: isActive ? "#1e293b" : "rgba(255,255,255,0.6)" }}>
                                        {name}
                      </span>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                });
              })()}
        </div>
          </div>
        </div>
      </nav>

      <div className="sidebar-footer-premium">
        <div className="user-profile-summary-premium">
          <div className="user-avatar-premium">{initials || "U"}</div>
          {!collapsed && (
            <div className="user-info-premium">
              <span className="user-name-premium">{profileName}</span>
              <span className="user-role-premium">{profileRole}</span>
          </div>
          )}
        </div>

        <button onClick={onLogout} className="logout-btn-premium">
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
