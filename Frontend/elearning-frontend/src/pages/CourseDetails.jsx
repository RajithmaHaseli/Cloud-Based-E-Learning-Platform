import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

export default function CourseDetails() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        setCourse(response.data);
      } catch (err) {
        console.error(err);
        setError("Course not found.");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  if (loading) {
    return <div className="page"><p>Loading course...</p></div>;
  }

  if (error || !course) {
    return <div className="page"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="page">
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      {course.video && (
        <video className="video-player" controls>
          <source src={course.video} />
        </video>
      )}

      <h2>Lessons</h2>

      <ul className="lesson-list">
        {course.lessons?.map((lesson) => (
          <li key={lesson.id}>{lesson.title}</li>
        ))}
      </ul>

      <Link className="main-btn" to={`/quiz/${course.id}`}>
        Take Quiz
      </Link>
    </div>
  );
}