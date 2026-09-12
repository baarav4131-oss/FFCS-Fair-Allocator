import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
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

            localStorage.setItem("token", response.data.token);
localStorage.setItem("studentId", response.data.studentId);
navigate("/dashboard");

            const token = response.data.token;
            const payload = JSON.parse(atob(token.split(".")[1]));

           localStorage.setItem("studentId", payload.studentId);
localStorage.setItem("role", payload.role);

setMessage("Login successful!");
setMessageType("success");

setTimeout(() => {
    if (payload.role === "admin") {
        navigate("/admin");
    } else {
        navigate("/student");
    }
}, 500);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Login failed. Please check your credentials."
            );
            setMessageType("error");
        }
    };

    return (
        <div className="auth-section">
            <div className="auth-header">
                <div className="college-logo">🎓</div>

                <h2>Student Login</h2>

                <p>Sign in to access the FFCS portal</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">

                <label>College Email</label>

                <input
                    type="email"
                    placeholder="Enter your college email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label>Password</label>

                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    className="auth-button"
                >
                    Login to Portal
                </button>

            </form>

            {message && (
                <p className={messageType}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default Login;