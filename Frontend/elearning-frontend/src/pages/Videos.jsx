import { useState, useEffect } from "react";
import api from "../services/api";

export default function Videos() {
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch courses which contain s3 video urls
    api.get("/courses")
      .then((res) => {
        const data = res.data.filter(c => c.video); // only courses with videos
        setCourses(data);
        if (data.length > 0) {
          setActiveCourse(data[0]);
        }
      })
      .catch((err) => console.error("Failed to load videos:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page"><h1>Loading Video lectures...</h1></div>;
  }

  return (
    <div className="page video-dashboard-page">
      <div style={{ marginBottom: "30px" }}>
        <h1>Video Lecture Hub</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Stream course lecture videos delivered directly from secure AWS S3 storage.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="profile-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>No video lectures have been uploaded to S3 yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1.5fr", gap: "30px" }}>
          
          {/* Left Column: Video Theater Player */}
          {activeCourse && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div 
                className="profile-card" 
                style={{ 
                  padding: "15px", 
                  background: "#000000", 
                  borderRadius: "var(--radius-md)", 
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)" 
                }}
              >
                <video 
                  key={activeCourse.video}
                  controls 
                  preload="none"
                  style={{ width: "100%", maxHeight: "500px", display: "block", borderRadius: "10px" }}
                >
                  <source src={activeCourse.video} type="video/mp4" />
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>

              <div className="profile-card" style={{ padding: "30px" }}>
                <span className="lesson-badge" style={{ marginBottom: "12px" }}>
                  Active Lecture Stream
                </span>
                <h2 style={{ fontSize: "1.7rem", fontWeight: "900", margin: "8px 0" }}>
                  {activeCourse.title}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "15px" }}>
                  <strong>Instructor:</strong> {activeCourse.instructor}
                </p>
                <p style={{ lineHeight: "1.7", color: "var(--text-primary)" }}>
                  {activeCourse.description}
                </p>
                
                <div style={{ marginTop: "20px", display: "flex", gap: "10px", background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)", padding: "15px", borderRadius: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem" }}>🌐</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", overflowX: "auto" }}>
                    Streaming Source: <code style={{ color: "var(--primary)", fontWeight: "700" }}>{activeCourse.video}</code>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Playlist Sidebar */}
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              S3 Video Lectures Playlist
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {courses.map((course) => {
                const isActive = activeCourse && activeCourse.id === course.id;
                return (
                  <div 
                    key={course.id}
                    onClick={() => setActiveCourse(course)}
                    className="profile-card"
                    style={{ 
                      padding: "20px", 
                      cursor: "pointer", 
                      border: isActive ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: isActive ? "rgba(37,99,235,0.04)" : "var(--surface)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: isActive ? "var(--primary)" : "var(--text-primary)", margin: "0 0 5px 0" }}>
                      {course.title}
                    </h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 10px 0" }}>
                      Instructor: {course.instructor}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "800" }}>
                        {isActive ? "▶ Playing" : "Watch Lecture"}
                      </span>
                      <span style={{ fontSize: "0.75rem", background: "var(--border)", padding: "4px 8px", borderRadius: "4px", color: "var(--text-secondary)" }}>
                        MP4 Stream
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
