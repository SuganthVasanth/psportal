import React, { useState, useEffect } from "react";
import { templateApi } from "../../services/templateApi";
import DynamicTemplateRenderer from "./DynamicTemplateRenderer";

/**
 * Faculty integration: fetch a question template by ID and render it.
 * Use when faculty selects a question type (template) to create/edit a question.
 *
 * @param {string} templateId - MongoDB _id of the template
 * @param {object} value - Current form values (keyed by component id)
 * @param {function} onChange - (values) => void
 * @param {boolean} readOnly - Disable editing
 */
export default function TemplateQuestionForm({
  templateId,
  value = {},
  onChange,
  readOnly = false,
  componentPrefix = "",
}) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(!!templateId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!templateId) {
      setTemplate(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    templateApi
      .getById(templateId)
      .then((data) => {
        setTemplate(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load template");
        setLoading(false);
      });
  }, [templateId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading template…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }
  if (!template || !Array.isArray(template.layout) || template.layout.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No template selected or template has no components.
      </div>
    );
  }

  return (
    <DynamicTemplateRenderer
      layout={template.layout}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      componentPrefix={componentPrefix}
    />
  );
}
