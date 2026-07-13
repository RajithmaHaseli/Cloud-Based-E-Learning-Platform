import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/api/courses/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Course not found");
        return res.json();
      })
      .then((data) => {
        setCourse(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="page"><h1>Loading course details...</h1></div>;
  }

  if (!course) {
    return <div className="page"><h1>Course not found</h1></div>;
  }

  return (
    <div className="page">
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      {course.video && (
        <video className="video-player" controls key={course.video}>
          <source src={course.video} type="video/mp4" />
        </video>
      )}

      <h2>Lessons</h2>
      <ul className="lesson-list">
        {course.lessons && course.lessons.map((lesson, index) => (
          <li key={lesson.id || index}>{lesson.title || lesson}</li>
        ))}
      </ul>

      <Link className="main-btn" to={`/quiz/${course.id}`}>
        Take Quiz
      </Link>
    </div>
  );
}