import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalInstructors: 0, totalCourses: 0 });

  useEffect(() => {
    fetch("http://localhost:8080/api/progress/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p>Manage users, courses, and system activities.</p>

      <div className="stats">
        <div className="stat-card">
          <h2>{stats.totalStudents}</h2>
          <p>Students</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalInstructors}</h2>
          <p>Lecturers</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalCourses}</h2>
          <p>Courses</p>
        </div>
      </div>

      <div className="admin-box">
        <h2>System Management</h2>
        <button onClick={() => alert("Manage Students feature coming soon")}>Manage Students</button>
        <button onClick={() => alert("Manage Lecturers feature coming soon")}>Manage Lecturers</button>
        <button onClick={() => alert("Manage Courses feature coming soon")}>Manage Courses</button>
      </div>
    </div>
  );
}