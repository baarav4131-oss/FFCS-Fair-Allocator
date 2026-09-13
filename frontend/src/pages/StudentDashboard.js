import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/StudentDashboard.css";

const MIN_CREDITS = 15;
const MAX_CREDITS = 30;

function StudentDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [submittedPreferences, setSubmittedPreferences] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

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
  loadSubjects();
  loadSections();

  if (studentId) {
    loadSubmittedPreferences();
  }
}, [studentId]);

  const loadSubjects = async () => {
    try {
      const response = await api.get("/subjects");
      setSubjects(response.data);
    } catch (error) {
      setMessage("Failed to load subjects");
      setMessageType("error");
    }
  };

  const loadSections = async () => {
    try {
      const response = await api.get("/teacher-sections");
      setSections(response.data);
    } catch (error) {
      setMessage("Failed to load teacher sections");
      setMessageType("error");
    }
  };

  const loadSubmittedPreferences = async () => {
    try {
      const response = await api.get(`/preferences/${studentId}`);
      setSubmittedPreferences(response.data);
    } catch (error) {
      console.log("Failed to load submitted preferences");
    }
  };

  const hasSubmittedSubject = (subjectId) => {
    return submittedPreferences.some(
      (preference) =>
        String(preference.subjectId) === String(subjectId)
    );
  };

  const totalCredits = submittedPreferences.reduce(
    (total, preference) => {
      const subject = subjects.find(
        (subject) =>
          String(subject._id) === String(preference.subjectId)
      );

      return total + (subject?.credits || 0);
    },
    0
  );

  const selectedSubjectData = subjects.find(
    (subject) =>
      String(subject._id) === String(selectedSubject)
  );

  const selectedSubjectCredits =
    selectedSubjectData?.credits || 0;

  const projectedCredits =
    totalCredits + selectedSubjectCredits;

  const handleTeacherSelect = (teacherId) => {
    if (selectedTeachers.includes(teacherId)) {
      setSelectedTeachers(
        selectedTeachers.filter((id) => id !== teacherId)
      );
    } else {
      setSelectedTeachers([
        ...selectedTeachers,
        teacherId
      ]);
    }
  };

  const submitPreferences = async () => {
    if (!studentId) {
      setMessage("Please login first.");
      setMessageType("error");
      return;
    }

    if (!selectedSubject) {
      setMessage("Please select a subject.");
      setMessageType("error");
      return;
    }

    if (hasSubmittedSubject(selectedSubject)) {
      setMessage(
        "You have already submitted preferences for this subject."
      );
      setMessageType("error");
      return;
    }

    if (selectedTeachers.length === 0) {
      setMessage("Please select at least one teacher.");
      setMessageType("error");
      return;
    }

    if (projectedCredits > MAX_CREDITS) {
      setMessage(
        `Cannot select this subject. Maximum allowed credits are ${MAX_CREDITS}.`
      );
      setMessageType("error");
      return;
    }

    try {
      await api.post("/preferences", {
        studentId,
        subjectId: selectedSubject,
        rankedTeacherIds: selectedTeachers
      });

      setMessage(
        `Preferences submitted successfully! Total credits: ${projectedCredits}`
      );
      setMessageType("success");

      setSelectedSubject("");
      setSelectedTeachers([]);

      await loadSubmittedPreferences();

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to submit preferences."
      );
      setMessageType("error");
    }
  };

  const finalizeRegistration = () => {
    if (totalCredits < MIN_CREDITS) {
      setMessage(
        `You need at least ${MIN_CREDITS} credits to complete registration. You currently have ${totalCredits} credits.`
      );
      setMessageType("error");
      return;
    }

    if (totalCredits > MAX_CREDITS) {
      setMessage(
        `Maximum allowed credits are ${MAX_CREDITS}.`
      );
      setMessageType("error");
      return;
    }

    setMessage(
      `Registration completed successfully with ${totalCredits} credits!`
    );
    setMessageType("success");
  };

  const availableSubjects = subjects.filter(
    (subject) => !hasSubmittedSubject(subject._id)
  );

  const availableSections = sections.filter(
    (section) =>
      String(section.subject_id) === String(selectedSubject) ||
      String(section.subject_id?._id) === String(selectedSubject)
  );

  return (
    <div className="dash">

      {/* HEADER */}
      <header className="dash-header">

        <div className="dash-header__brand">
          FFCS Fair Allocator
        </div>

        <div className="dash-header__user">

          <span>Student Portal</span>

          <span className="badge badge--tier1">
            Student
          </span>

          <button
            type="button"
            onClick={() => navigate("/results")}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              padding: "7px 12px",
              borderRadius: "4px"
            }}
          >
            Results
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
              padding: "7px 12px",
              borderRadius: "4px"
            }}
          >
            Logout
          </button>

        </div>

      </header>

      {/* BODY */}
      <main className="dash-body">

        <div className="dash-intro">

          <h1>Student Dashboard</h1>

          <p>
            Select a subject, rank your preferred teachers,
            and submit your choices for fair FFCS allocation.
          </p>

        </div>

        {/* STATS */}
        <div className="dash-stats">

          <div className="stat stat--primary">

            <div className="stat__value">
              {subjects.length}
            </div>

            <div className="stat__label">
              Available Subjects
            </div>

          </div>

          <div className="stat">

            <div className="stat__value">
              {sections.length}
            </div>

            <div className="stat__label">
              Teacher Sections
            </div>

          </div>

          <div className="stat">

            <div className="stat__value">
              {selectedTeachers.length}
            </div>

            <div className="stat__label">
              Selected Preferences
            </div>

          </div>

          <div className="stat">

            <div className="stat__value">
              {totalCredits}
            </div>

            <div className="stat__label">
              Selected Credits
            </div>

          </div>

        </div>

        {/* CREDIT INFORMATION */}
        <div
          style={{
            marginBottom: "24px",
            padding: "18px 22px",
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(20,30,45,0.12)",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap"
          }}
        >

          <div>

            <strong>
              Credit Requirement
            </strong>

            <p style={{ margin: "6px 0 0" }}>
              Minimum: {MIN_CREDITS} credits
              &nbsp; | &nbsp;
              Maximum: {MAX_CREDITS} credits
            </p>

          </div>

          <div>

            <strong>
              Current Credits: {totalCredits}
            </strong>

            {selectedSubjectData && (
              <p style={{ margin: "6px 0 0" }}>
                After this course: {projectedCredits} credits
              </p>
            )}

          </div>

        </div>

        {/* PREFERENCE PANEL */}
        <section className="ballot">

          <div className="ballot__head">

            <h2>
              Course Preference Selection
            </h2>

            <span className="ballot__hint">
              Rank teachers in your preferred order
            </span>

          </div>

          <label className="ballot__select">

            <span>
              Select Subject
            </span>

            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTeachers([]);
                setMessage("");
              }}
            >

              <option value="">
                Choose a subject
              </option>

              {availableSubjects.map((subject) => (

                <option
                  key={subject._id}
                  value={subject._id}
                >
                  {subject.code} — {subject.name} ({subject.credits} credits)
                </option>

              ))}

            </select>

          </label>

          {selectedSubject && (

            <div>

              {selectedSubjectData && (
                <div
                  style={{
                    margin: "15px 0",
                    fontSize: "14px"
                  }}
                >
                  <strong>
                    {selectedSubjectData.name}
                  </strong>
                  {" — "}
                  {selectedSubjectData.credits} credits
                  {" | "}
                  Projected total: {projectedCredits}/{MAX_CREDITS}
                </div>
              )}

              <div className="ballot__head">

                <h2>
                  Available Teachers
                </h2>

                <span className="ballot__hint">
                  Click teachers to rank them
                </span>

              </div>

              {availableSections.length === 0 ? (

                <p>
                  No teacher sections available for this subject.
                </p>

              ) : (

                <ul className="ballot__list">

                  {availableSections.map((section) => {

                    const rank =
                      selectedTeachers.indexOf(section._id) + 1;

                    const isSelected =
                      selectedTeachers.includes(section._id);

                    return (

                      <li
                        key={section._id}
                        className={
                          isSelected ? "is-ranked" : ""
                        }
                        onClick={() =>
                          handleTeacherSelect(section._id)
                        }
                      >

                        <span className="ballot__rank">
                          {isSelected ? rank : "—"}
                        </span>

                        <span className="ballot__teacher">

                          <strong>
                            {section.teacher_name}
                          </strong>

                        </span>

                        <span className="ballot__seats">
                          {section.seats_remaining} seats remaining
                        </span>

                      </li>

                    );

                  })}

                </ul>

              )}

              {/* RANKING */}
              {selectedTeachers.length > 0 && (

                <div className="ranking-box">

                  <h3>
                    Your Preference Ranking
                  </h3>

                  {selectedTeachers.map(
                    (teacherId, index) => {

                      const teacher =
                        sections.find(
                          (section) =>
                            section._id === teacherId
                        );

                      return (

                        <div
                          className="ranking-item"
                          key={teacherId}
                        >

                          <span>
                            {index + 1}
                          </span>

                          <strong>
                            {teacher?.teacher_name}
                          </strong>

                        </div>

                      );

                    }
                  )}

                </div>

              )}

              <button
                className="ballot__submit"
                type="button"
                onClick={submitPreferences}
                disabled={
                  selectedTeachers.length === 0 ||
                  projectedCredits > MAX_CREDITS
                }
              >
                Submit Preferences
              </button>

            </div>

          )}

          {message && (

            <div
              className={
                messageType === "error"
                  ? "login-error"
                  : "login-success"
              }
              style={{ marginTop: "20px" }}
            >
              {message}
            </div>

          )}

        </section>

        {/* REGISTRATION COMPLETION */}
        <section
          style={{
            marginTop: "24px",
            padding: "22px",
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(20,30,45,0.12)",
            borderRadius: "8px"
          }}
        >

          <h2>
            Complete Registration
          </h2>

          <p>
            You need between {MIN_CREDITS} and {MAX_CREDITS}
            {" "}credits to complete your registration.
          </p>

          {totalCredits < MIN_CREDITS && (

            <p>
              You need{" "}
              <strong>
                {MIN_CREDITS - totalCredits}
              </strong>{" "}
              more credits.
            </p>

          )}

          {totalCredits >= MIN_CREDITS &&
            totalCredits <= MAX_CREDITS && (

              <p>
                Your credit requirement is satisfied.
              </p>

          )}

          <button
            className="ballot__submit"
            type="button"
            onClick={finalizeRegistration}
            disabled={
              totalCredits < MIN_CREDITS ||
              totalCredits > MAX_CREDITS
            }
          >
            Finalize Registration
          </button>

        </section>

      </main>

    </div>
  );
}

export default StudentDashboard;