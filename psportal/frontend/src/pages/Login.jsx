import React, { useState } from "react";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";

/** Must match backend host (and Google “Authorized redirect URI” uses the same host as /auth/google/callback). */
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:5000";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-gray-300 bg-white " +
  "focus:ring-2 focus:ring-black focus:border-black outline-none transition " +
  "disabled:opacity-60";

function storeAuthAndRedirect(data) {
  localStorage.setItem("token", data.token);
  if (data.user) {
    if (data.user.roles && data.user.roles.length > 0) {
      const roles = data.user.roles.map((r) => (typeof r === "string" ? r : r.role_name || r).toLowerCase());
      localStorage.setItem("roles", JSON.stringify(roles));
      let primaryRole = "student";
      if (roles.includes("super_admin")) primaryRole = "super_admin";
      else if (roles.includes("admin")) primaryRole = "admin";
      else primaryRole = roles[0];
      localStorage.setItem("role", primaryRole);
    } else {
      localStorage.setItem("roles", JSON.stringify(["student"]));
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

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center px-6 py-10">
      <div
        className="
          w-full max-w-5xl h-auto flex flex-col md:flex-row
          rounded-2xl overflow-hidden border border-gray-200 bg-white
        "
      >
        <section
          className="
            w-full md:w-1/2 shrink-0 flex flex-col justify-center
            px-12 py-10
            bg-white
          "
        >
          <div className="logo-section">
            <h2>PCPD Portal</h2>
          </div>

          <h3 className="welcome-text text-3xl font-semibold text-gray-900">Login</h3>
          <p className="welcome-subtext text-sm text-gray-500">Enter your account details</p>

          {error && <div className="login-error-msg">{error}</div>}

          <form onSubmit={handleEmailLogin}>
            <div className="input-group">
              <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div className="input-group mt-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="
                w-full py-3 rounded-lg mt-6
                bg-black text-white font-medium
                hover:bg-gray-900 transition
                disabled:opacity-60 disabled:cursor-not-allowed
              "
              disabled={loading}
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          <button
            type="button"
            className="
              w-full py-3 rounded-lg mt-4
              border border-gray-300 bg-white
              flex items-center justify-center gap-2
              hover:bg-gray-50 transition
              text-gray-800 font-medium text-sm
            "
            onClick={handleGoogleLogin}
          >
            <FcGoogle size={20} />
            <span>Sign in with Google</span>
          </button>
        </section>

        <section
          className="
            relative w-full md:w-1/2 shrink-0 flex flex-col items-center justify-center
            p-12 min-h-[280px] md:min-h-0 overflow-hidden
            bg-gradient-to-br from-[#F1F5F9] to-[#E2E8F0]
          "
        >
          <div className="relative z-10 login-visual-overlay w-full text-center mb-10">
            <h1>Welcome to PCPD Portal</h1>
            <p>Login to access your account</p>
          </div>
          <div className="relative z-10 flex flex-1 items-center justify-center w-full min-h-[220px]">
            <img
              src="/dark2.svg"
              alt="Light theme illustration"
              className="block dark:hidden max-w-sm w-full h-auto object-contain opacity-90"
            />
            <img
              src="/dark2.svg"
              alt="Dark theme illustration"
              className="hidden dark:block max-w-sm w-full h-auto object-contain opacity-90"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
