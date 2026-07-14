import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await api.get("/courses");
        setCourses(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load courses.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return <div className="page"><p>Loading courses...</p></div>;
  }

  if (error) {
    return <div className="page"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="page">
      <h1>Available Courses</h1>

      <div className="course-grid">
        {courses.map((course) => (
          <div className="course-card" key={course.id}>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <p><strong>Instructor:</strong> {course.instructor}</p>

            <Link to={`/course/${course.id}`}>View Course</Link>
          </div>
        ))}
      </div>
    </div>
  );
}