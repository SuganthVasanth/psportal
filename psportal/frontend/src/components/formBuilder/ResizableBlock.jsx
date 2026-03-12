import React from "react";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

const HANDLE_SIZE = 10;

export default function ResizableBlock({
  width,
  height,
  onResize,
  minWidth = 120,
  minHeight = 40,
  children,
  className = "",
  selected,
  onSelect,
}) {
  const handleResize = (e, { size }) => onResize?.(e, { size });

  return (
    <Resizable
      width={width}
      height={height}
      onResize={handleResize}
      minConstraints={[minWidth, minHeight]}
      handle={
        <div
          className="absolute bottom-0 right-0 z-10 cursor-se-resize"
          style={{
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: "linear-gradient(135deg, transparent 50%, #94a3b8 50%)",
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          }}
        />
      }
    >
      <div
        className={`relative rounded-xl border-2 bg-white shadow-sm transition box-border ${selected ? "border-[#8b5cf6] ring-2 ring-[#8b5cf6]/20" : "border-gray-200 hover:border-gray-300"} ${className}`}
        style={{ width, height, minHeight }}
        onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
      >
        {children}
      </div>
    </Resizable>
  );
}
