import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../Login.css";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    cgpa: "",
    attendance_pct: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/signup", {
        ...form,
        cgpa: Number(form.cgpa),
        attendance_pct: Number(form.attendance_pct)
      });

      setMessage(response.data.message);
      setMessageType("success");

      setForm({
        name: "",
        cgpa: "",
        attendance_pct: "",
        email: "",
        password: ""
      });

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Signup failed. Please try again."
      );
      setMessageType("error");
    }
  };

  return (
    <div className="login-screen">

      {/* LEFT BRAND PANEL */}
      <section className="login-brand">

        <div className="login-brand__mark">
          <div className="login-brand__crest">FF</div>

          <div className="login-brand__name">
            FFCS Fair Allocator
          </div>
        </div>

        <div className="login-brand__body">

          <h1 className="login-brand__headline">
            Your preferences.
            <br />
            Your choices.
          </h1>

          <p className="login-brand__sub">
            Create your student account and participate in a
            transparent, preference-driven teacher allocation process.
          </p>

        </div>

        <ul className="login-brand__ledger">

          <li>
            <span>01</span>
            Enter your academic details
          </li>

          <li>
            <span>02</span>
            Rank your teacher preferences
          </li>

          <li>
            <span>03</span>
            Receive fair allocation
          </li>

        </ul>

      </section>

      {/* RIGHT FORM PANEL */}
      <section className="login-form-panel">

        <div
          className="login-form-card"
          style={{ maxWidth: "430px" }}
        >

          <div className="login-role-switch">

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Student Login
            </button>

            <button
              type="button"
              className="is-active"
            >
              Create Account
            </button>

          </div>

          <h2 className="login-form-title">
            Create your account
          </h2>

          <p className="login-form-sub">
            Register as a student to access the FFCS allocation portal.
          </p>

          <form onSubmit={handleSignup}>

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

              <span>Full name</span>

              <input
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />

            </label>

            <label className="login-field">

              <span>CGPA</span>

              <input
                name="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 9.20"
                value={form.cgpa}
                onChange={handleChange}
                required
              />

            </label>

            <label className="login-field">

              <span>Attendance percentage</span>

              <input
                name="attendance_pct"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 95"
                value={form.attendance_pct}
                onChange={handleChange}
                required
              />

            </label>

            <label className="login-field">

              <span>College email</span>

              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />

            </label>

            <label className="login-field">

              <span>Password</span>

              <input
                name="password"
                type="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />

            </label>

            <button
              className="login-submit"
              type="submit"
            >
              Create student account
            </button>

          </form>

          <p className="login-signup-hint">

            Already have an account?{" "}

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
              Sign in
            </button>

          </p>

        </div>

      </section>

    </div>
  );
}

export default Signup;