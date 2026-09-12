import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../Login.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        email,
        password
      });

      const token = response.data.token;
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role !== "admin") {
        setMessage("This login is only for administrators.");
        setMessageType("error");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", payload.role);

      setMessage("Admin login successful!");
      setMessageType("success");

      setTimeout(() => {
        navigate("/admin");
      }, 500);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Admin login failed. Please check your credentials."
      );
      setMessageType("error");
    }
  };

  return (
    <div className="login-screen">

      <section className="login-brand">

        <div className="login-brand__mark">
          <div className="login-brand__crest">FF</div>
          <div className="login-brand__name">
            FFCS Fair Allocator
          </div>
        </div>

        <div className="login-brand__body">

          <h1 className="login-brand__headline">
            Fair allocation.
            <br />
            Better management.
          </h1>

          <p className="login-brand__sub">
            Manage subjects, teacher sections, student preferences,
            and fair FFCS allocations through one transparent system.
          </p>

        </div>

        <ul className="login-brand__ledger">

          <li>
            <span>01</span>
            Manage teacher sections
          </li>

          <li>
            <span>02</span>
            Run fair allocation
          </li>

          <li>
            <span>03</span>
            View allocation results
          </li>

        </ul>

      </section>

      <section className="login-form-panel">

        <div className="login-form-card">

          <div className="login-role-switch">

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Student
            </button>

            <button
              className="is-active"
              type="button"
            >
              Admin
            </button>

          </div>

          <h2 className="login-form-title">
            Admin access
          </h2>

          <p className="login-form-sub">
            Sign in to manage subjects, teacher sections,
            and student allocations.
          </p>

          <form onSubmit={handleLogin}>

            {message && (
              <div
                className={
                  messageType === "error"
                    ? "login-error"
                    : "login-success"
                }
              >
                {message}
              </div>
            )}

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

            <button
              className="login-submit"
              type="submit"
            >
              Sign in as administrator
            </button>

          </form>

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