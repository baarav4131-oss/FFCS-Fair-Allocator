import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
    const [message, setMessage] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const runAllocation = async () => {
        setLoading(true);
        setMessage("");
        setResult(null);

        try {
            const response = await api.post("/allocate/run");

            setResult(response.data);
            setMessage("Allocation completed successfully!");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Allocation failed. Please try again."
            );
        }

        setLoading(false);
    };

    const logout = () => {
        localStorage.clear();
        navigate("/admin-login");
    };

    return (
        <div className="admin-dash">

            {/* Header */}
            <header className="admin-header">
                <div className="admin-header__brand">
                    FFCS Fair Allocator
                </div>

                <div className="admin-header__user">
                    <span>Administration Portal</span>

                    <span className="admin-badge">
                        Administrator
                    </span>

                    <button
                        className="admin-logout"
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main */}
            <main className="admin-body">

                <div className="admin-intro">
                    <div>
                        <p className="admin-eyebrow">
                            ADMINISTRATION
                        </p>

                        <h1>Allocation Dashboard</h1>

                        <p className="admin-description">
                            Manage and execute the FFCS teacher allocation
                            process using the Serial Dictatorship algorithm.
                        </p>
                    </div>
                </div>

                {/* Allocation Panel */}
                <section className="allocation-panel">

                    <div className="allocation-panel__top">
                        <div className="allocation-icon">
                            ⚙
                        </div>

                        <div>
                            <h2>Run FFCS Allocation</h2>

                            <p>
                                Start the fair allocation process for all
                                registered students and their preferences.
                            </p>
                        </div>
                    </div>

                    <div className="allocation-rule">
                        <span>ALGORITHM</span>
                        <strong>Serial Dictatorship</strong>
                    </div>

                    <button
                        className="allocation-button"
                        onClick={runAllocation}
                        disabled={loading}
                    >
                        {loading
                            ? "Running Allocation..."
                            : "Run Allocation"}
                    </button>

                    {message && (
                        <div
                            className={
                                result
                                    ? "allocation-message success"
                                    : "allocation-message error"
                            }
                        >
                            {message}
                        </div>
                    )}
                </section>

                {/* Results */}
                {result && (
                    <section className="admin-results">

                        <div className="results-heading">
                            <div>
                                <p className="admin-eyebrow">
                                    LATEST RUN
                                </p>
                                <h2>Allocation Results</h2>
                            </div>
                        </div>

                        <div className="result-grid">

                            <div className="result-card result-card--success">
                                <span className="result-number">
                                    {result.allocated}
                                </span>

                                <span className="result-label">
                                    Students Allocated
                                </span>
                            </div>

                            <div className="result-card result-card--warning">
                                <span className="result-number">
                                    {result.unallocated}
                                </span>

                                <span className="result-label">
                                    Unallocated
                                </span>
                            </div>

                        </div>
                    </section>
                )}

                {/* Priority */}
                <section className="priority-panel">

                    <div className="priority-heading">
                        <p className="admin-eyebrow">
                            ALLOCATION RULE
                        </p>

                        <h2>Priority Order</h2>

                        <p>
                            Students are processed according to their
                            eligibility tier, with higher-priority students
                            allocated first.
                        </p>
                    </div>

                    <div className="priority-list">

                        <div className="priority-row">
                            <span className="priority-number">01</span>

                            <div className="priority-content">
                                <strong>Tier 1</strong>
                                <span>CGPA ≥ 9</span>
                            </div>

                            <span className="priority-tag priority-tag--gold">
                                Highest Priority
                            </span>
                        </div>

                        <div className="priority-row">
                            <span className="priority-number">02</span>

                            <div className="priority-content">
                                <strong>Tier 2</strong>
                                <span>100% Attendance</span>
                            </div>

                            <span className="priority-tag priority-tag--green">
                                Priority
                            </span>
                        </div>

                        <div className="priority-row">
                            <span className="priority-number">03</span>

                            <div className="priority-content">
                                <strong>Tier 3</strong>
                                <span>All remaining students</span>
                            </div>

                            <span className="priority-tag priority-tag--clay">
                                Standard
                            </span>
                        </div>

                    </div>
                </section>

            </main>
        </div>
    );
}

export default AdminDashboard;