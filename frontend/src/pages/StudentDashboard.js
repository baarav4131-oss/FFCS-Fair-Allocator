import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/StudentDashboard.css";

function StudentDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
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
  }, []);

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

    if (selectedTeachers.length === 0) {
      setMessage("Please select at least one teacher.");
      setMessageType("error");
      return;
    }

    try {
      await api.post("/preferences", {
        studentId,
        subjectId: selectedSubject,
        rankedTeacherIds: selectedTeachers
      });

      setMessage("Preferences submitted successfully!");
      setMessageType("success");

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to submit preferences."
      );
      setMessageType("error");
    }
  };

  const availableSections = sections.filter(
    (section) =>
      section.subject_id === selectedSubject ||
      section.subject_id?._id === selectedSubject
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
              {selectedSubject ? "1" : "0"}
            </div>

            <div className="stat__label">
              Subject Selected
            </div>

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

              {subjects.map((subject) => (
                <option
                  key={subject._id}
                  value={subject._id}
                >
                  {subject.code} — {subject.name}
                </option>
              ))}

            </select>

          </label>

          {selectedSubject && (
            <div>

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
                disabled={selectedTeachers.length === 0}
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

      </main>

    </div>
  );
}

export default StudentDashboard;