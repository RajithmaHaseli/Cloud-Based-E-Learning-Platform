import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoading(true);
        // Fetch course details
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);

        // Fetch quiz questions
        const quizRes = await api.get(`/quizzes/${id}`);
        setQuestions(quizRes.data);
      } catch (err) {
        console.error("Failed to load quiz details:", err);
      } finally {
        setLoading(false);
      }
    };
    loadQuizData();
  }, [id]);

  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.email) {
      alert("Please login first to submit the quiz");
      return;
    }

    const formattedAnswers = questions.map((q, index) => ({
      questionId: q.id,
      selectedAnswer: answers[index] || ""
    }));

    try {
      const payload = {
        studentEmail: user.email,
        courseId: Number(id),
        courseTitle: course?.title || "Cloud Course",
        answers: formattedAnswers
      };

      const response = await api.post("/quizzes/submit", payload);
      
      if (response.status === 200 || response.status === 201) {
        setScore(response.data.score);
        alert("Quiz submitted and evaluated securely by server!");
      } else {
        alert("Failed to submit quiz to server");
      }
    } catch (err) {
      console.error("Failed to submit score to server:", err);
      alert("Error submitting quiz: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <div className="page"><h1>Loading Quiz...</h1></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="page">
        <h1>Online Quiz</h1>
        <p style={{ color: "var(--text-secondary)" }}>No quiz questions available for this course yet.</p>
      </div>
    );
  }

  const passRate = score !== null ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="page quiz-page">
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1>Online Quiz: {course?.title}</h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
          Answer the questions below to test your understanding of course modules.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "25px", maxWidth: "800px", margin: "0 auto" }}>
        {questions.map((q, index) => {
          const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean);
          return (
            <div className="quiz-card" key={q.id || index} style={{ padding: "30px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "15px", color: "#fff" }}>
                Question {index + 1}: {q.question}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {options.map((option) => (
                  <label key={option} className="quiz-option">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={answers[index] === option}
                      onChange={() => setAnswers({ ...answers, [index]: option })}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {score === null ? (
          <button className="main-btn" onClick={handleSubmit} style={{ height: "52px", fontSize: "1rem", marginTop: "20px" }}>
            Submit Quiz Answers
          </button>
        ) : (
          <div className="progress-card" style={{ padding: "35px", borderTop: `6px solid ${passRate >= 70 ? "var(--success)" : "var(--danger)"}`, textAlign: "center", marginTop: "30px" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "900", marginBottom: "10px" }}>Quiz Evaluation Result</h2>
            <div style={{ fontSize: "3rem", fontWeight: "900", color: passRate >= 70 ? "var(--success)" : "var(--danger)", margin: "10px 0" }}>
              {score} / {questions.length}
            </div>
            <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Your Score: <strong>{passRate}%</strong>
            </p>
            <span className={`grade-badge ${passRate >= 70 ? "pass" : "fail"}`} style={{ padding: "8px 24px", fontSize: "0.95rem" }}>
              {passRate >= 70 ? "✓ Passed Quiz" : "✗ Keep Learning (Need 70%)"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}