import { useState, useEffect } from "react";
import api from "../services/api";

export default function Progress() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [progressData, setProgressData] = useState({ quizSubmissions: [], assignmentSubmissions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email) {
      const loadProgress = async () => {
        try {
          const res = await api.get(`/progress/student/${user.email}`);
          setProgressData(res.data);
        } catch (err) {
          console.error("Failed to load progress details:", err);
        } finally {
          setLoading(false);
        }
      };
      loadProgress();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="page"><h1>Loading Progress...</h1></div>;
  }

  return (
    <div className="page progress-page">
      <h1>My Learning Progress & Grades</h1>
      <p>Review your grades, quiz scores, and assignment feedback.</p>

      <div style={{ marginBottom: "40px" }}>
        <h2>Quiz Submissions</h2>
        {progressData.quizSubmissions.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No quizzes submitted yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {progressData.quizSubmissions.map((sub) => (
              <div className="progress-card" key={sub.id} style={{ borderLeft: "6px solid var(--success)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: "0 0 10px 0" }}>{sub.courseTitle}</h3>
                  <p style={{ fontSize: "1.2rem", margin: "10px 0" }}>
                    <strong>Score:</strong> <span style={{ color: "var(--success)", fontWeight: "800" }}>{sub.score}</span> / {sub.totalQuestions}
                  </p>
                  <div className="grade-badge pass" style={{ fontSize: "0.8rem", marginBottom: "15px" }}>
                    {Math.round((sub.score / sub.totalQuestions) * 100)}% Pass Rate
                  </div>
                </div>
                <small style={{ color: "var(--text-secondary)" }}>
                  Submitted: {new Date(sub.submittedAt).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2>Assignment Submissions & Evaluation</h2>
        {progressData.assignmentSubmissions.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No assignments submitted yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {progressData.assignmentSubmissions.map((sub) => (
              <div className="progress-card" key={sub.id} style={{ borderLeft: "6px solid var(--secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                  <h3 style={{ margin: 0 }}>{sub.courseTitle}</h3>
                  {sub.grade ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span className="grade-badge pass" style={{ fontSize: "1.1rem", padding: "6px 14px" }}>Grade: {sub.grade}</span>
                      {sub.gradedAt && (
                        <small style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Graded: {new Date(sub.gradedAt).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  ) : (
                    <span className="grade-badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>Pending Evaluation</span>
                  )}
                </div>

                <p style={{ margin: "10px 0" }}><strong>Submission Notes:</strong></p>
                <div style={{ padding: "12px 16px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px", fontSize: "0.95rem", color: "var(--text-secondary)", border: "1px solid var(--border)", marginBottom: "15px", whiteSpace: "pre-wrap" }}>
                  {sub.submissionText}
                </div>

                <p style={{ margin: "10px 0" }}><strong>S3 File Upload Location:</strong></p>
                <code style={{ display: "block", background: "rgba(255, 255, 255, 0.04)", padding: "10px 14px", borderRadius: "6px", margin: "5px 0 20px 0", fontSize: "0.85rem", color: "var(--secondary)", overflowX: "auto", border: "1px solid var(--border)" }}>
                  {sub.fileUrl}
                </code>

                {sub.feedback && (
                  <div style={{ padding: "15px 20px", background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "8px", marginTop: "15px" }}>
                    <p style={{ margin: "0 0 5px 0", color: "var(--secondary)", fontWeight: "800" }}>Instructor Comments & Feedback:</p>
                    <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.95rem", color: "var(--text-primary)" }}>"{sub.feedback}"</p>
                  </div>
                )}

                <div style={{ marginTop: "15px", textAlign: "right" }}>
                  <small style={{ color: "var(--text-secondary)" }}>
                    Submitted: {new Date(sub.submittedAt).toLocaleString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}