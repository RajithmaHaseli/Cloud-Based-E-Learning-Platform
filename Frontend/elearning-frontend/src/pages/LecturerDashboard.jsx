import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function LecturerDashboard() {
  const [stats, setStats] = useState({ totalCourses: 0, totalAssignmentSubmissions: 0, totalQuizSubmissions: 0 });

  useEffect(() => {
    fetch("http://localhost:8080/api/progress/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page">
      <h1>Lecturer Dashboard</h1>
      <p>Manage courses, lessons, quizzes, and student submissions.</p>

      <div className="stats">
        <div className="stat-card">
          <h2>{stats.totalCourses}</h2>
          <p>Active Courses</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalAssignmentSubmissions}</h2>
          <p>Student Submissions</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalQuizSubmissions}</h2>
          <p>Quizzes Completed</p>
        </div>
      </div>

      <Link className="main-btn" to="/add-course">
        Add New Course
      </Link>
    </div>
  );
}