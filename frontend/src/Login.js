import React, { useState } from "react";
import api from "./api";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
        const response = await api.post(
    "/auth/login",
    { email, password }
);

      localStorage.setItem("token", response.data.token);

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to login. Please try again."
      );
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
            Better choices.
          </h1>

          <p className="login-brand__sub">
            A transparent teacher-slot allocation system designed to make
            course registration fair, structured, and preference-driven.
          </p>
        </div>

        <ul className="login-brand__ledger">
          <li>
            <span>01</span>
            Priority-based allocation
          </li>
          <li>
            <span>02</span>
            Ranked teacher preferences
          </li>
          <li>
            <span>03</span>
            Transparent seat availability
          </li>
        </ul>
      </section>

      <section className="login-form-panel">
        <div className="login-form-card">
        <div className="login-role-switch">
  <button
    className={!isAdmin ? "is-active" : ""}
    type="button"
    onClick={() => setIsAdmin(false)}
  >
    Student
  </button>

<button
  className={isAdmin ? "is-active" : ""}
  type="button"
  onClick={() => navigate("/admin-login")}
>
  Admin
</button>
</div>

          <h2 className="login-form-title">
  {isAdmin ? "Admin access" : "Welcome back"}
</h2>

<p className="login-form-sub">
  {isAdmin
    ? "Sign in to manage subjects, teacher sections, and allocations."
    : "Sign in to manage your FFCS teacher preferences."}
</p>

          <form onSubmit={handleLogin}>
            {error && <div className="login-error">{error}</div>}

            <label className="login-field">
              <span>Email address</span>
              <input
                type="email"
                placeholder="you@example.com"
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
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="login-signup-hint">
            Don't have an account?{" "}
            <Link to="/signup">Create one</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;