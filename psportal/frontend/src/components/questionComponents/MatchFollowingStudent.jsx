import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Shuffle } from "lucide-react";
import "./MatchFollowingStudent.css";

function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Match the Following – modern two-column drag-to-connect UI.
 * value: { pairs, shuffledRightIndices?, connections? } where connections[leftIndex] = rightSlotIndex.
 */
export default function MatchFollowingStudent({ config = {}, value = {}, onChange, readOnly = false }) {
  const { label = "Match the following", pairs: numPairs = 4 } = config;
  const rawPairs = value?.pairs || Array.from({ length: Math.max(1, numPairs) }, (_, i) => ({ left: `Item ${i + 1}`, right: `Match ${i + 1}` }));
  const pairs = rawPairs.map((p) => ({
    left: typeof p.left === "string" ? p.left : (p.left?.text ?? p.left?.value ?? String(p.left ?? "")),
    right: typeof p.right === "string" ? p.right : (p.right?.text ?? p.right?.value ?? String(p.right ?? "")),
  }));

  const [shuffledRightIndices, setShuffledRightIndices] = useState(() => {
    if (Array.isArray(value?.shuffledRightIndices) && value.shuffledRightIndices.length === pairs.length) return value.shuffledRightIndices;
    return shuffleArray(pairs.map((_, i) => i));
  });
  const [connections, setConnections] = useState(() => value?.connections ?? {});
  const [draggingFrom, setDraggingFrom] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [hoverRight, setHoverRight] = useState(null);
  const [animatingConnections, setAnimatingConnections] = useState(new Set());
  const containerRef = useRef(null);
  const leftRefs = useRef([]);
  const rightRefs = useRef([]);
  const [lineCoords, setLineCoords] = useState([]);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const areaRef = useRef(null);

  const rightLabels = shuffledRightIndices.map((idx) => pairs[idx].right);
  const totalPairs = pairs.length;
  const matchedCount = Object.keys(connections).length;

  useEffect(() => {
    if (!Array.isArray(value?.shuffledRightIndices) || value.shuffledRightIndices.length !== pairs.length) {
      onChange?.({ ...value, pairs, shuffledRightIndices, connections });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifyChange = useCallback(
    (nextConnections, nextShuffled) => {
      const sh = nextShuffled !== undefined ? nextShuffled : shuffledRightIndices;
      onChange?.({ ...value, pairs, shuffledRightIndices: sh, connections: nextConnections });
    },
    [value, pairs, shuffledRightIndices, onChange]
  );

  useEffect(() => {
    if (value?.connections && typeof value.connections === "object") setConnections(value.connections);
  }, [value?.connections]);

  const handleLeftClick = (leftIndex) => {
    if (readOnly) return;
    if (connections[leftIndex] !== undefined) {
      const next = { ...connections };
      delete next[leftIndex];
      setConnections(next);
      notifyChange(next);
    }
  };

  const handleRightClick = (rightSlotIndex) => {
    if (readOnly) return;
    if (draggingFrom !== null) {
      setConnections((prev) => {
        const next = { ...prev, [draggingFrom]: rightSlotIndex };
        notifyChange(next);
        setAnimatingConnections((a) => new Set(a).add(`${draggingFrom}-${rightSlotIndex}`));
        setTimeout(() => setAnimatingConnections((a) => { const n = new Set(a); n.delete(`${draggingFrom}-${rightSlotIndex}`); return n; }), 600);
        return next;
      });
      setDraggingFrom(null);
      setDragEnd(null);
    }
  };

  const handleLeftMouseDown = (e, leftIndex) => {
    if (readOnly) return;
    e.preventDefault();
    if (connections[leftIndex] !== undefined) return;
    setDraggingFrom(leftIndex);
    setDragEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e) => {
    if (draggingFrom === null) return;
    setDragEnd({ x: e.clientX, y: e.clientY });
  }, [draggingFrom]);

  const handleMouseUp = useCallback((e) => {
    if (draggingFrom === null) return;
    const rightEl = e.target?.closest?.("[data-mfs-right]");
    const rightIndex = rightEl != null ? parseInt(rightEl.getAttribute("data-mfs-right"), 10) : -1;
    if (rightIndex >= 0) {
      setConnections((prev) => {
        const next = { ...prev, [draggingFrom]: rightIndex };
        notifyChange(next);
        setAnimatingConnections((a) => new Set(a).add(`${draggingFrom}-${rightIndex}`));
        setTimeout(() => setAnimatingConnections((a) => { const n = new Set(a); n.delete(`${draggingFrom}-${rightIndex}`); return n; }), 600);
        return next;
      });
    }
    setDraggingFrom(null);
    setDragEnd(null);
    setHoverRight(null);
  }, [draggingFrom, notifyChange]);

  useEffect(() => {
    if (draggingFrom === null) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingFrom, handleMouseMove, handleMouseUp]);

  const updateLineCoords = useCallback(() => {
    const areaEl = areaRef.current;
    if (!areaEl) return;
    const rect = areaEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const coords = [];
    Object.entries(connections).forEach(([leftIdx], i) => {
      const li = parseInt(leftIdx, 10);
      const rightSlotIndex = connections[li];
      const leftEl = leftRefs.current[li];
      const rightEl = rightRefs.current[rightSlotIndex];
      if (leftEl && rightEl) {
        const l = leftEl.getBoundingClientRect();
        const r = rightEl.getBoundingClientRect();
        const x1 = clamp(l.left - rect.left + l.width / 2, 0, w);
        const y1 = clamp(l.top - rect.top + l.height / 2, 0, h);
        const x2 = clamp(r.left - rect.left + r.width / 2, 0, w);
        const y2 = clamp(r.top - rect.top + r.height / 2, 0, h);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const perp = Math.min(40, w * 0.1) * (i % 2 === 0 ? 1 : -1);
        const cpX = clamp(midX + perp, 0, w);
        const cpY = clamp(midY - perp, 0, h);
        coords.push({ x1, y1, x2, y2, cpX, cpY, key: `${li}-${rightSlotIndex}` });
      }
    });
    setLineCoords(coords);
    setAreaSize({ width: w, height: h });
  }, [connections, shuffledRightIndices]);

  useEffect(() => {
    updateLineCoords();
  }, [updateLineCoords]);

  useEffect(() => {
    const areaEl = areaRef.current;
    if (!areaEl) return;
    const raf = requestAnimationFrame(() => updateLineCoords());
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => updateLineCoords());
    });
    ro.observe(areaEl);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [updateLineCoords]);

  const handleReset = () => {
    if (readOnly) return;
    setConnections({});
    notifyChange({});
  };

  const handleShuffle = () => {
    if (readOnly) return;
    const next = shuffleArray(pairs.map((_, i) => i));
    setShuffledRightIndices(next);
    setConnections({});
    notifyChange({}, next);
  };

  const connectedRightSet = new Set(Object.values(connections));

  return (
    <div className="mfs-v2" ref={containerRef}>
      {label && <h3 className="mfs-v2__title">{label}</h3>}
      <p className="mfs-v2__instruction">
        Drag from an item on the left to its matching pair on the right. Click a connected item to remove the link.
      </p>

      <div className="mfs-v2__meta">
        <span className="mfs-v2__count">{matchedCount}/{totalPairs} matched</span>
        {!readOnly && (
          <div className="mfs-v2__actions">
            <button type="button" className="mfs-v2__btn mfs-v2__btn--reset" onClick={handleReset} title="Reset all matches">
              <RotateCcw size={14} /> Reset
            </button>
            <button type="button" className="mfs-v2__btn mfs-v2__btn--shuffle" onClick={handleShuffle} title="Shuffle right column">
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
        )}
      </div>

      <div className="mfs-v2__area" ref={areaRef}>
        <svg
          className="mfs-v2__lines"
          aria-hidden
          width="100%"
          height="100%"
          viewBox={`0 0 ${Math.max(1, areaSize.width)} ${Math.max(1, areaSize.height)}`}
          preserveAspectRatio="none"
          style={{ position: "absolute", top: 0, left: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}
        >
          <defs>
            <clipPath id="mfs-v2-clip">
              <rect x={0} y={0} width={Math.max(1, areaSize.width)} height={Math.max(1, areaSize.height)} />
            </clipPath>
            <linearGradient id="mfs-v2-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <g clipPath="url(#mfs-v2-clip)">
            {lineCoords.map((c) => (
              <path
                key={c.key}
                d={`M ${c.x1} ${c.y1} Q ${c.cpX} ${c.cpY} ${c.x2} ${c.y2}`}
                fill="none"
                stroke="url(#mfs-v2-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={`mfs-v2__path ${animatingConnections.has(c.key) ? "mfs-v2__path--animate" : ""}`}
              />
            ))}
            {draggingFrom !== null && dragEnd && areaRef.current && (() => {
              const rect = areaRef.current.getBoundingClientRect();
              const x2 = Math.max(0, Math.min(rect.width, dragEnd.x - rect.left));
              const y2 = Math.max(0, Math.min(rect.height, dragEnd.y - rect.top));
              const leftEl = leftRefs.current[draggingFrom];
              if (!leftEl) return null;
              const l = leftEl.getBoundingClientRect();
              const x1 = l.left - rect.left + l.width / 2;
              const y1 = l.top - rect.top + l.height / 2;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              const d = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
              return <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" className="mfs-v2__path-drag" />;
            })()}
          </g>
        </svg>

        <div className="mfs-v2__col mfs-v2__col--left">
          <div className="mfs-v2__col-header">Column A</div>
          <div className="mfs-v2__col-inner">
            {pairs.map((p, idx) => (
              <div
                key={idx}
                ref={(el) => { leftRefs.current[idx] = el; }}
                role="button"
                tabIndex={readOnly ? -1 : 0}
                className={`mfs-v2__pill mfs-v2__pill--left ${connections[idx] !== undefined ? "mfs-v2__pill--connected" : ""} ${draggingFrom === idx ? "mfs-v2__pill--dragging" : ""} ${readOnly ? "mfs-v2__pill--readonly" : ""}`}
                onClick={() => handleLeftClick(idx)}
                onMouseDown={(e) => handleLeftMouseDown(e, idx)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleLeftClick(idx); } }}
              >
                <span className="mfs-v2__badge">A{idx + 1}</span>
                <span className="mfs-v2__label">{p.left}</span>
                {connections[idx] !== undefined && (
                  <span className="mfs-v2__check" aria-hidden><Check size={16} strokeWidth={2.5} /></span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mfs-v2__col mfs-v2__col--right">
          <div className="mfs-v2__col-header">Column B</div>
          <div className="mfs-v2__col-inner">
            {rightLabels.map((labelText, rightSlotIndex) => (
              <div
                key={rightSlotIndex}
                ref={(el) => { rightRefs.current[rightSlotIndex] = el; }}
                data-mfs-right={rightSlotIndex}
                role="button"
                tabIndex={readOnly ? -1 : 0}
                className={`mfs-v2__pill mfs-v2__pill--right ${connectedRightSet.has(rightSlotIndex) ? "mfs-v2__pill--connected" : ""} ${hoverRight === rightSlotIndex && draggingFrom !== null ? "mfs-v2__pill--hover" : ""} ${readOnly ? "mfs-v2__pill--readonly" : ""}`}
                onClick={() => handleRightClick(rightSlotIndex)}
                onMouseEnter={() => setHoverRight(rightSlotIndex)}
                onMouseLeave={() => setHoverRight(null)}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && draggingFrom !== null) { e.preventDefault(); handleRightClick(rightSlotIndex); } }}
              >
                <span className="mfs-v2__badge">B{rightSlotIndex + 1}</span>
                <span className="mfs-v2__label">{labelText}</span>
                {connectedRightSet.has(rightSlotIndex) && (
                  <span className="mfs-v2__check" aria-hidden><Check size={16} strokeWidth={2.5} /></span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
