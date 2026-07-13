import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="page"><p>Loading courses...</p></div>;
  }

  return (
    <div className="page">
      <h1>Available Courses</h1>

      {courses.length === 0 ? (
        <p>No courses available at the moment.</p>
      ) : (
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
      )}
    </div>
  );
}