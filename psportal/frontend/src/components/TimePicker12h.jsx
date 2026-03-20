import React, { useEffect, useRef, useMemo } from "react";

/**
 * Converts 24h "HH:mm" to { hour 1-12, minute 0-59, ampm }.
 */
function parse24h(value) {
  if (!value || typeof value !== "string") return { hour: 9, minute: 0, ampm: "am" };
  const [h, m] = value.trim().split(":");
  const h24 = Math.min(23, Math.max(0, parseInt(h, 10) || 0));
  const minute = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
  const ampm = h24 < 12 ? "am" : "pm";
  const hour = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { hour, minute, ampm };
}

/**
 * Converts { hour 1-12, minute, ampm } to 24h "HH:mm".
 */
function to24h(hour, minute, ampm) {
  let h24 = hour;
  if (ampm === "pm" && hour !== 12) h24 = hour + 12;
  if (ampm === "am" && hour === 12) h24 = 0;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const AMPM = ["am", "pm"];

export default function TimePicker12h({ value = "", onChange, id }) {
  const parsed = useMemo(() => parse24h(value), [value]);
  const hourRef = useRef(null);
  const minRef = useRef(null);
  const ampmRef = useRef(null);

  const scrollToSelected = (ref, index) => {
    if (!ref?.current) return;
    const el = ref.current.querySelector("[data-selected]");
    if (el) el.scrollIntoView({ block: "nearest", behavior: "auto" });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      scrollToSelected(hourRef, parsed.hour);
      scrollToSelected(minRef, parsed.minute);
      scrollToSelected(ampmRef, AMPM.indexOf(parsed.ampm));
    }, 50);
    return () => clearTimeout(t);
  }, [value]);

  const handleSelect = (type, val) => {
    let hour = parsed.hour;
    let minute = parsed.minute;
    let ampm = parsed.ampm;
    if (type === "hour") hour = parseInt(val, 10);
    if (type === "minute") minute = parseInt(val, 10);
    if (type === "ampm") ampm = val;
    onChange?.(to24h(hour, minute, ampm));
  };

  return (
    <div className="tp12-root" id={id} role="group" aria-label="Time picker">
      <div className="tp12-columns">
        <div className="tp12-col" ref={hourRef} aria-label="Hour">
          {HOURS.map((h) => {
            const num = parseInt(h, 10);
            const selected = parsed.hour === num;
            return (
              <button
                key={h}
                type="button"
                className={`tp12-item ${selected ? "tp12-item-selected" : ""}`}
                data-selected={selected ? "true" : undefined}
                onClick={() => handleSelect("hour", h)}
              >
                {h}
              </button>
            );
          })}
        </div>
        <div className="tp12-col" ref={minRef} aria-label="Minute">
          {MINUTES.map((m) => {
            const num = parseInt(m, 10);
            const selected = parsed.minute === num;
            return (
              <button
                key={m}
                type="button"
                className={`tp12-item ${selected ? "tp12-item-selected" : ""}`}
                data-selected={selected ? "true" : undefined}
                onClick={() => handleSelect("minute", m)}
              >
                {m}
              </button>
            );
          })}
        </div>
        <div className="tp12-col" ref={ampmRef} aria-label="AM/PM">
          {AMPM.map((a) => {
            const selected = parsed.ampm === a;
            return (
              <button
                key={a}
                type="button"
                className={`tp12-item ${selected ? "tp12-item-selected" : ""}`}
                data-selected={selected ? "true" : undefined}
                onClick={() => handleSelect("ampm", a)}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
