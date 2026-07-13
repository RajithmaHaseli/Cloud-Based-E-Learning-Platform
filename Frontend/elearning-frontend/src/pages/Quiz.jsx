import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    // Fetch course details to get course title
    fetch(`http://localhost:8080/api/courses/${id}`)
      .then((res) => res.json())
      .then((data) => setCourse(data))
      .catch((err) => console.error(err));

    // Fetch quiz questions
    fetch(`http://localhost:8080/api/quizzes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async () => {
    let total = 0;

    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        total++;
      }
    });

    setScore(total);

    // Submit results to backend
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.email) {
      try {
        await fetch("http://localhost:8080/api/quizzes/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentEmail: user.email,
            courseId: Number(id),
            courseTitle: course?.title || "Cloud Course",
            score: total,
            totalQuestions: questions.length,
          }),
        });
      } catch (err) {
        console.error("Failed to submit score to server:", err);
      }
    }
  };

  if (loading) {
    return <div className="page"><h1>Loading Quiz...</h1></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="page">
        <h1>Online Quiz</h1>
        <p>No quiz questions available for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Online Quiz: {course?.title}</h1>

      {questions.map((q, index) => {
        const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean);
        return (
          <div className="quiz-card" key={q.id || index}>
            <h3>{index + 1}. {q.question}</h3>

            {options.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option}
                  onChange={() =>
                    setAnswers({ ...answers, [index]: option })
                  }
                />
                {option}
              </label>
            ))}
          </div>
        );
      })}

      <button className="main-btn" onClick={handleSubmit}>
        Submit Quiz
      </button>

      {score !== null && (
        <h2>Your Score: {score} / {questions.length}</h2>
      )}
    </div>
  );
}