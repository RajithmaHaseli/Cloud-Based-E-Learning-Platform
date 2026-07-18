import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get("/courses"),
        user && user.email ? api.get(`/enrollments/my?email=${user.email}`) : Promise.resolve({ data: [] })
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (courseId) => {
    if (!user || !user.email) return;
    try {
      await api.post(`/enrollments/course/${courseId}?email=${user.email}`);
      alert("Successfully enrolled in course!");
      loadData(); // reload
    } catch (err) {
      alert("Failed to enroll in course");
    }
  };

  const isEnrolled = (courseId) => {
    return enrollments.some((e) => e.courseId === courseId);
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter((course) => {
    // Hide unapproved courses from non-admin users
    if (user?.role?.toLowerCase() !== "admin" && !course.approved) {
      return false;
    }
    // If user is lecturer or instructor, only show their assigned courses
    const roleLower = user?.role?.toLowerCase();
    if ((roleLower === "lecturer" || roleLower === "instructor") && course.assignedLecturerEmail !== user.email) {
      return false;
    }
    const matchQuery =
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  if (loading) {
    return <div className="page"><p>Loading courses...</p></div>;
  }

  if (error) {
    return <div className="page"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="page courses-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1>Available Courses</h1>
          <p>Discover and enroll in top-tier Cloud Computing and Development courses.</p>
        </div>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by title, instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid var(--border)", minWidth: "260px", outline: "none" }}
          />
        </div>
      </div>

      <div className="course-grid">
        {filteredCourses.length === 0 ? (
          <div style={{ colSpan: "3", padding: "40px", textAlign: "center", width: "100%", color: "var(--text-secondary)" }}>
            No courses found matching your query.
          </div>
        ) : (
          filteredCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const isStudent = user?.role?.toLowerCase() === "student";
            
            return (
              <div className="course-card" key={course.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{course.title}</h2>
                  {!course.approved && (
                    <span style={{ fontSize: "0.75rem", padding: "4px 8px", background: "var(--warning)", color: "#fff", borderRadius: "5px", fontWeight: "700" }}>Draft/Pending</span>
                  )}
                </div>
                <p>{course.description}</p>
                <p style={{ margin: "10px 0 20px 0" }}><strong>Instructor:</strong> {course.instructor}</p>

                <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                  {isStudent ? (
                    enrolled ? (
                      <Link className="main-btn" to={`/course/${course.id}`} style={{ width: "100%" }}>
                        Enter Classroom
                      </Link>
                    ) : (
                      <button className="main-btn" onClick={() => handleEnroll(course.id)} style={{ width: "100%" }}>
                        Enroll in Course
                      </button>
                    )
                  ) : (
                    <Link className="main-btn" to={`/course/${course.id}`} style={{ width: "100%" }}>
                      View Outline
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}