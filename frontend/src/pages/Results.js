import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Results.css";

function Results() {
    const [allocations, setAllocations] = useState([]);
    const [message, setMessage] = useState("");

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

let studentId = null;

if (token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        studentId = payload.studentId;
    } catch (error) {
        console.log("Invalid token");
    }
}

useEffect(() => {
    const loadResults = async () => {
        if (!studentId) {
            setMessage("Please login to view your results.");
            return;
        }

        try {
            const response = await api.get(
                `/allocate/results/${studentId}`
            );

            setAllocations(response.data);

            if (response.data.length === 0) {
                setMessage("No allocation results found yet.");
            }
        } catch (error) {
            setMessage("Unable to load allocation results.");
        }
    };

    loadResults();
}, [studentId]);

    return (
        <div className="results-dash">

            <header className="results-header">
                <div className="results-header__brand">
                    FFCS Fair Allocator
                </div>

                <div className="results-header__right">
                    <span>Student Portal</span>

                    <span className="results-badge">
                        FFCS 2026
                    </span>

                    <button
                        className="results-logout"
                        onClick={() => {
                            localStorage.clear();
                            navigate("/login");
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="results-body">

                <div className="results-intro">
                    <p className="results-eyebrow">
                        ALLOCATION OUTCOME
                    </p>

                    <h1>Your Allocation Results</h1>

                    <p>
                        View your final FFCS teacher allocations and the
                        preference rank achieved for each course.
                    </p>
                </div>

                {allocations.length > 0 ? (
                    <>
                        <section className="results-summary">

                            <div>
                                <span className="summary-number">
                                    {allocations.length}
                                </span>

                                <span className="summary-label">
                                    Courses Allocated
                                </span>
                            </div>

                            <div className="summary-status">
                                <span className="status-dot"></span>
                                Allocation Completed
                            </div>

                        </section>

                        <section className="allocation-results">

                            <div className="results-section-head">
                                <div>
                                    <p className="results-eyebrow">
                                        FINAL ALLOCATION
                                    </p>

                                    <h2>Assigned Courses</h2>
                                </div>

                                <span className="results-count">
                                    {allocations.length} course
                                    {allocations.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div className="allocation-list">

                                {allocations.map((allocation) => (
                                    <div
                                        className="allocation-row"
                                        key={allocation._id}
                                    >

                                        <div className="allocation-course">
                                            <span className="course-code">
                                                {allocation.subject_id?.code}
                                            </span>

                                            <strong>
                                                {allocation.subject_id?.name}
                                            </strong>
                                        </div>

                                        <div className="allocation-teacher">
                                            <span>TEACHER</span>
                                            <strong>
                                                {allocation.teacher_id?.teacher_name}
                                            </strong>
                                        </div>

                                        <div className="allocation-rank">
                                            <span>PREFERENCE</span>

                                            <div className="rank-circle">
                                                {allocation.preference_rank_achieved}
                                            </div>

                                            <strong>
                                                Rank #
                                                {allocation.preference_rank_achieved}
                                            </strong>
                                        </div>

                                    </div>
                                ))}

                            </div>

                        </section>
                    </>
                ) : (

                    <section className="empty-result">

                        <div className="empty-result__icon">
                            ✓
                        </div>

                        <p className="results-eyebrow">
                            RESULTS PENDING
                        </p>

                        <h2>No Allocation Yet</h2>

                        <p>
                            {message ||
                                "Your allocation results will appear here after the allocation process is completed."}
                        </p>

                        <button
                            className="back-dashboard"
                            onClick={() => navigate("/dashboard")}
                        >
                            Back to Dashboard
                        </button>

                    </section>

                )}

            </main>
        </div>
    );
}

export default Results;