import React from "react";
import { X } from "lucide-react";

export default function ProfileDetailsModal({ open, onClose, profile }) {
  if (!open) return null;

  const name = profile?.name || "User";
  const id = profile?.id || profile?.registerNo || "N/A";
  const userId = profile?.userId || profile?.registerNo || "N/A";
  const avatarUrl = profile?.avatarUrl || "";

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>User Profile</h3>
          <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close profile modal">
            <X size={16} />
          </button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-modal-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="profile-modal-avatar" />
            ) : (
              <div className="profile-modal-avatar profile-modal-avatar-fallback">
                {String(name)
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-modal-grid">
            <div className="profile-modal-row">
              <span className="profile-modal-label">Id</span>
              <span className="profile-modal-value">{id}</span>
            </div>
            <div className="profile-modal-row">
              <span className="profile-modal-label">User Id</span>
              <span className="profile-modal-value">{userId}</span>
            </div>
            <div className="profile-modal-row">
              <span className="profile-modal-label">Name</span>
              <span className="profile-modal-value">{name}</span>
            </div>
          </div>
        </div>

        <button type="button" className="profile-modal-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
