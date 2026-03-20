import React from "react";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";

export default function FileUploadQuestion({ config = {}, value = {}, onChange, readOnly = false }) {
  const props = config.properties || {};
  const accept = props.allowedTypes || "";
  const maxMB = props.maxSizeMB ?? 10;

  return (
    <div className={cardClass}>
      {props.label && <label className="mb-1 block text-sm font-medium text-slate-700">{props.label}</label>}
      <p className="text-xs text-slate-500 mb-2">
        {accept ? `Allowed: ${accept}` : "Any file"} · Max {maxMB} MB
      </p>
      <input
        type="file"
        accept={accept || undefined}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        onChange={(e) => onChange?.({ ...value, file: e.target.files?.[0], fileName: e.target.files?.[0]?.name })}
        disabled={readOnly}
      />
    </div>
  );
}
