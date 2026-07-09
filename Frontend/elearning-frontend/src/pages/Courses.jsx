import { Link } from "react-router-dom";
import { courses } from "../data";

export default function Courses() {
  return (
    <div className="page">
      <h1>Available Courses</h1>

      <div className="course-grid">
        {courses.map((course) => (
          <div className="course-card" key={course.id}>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <p>
              <strong>Instructor:</strong> {course.instructor}
            </p>

            <Link to={`/course/${course.id}`}>View Course</Link>
          </div>
        ))}
      </div>
    </div>
  );
}