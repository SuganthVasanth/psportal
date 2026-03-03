import React, { useState, useEffect, useRef } from "react";
import { X, Send, Paperclip } from "lucide-react";

const API_BASE = "http://localhost:5000";

export default function ChatModal({ open, onClose, otherUserId, otherUserName, title }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [suggestedChanges, setSuggestedChanges] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [inferredOtherUserId, setInferredOtherUserId] = useState(null);
  const listRef = useRef(null);
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";

  const effectiveOtherUserId = otherUserId || inferredOtherUserId;

  const displayTitle = title || (otherUserId ? `Chat with ${otherUserName || "Faculty"}` : "Messages");

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    const url = otherUserId
      ? `${API_BASE}/api/messages?withUserId=${encodeURIComponent(otherUserId)}`
      : `${API_BASE}/api/messages`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.messages) ? data.messages : [];
        setMessages(list);
        if (!otherUserId && list.length > 0) {
          const first = list[0];
          const other = first.is_mine ? first.to_user_id : first.from_user_id;
          setInferredOtherUserId(other);
        } else {
          setInferredOtherUserId(null);
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [open, otherUserId, token]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!token || (!text.trim() && !file && !suggestedChanges.trim())) return;
    setSending(true);
    let file_url = "";
    let file_name = "";
    if (file) {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      try {
        const up = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const upData = await up.json();
        if (up.ok) {
          file_url = upData.url.startsWith("http") ? upData.url : `${API_BASE}${upData.url}`;
          file_name = upData.file_name || file.name;
        }
      } catch (e) {
        alert("Upload failed");
      }
      setUploading(false);
      setFile(null);
    }

    const toId = effectiveOtherUserId;
    if (!toId) {
      setSending(false);
      alert("Cannot send: no conversation started yet. An admin can start the chat from Assign Faculty.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to_user_id: toId,
          type: file_url ? "file" : "text",
          content: text.trim() || (file_url ? "" : " "),
          file_url: file_url || undefined,
          file_name: file_name || undefined,
          suggested_changes: suggestedChanges.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Send failed");
      setMessages((prev) => [...prev, { ...data, is_mine: true }]);
      setText("");
      setSuggestedChanges("");
    } catch (e) {
      alert(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <h3>{displayTitle}</h3>
          <button type="button" className="chat-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="chat-modal-body">
          <div className="chat-messages" ref={listRef}>
            {loading ? (
              <p className="chat-loading">Loading...</p>
            ) : messages.length === 0 ? (
              <p className="chat-empty">No messages yet. Send a message below.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.is_mine ? "chat-bubble-mine" : "chat-bubble-theirs"}`}>
                  {!m.is_mine && <span className="chat-sender">{m.from_name}</span>}
                  {m.type === "file" && m.file_url ? (
                    <div>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="chat-file-link">
                        {m.file_name || "Document"}
                      </a>
                      {m.content && <p className="chat-text">{m.content}</p>}
                    </div>
                  ) : (
                    m.content && <p className="chat-text">{m.content}</p>
                  )}
                  {m.suggested_changes && (
                    <div className="chat-suggested">
                      <strong>Suggested changes:</strong>
                      <p>{m.suggested_changes}</p>
                    </div>
                  )}
                  <span className="chat-time">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</span>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-area">
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              />
              <label className="chat-attach">
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
                <Paperclip size={18} /> {file ? file.name : "Attach"}
              </label>
              <button type="button" className="chat-send" onClick={handleSend} disabled={sending || uploading}>
                {sending || uploading ? "..." : <Send size={18} />}
              </button>
            </div>
            <div className="chat-suggest-row">
              <input
                type="text"
                className="chat-input chat-suggest-input"
                placeholder="Suggest changes (optional)..."
                value={suggestedChanges}
                onChange={(e) => setSuggestedChanges(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
