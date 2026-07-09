import { useState } from "react";
import { quizQuestions } from "../data";

export default function Quiz() {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  const handleSubmit = () => {
    let total = 0;

    quizQuestions.forEach((q, index) => {
      if (answers[index] === q.answer) {
        total++;
      }
    });

    setScore(total);
  };

  return (
    <div className="page">
      <h1>Online Quiz</h1>

      {quizQuestions.map((q, index) => (
        <div className="quiz-card" key={index}>
          <h3>{index + 1}. {q.question}</h3>

          {q.options.map((option) => (
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
      ))}

      <button className="main-btn" onClick={handleSubmit}>
        Submit Quiz
      </button>

      {score !== null && (
        <h2>Your Score: {score} / {quizQuestions.length}</h2>
      )}
    </div>
  );
}