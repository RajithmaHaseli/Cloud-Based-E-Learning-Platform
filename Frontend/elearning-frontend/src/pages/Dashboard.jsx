import { Link } from "react-router-dom";
import { courses } from "../data";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="page">
      <h1>Student Dashboard</h1>
      <p>Welcome, {user?.name || user?.email}</p>

      <div className="stats">
        <div className="stat-card">
          <h2>{courses.length}</h2>
          <p>Available Courses</p>
        </div>

        <div className="stat-card">
          <h2>2</h2>
          <p>Pending Quizzes</p>
        </div>

        <div className="stat-card">
          <h2>1</h2>
          <p>Pending Assignment</p>
        </div>
      </div>

      <Link className="main-btn" to="/courses">
        View Courses
      </Link>
    </div>
  );
}