import { useState, useEffect } from "react";

export default function Progress() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [progressData, setProgressData] = useState({ quizSubmissions: [], assignmentSubmissions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email) {
      fetch(`http://localhost:8080/api/progress/student/${user.email}`)
        .then((res) => res.json())
        .then((data) => {
          setProgressData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="page"><h1>Loading Progress...</h1></div>;
  }

  return (
    <div className="page">
      <h1>My Learning Progress & Grades</h1>

      <div style={{ marginBottom: "30px" }}>
        <h2>Quiz Submissions</h2>
        {progressData.quizSubmissions.length === 0 ? (
          <p>No quizzes submitted yet.</p>
        ) : (
          progressData.quizSubmissions.map((sub) => (
            <div className="progress-card" key={sub.id} style={{ borderLeft: "5px solid #2ecc71" }}>
              <h3>{sub.courseTitle}</h3>
              <p><strong>Score:</strong> {sub.score} / {sub.totalQuestions} ({Math.round((sub.score / sub.totalQuestions) * 100)}%)</p>
              <small>Submitted: {new Date(sub.submittedAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>

      <div>
        <h2>Assignment Submissions</h2>
        {progressData.assignmentSubmissions.length === 0 ? (
          <p>No assignments submitted yet.</p>
        ) : (
          progressData.assignmentSubmissions.map((sub) => (
            <div className="progress-card" key={sub.id} style={{ borderLeft: "5px solid #3498db" }}>
              <h3>{sub.courseTitle}</h3>
              <p><strong>S3 Cloud Storage Location:</strong></p>
              <code style={{ display: "block", background: "#f8f9fa", padding: "8px", borderRadius: "4px", margin: "5px 0" }}>
                {sub.fileUrl}
              </code>
              <small>Submitted: {new Date(sub.submittedAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}