import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState({ totalCourses: 0, totalQuizSubmissions: 0, totalAssignmentSubmissions: 0 });

  useEffect(() => {
    fetch("http://localhost:8080/api/progress/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page">
      <h1>Student Dashboard</h1>
      <p>Welcome, {user?.name || user?.email}</p>

      <div className="stats">
        <div className="stat-card">
          <h2>{stats.totalCourses}</h2>
          <p>Available Courses</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalQuizSubmissions}</h2>
          <p>Quizzes Submitted</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalAssignmentSubmissions}</h2>
          <p>Assignments Submitted</p>
        </div>
      </div>

      <Link className="main-btn" to="/courses">
        View Courses
      </Link>
    </div>
  );
}