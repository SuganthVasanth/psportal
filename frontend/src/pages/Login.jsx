import React from "react";
import "./Login.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function LoginPage() {

  const handleGoogleSuccess = async (credentialResponse) => {
    const response = await fetch("http://localhost:5000/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: credentialResponse.credential,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Login Success Data:", data);

      // Store token
      localStorage.setItem("token", data.token);

      // Determine highest privilege role to store in localStorage for the Dashboard
      if (data.user && data.user.roles && data.user.roles.length > 0) {
        const roles = data.user.roles.map(r => r.toLowerCase());
        let primaryRole = "student"; // Default

        if (roles.includes("super_admin")) {
          primaryRole = "super_admin";
        } else if (roles.includes("admin")) {
          primaryRole = "admin";
        } else if (roles.length > 0) {
          primaryRole = roles[0];
        }

        localStorage.setItem("role", primaryRole);
      } else {
        localStorage.setItem("role", "student"); // fallback
      }

      // alert("Login Successful!");

      // Redirect to unified dashboard
      window.location.href = "/dashboard";
    } else {
      console.error("Login Error:", data);
      alert("Login Failed: " + data.message);
    }
  };

  const handleGoogleError = () => {
    console.log("Google Login Failed");
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="logo-section">
          <span className="logo-icon">⚙️</span>
          <h2>PCDP Portal</h2>
        </div>

        <h3 className="welcome-text">Hi, Welcome Back!</h3>

        <div className="input-group">
          <label>Username</label>
          <input type="text" placeholder="Enter your username" />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input type="password" placeholder="Enter your password" />
        </div>

        <button className="login-btn">Login</button>

        <div className="divider">Or</div>

        {/* 🔥 REAL GOOGLE LOGIN BUTTON */}
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