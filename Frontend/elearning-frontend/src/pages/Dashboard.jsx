import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [stats, setStats] = useState({ totalCourses: 0, totalQuizSubmissions: 0, totalAssignmentSubmissions: 0 });
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await api.get("/progress/stats");
        setStats(statsRes.data);

        // Fetch enrollments
        if (user && user.email) {
          const enrollRes = await api.get(`/enrollments/my?email=${user.email}`);
          setEnrollments(enrollRes.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const avgProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length) 
    : 0;

  return (
    <div className="page student-dashboard-page">
      <h1>Student Dashboard</h1>
      <p>Welcome back, <strong>{user?.name || user?.email}</strong>. Track your learning progress below.</p>

      <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        <div className="stat-card">
          <h2>{stats.totalCourses}</h2>
          <p>Available Courses</p>
        </div>

        <div className="stat-card">
          <h2>{enrollments.length}</h2>
          <p>My Enrolled Courses</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalQuizSubmissions}</h2>
          <p>Quizzes Completed</p>
        </div>

        <div className="stat-card" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.02))", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <h2 style={{ color: "var(--primary)" }}>{avgProgress}%</h2>
          <p>Average Progress</p>
        </div>
      </div>

      <div className="dashboard-content" style={{ marginTop: "40px", textAlign: "left" }}>
        <h2>My Active Courses</h2>
        
        {loading ? (
          <div className="loading-container">Loading courses...</div>
        ) : enrollments.length === 0 ? (
          <div className="empty-enrollments-card" style={{ padding: "30px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>You are not enrolled in any courses yet.</p>
            <Link className="main-btn" to="/courses">Browse & Enroll in Courses</Link>
          </div>
        ) : (
          <div className="course-grid">
            {enrollments.map((enroll) => (
              <div className="course-card" key={enroll.id}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "1.2rem" }}>{enroll.courseTitle}</h3>
                
                <div className="progress-section" style={{ margin: "15px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                    <span>Course Progress</span>
                    <span>{enroll.progress}%</span>
                  </div>
                  <progress value={enroll.progress} max="100"></progress>
                </div>

                <Link className="main-btn" to={`/course/${enroll.courseId}`} style={{ width: "100%", marginTop: "10px" }}>
                  Go to Classroom
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}