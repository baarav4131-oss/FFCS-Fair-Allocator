import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../Login.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaToken, setMfaToken] = useState(null);
  const [showMfa, setShowMfa] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Step 1: Password Check -> Prompts for TOTP Challenge
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password
      });

      // Check if MFA Challenge is required (Mandatory for Admin)
      if (response.data.mfaRequired) {
        setMfaToken(response.data.mfaToken);
        setShowMfa(true);
        setMessage("Two-factor authentication required. Enter the 6-digit code from your Authenticator app.");
        setMessageType("success");
        setLoading(false);
        return;
      }

      // If direct login without MFA
      completeLogin(response.data.token);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Admin login failed. Please check your credentials."
      );
      setMessageType("error");
      setLoading(false);
    }
  };

  // Step 2: TOTP Verification -> Receives Access JWT
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/mfa/verify", {
        mfaToken,
        code: otpCode
      });

      completeLogin(response.data.token);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Invalid TOTP code. Please try again."
      );
      setMessageType("error");
      setLoading(false);
    }
  };

  const completeLogin = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") {
        setMessage("This login is only for administrators.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", payload.role);

      setMessage("Admin authentication successful!");
      setMessageType("success");

      setTimeout(() => {
        navigate("/admin");
      }, 500);
    } catch (e) {
      setMessage("Failed to parse token session.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <section className="login-brand">
        <div className="login-brand__mark">
          <div className="login-brand__crest">FF</div>
          <div className="login-brand__name">FFCS Fair Allocator</div>
        </div>

        <div className="login-brand__body">
          <h1 className="login-brand__headline">
            Fair allocation.
            <br />
            Better management.
          </h1>

          <p className="login-brand__sub">
            Manage subjects, teacher sections, student preferences,
            and fair FFCS allocations through one transparent, hardened system.
          </p>
        </div>

        <ul className="login-brand__ledger">
          <li>
            <span>01</span>
            Manage teacher sections
          </li>
          <li>
            <span>02</span>
            Run fair allocation (Atomic Lock)
          </li>
          <li>
            <span>03</span>
            TOTP MFA Authenticator Protected
          </li>
        </ul>
      </section>

      <section className="login-form-panel">
        <div className="login-form-card">
          <div className="login-role-switch">
            <button type="button" onClick={() => navigate("/login")}>
              Student
            </button>
            <button className="is-active" type="button">
              Admin
            </button>
          </div>

          <h2 className="login-form-title">
            {showMfa ? "Two-Factor Challenge" : "Admin access"}
          </h2>

          <p className="login-form-sub">
            {showMfa
              ? "Open Google Authenticator or Microsoft Authenticator and enter your 6-digit TOTP code."
              : "Sign in to manage subjects, teacher sections, and student allocations."}
          </p>

          {message && (
            <div className={messageType === "error" ? "login-error" : "login-success"}>
              {message}
            </div>
          )}

          {!showMfa ? (
            <form onSubmit={handleLogin}>
              <label className="login-field">
                <span>Administrator email</span>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="login-field">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Sign in as administrator"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <label className="login-field">
                <span>6-Digit Authenticator Code (TOTP)</span>
                <input
                  type="text"
                  maxLength="6"
                  pattern="\d{6}"
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  autoFocus
                  required
                />
              </label>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? "Verifying TOTP..." : "Verify & Sign in"}
              </button>

              <button
                type="button"
                onClick={() => { setShowMfa(false); setMessage(""); }}
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "14px",
                  width: "100%",
                  textAlign: "center"
                }}
              >
                ← Back to credentials
              </button>
            </form>
          )}

          <p className="login-signup-hint">
            Student account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--brass-600)",
                fontWeight: 500
              }}
            >
              Student login
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}

export default AdminLogin;
