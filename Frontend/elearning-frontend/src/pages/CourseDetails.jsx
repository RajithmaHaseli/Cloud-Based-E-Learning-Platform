import { useParams, Link } from "react-router-dom";
import { courses } from "../data";

export default function CourseDetails() {
  const { id } = useParams();
  const course = courses.find((item) => item.id === Number(id));

  if (!course) {
    return <h1>Course not found</h1>;
  }

  return (
    <div className="page">
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      <video className="video-player" controls>
        <source src={course.video} type="video/mp4" />
      </video>

      <h2>Lessons</h2>
      <ul className="lesson-list">
        {course.lessons.map((lesson, index) => (
          <li key={index}>{lesson}</li>
        ))}
      </ul>

      <Link className="main-btn" to={`/quiz/${course.id}`}>
        Take Quiz
      </Link>
    </div>
  );
}