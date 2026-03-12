import { useState, useCallback } from "react";

/**
 * Undo/redo for template layout array.
 * Each history entry is a full copy of the layout.
 */
export function useTemplateHistory(initialLayout = [], maxHistory = 50) {
  const [history, setHistory] = useState([JSON.stringify(initialLayout)]);
  const [index, setIndex] = useState(0);

  const current = useCallback(() => {
    try {
      return JSON.parse(history[index]) || [];
    } catch {
      return [];
    }
  }, [history, index]);

  const push = useCallback(
    (layout) => {
      const next = [...history.slice(0, index + 1), JSON.stringify(layout)].slice(-maxHistory);
      setHistory(next);
      setIndex(next.length - 1);
    },
    [history, index, maxHistory]
  );

  const undo = useCallback(() => {
    if (index <= 0) return null;
    const prev = JSON.parse(history[index - 1]);
    setIndex((i) => i - 1);
    return prev;
  }, [history, index]);

  const redo = useCallback(() => {
    if (index >= history.length - 1) return null;
    const next = JSON.parse(history[index + 1]);
    setIndex((i) => i + 1);
    return next;
  }, [history, index]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const reset = useCallback((layout) => {
    const serialized = JSON.stringify(layout);
    setHistory([serialized]);
    setIndex(0);
  }, []);

  return { current, push, undo, redo, canUndo, canRedo, reset };
}
