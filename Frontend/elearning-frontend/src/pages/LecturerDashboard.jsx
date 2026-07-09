import { Link } from "react-router-dom";

export default function LecturerDashboard() {
  return (
    <div className="page">
      <h1>Lecturer Dashboard</h1>
      <p>Manage courses, lessons, quizzes, and student submissions.</p>

      <div className="stats">
        <div className="stat-card">
          <h2>3</h2>
          <p>My Courses</p>
        </div>

        <div className="stat-card">
          <h2>12</h2>
          <p>Student Submissions</p>
        </div>

        <div className="stat-card">
          <h2>5</h2>
          <p>Quizzes Created</p>
        </div>
      </div>

      <Link className="main-btn" to="/add-course">
        Add New Course
      </Link>
    </div>
  );
}