import React, { useState } from "react";
import "./Login.css";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE = "http://localhost:5000";

function storeAuthAndRedirect(data) {
  localStorage.setItem("token", data.token);
  if (data.user) {
    if (data.user.roles && data.user.roles.length > 0) {
      const roles = data.user.roles.map((r) => (typeof r === "string" ? r : r.role_name || r).toLowerCase());
      let primaryRole = "student";
      if (roles.includes("super_admin")) primaryRole = "super_admin";
      else if (roles.includes("admin")) primaryRole = "admin";
      else primaryRole = roles[0];
      localStorage.setItem("role", primaryRole);
    } else {
      localStorage.setItem("role", "student");
    }
    if (data.user.name) localStorage.setItem("userName", data.user.name);
    else if (data.user.email) localStorage.setItem("userName", data.user.email.split("@")[0]);
    if (data.user.register_no) localStorage.setItem("register_no", data.user.register_no);
  }
  window.location.href = "/dashboard";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (response.ok) {
        storeAuthAndRedirect(data);
        return;
      }
      setError(data.message || "Login failed.");
    } catch (err) {
      setError("Cannot reach server. Start the backend: in psportal/backend run 'npm run dev' or 'node server.js'. Then try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        storeAuthAndRedirect(data);
      } else {
        setError(data.message || "Google login failed.");
      }
    } catch (err) {
      setError("Cannot reach server. Start the backend: in psportal/backend run 'npm run dev' or 'node server.js'.");
    }
  };

  const handleGoogleError = (err) => {
    if (err?.type === "idpif_restricted" || String(err).includes("origin")) {
      setError("Google Sign-In: Add this page's URL to Google Cloud Console → Credentials → your OAuth client → Authorized JavaScript origins (e.g. http://localhost:5173).");
    } else {
      setError("Google Sign-In was cancelled or failed. Use email/password instead.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="logo-section">
          <span className="logo-icon"></span>
          <h2>PCDP Portal</h2>
        </div>

        <h3 className="welcome-text">Hi, Welcome Back!</h3>

        {error && <div className="login-error-msg">{error}</div>}

        <form onSubmit={handleEmailLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>


        <div className="divider">Or</div>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

      </div>
    </div>
  );
}