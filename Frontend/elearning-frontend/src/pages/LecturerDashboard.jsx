import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function LecturerDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isLecturer = user?.role?.toLowerCase() === "lecturer";
  const isInstructor = user?.role?.toLowerCase() === "instructor";

  const [stats, setStats] = useState({ totalCourses: 0, totalAssignmentSubmissions: 0, totalQuizSubmissions: 0 });
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState("courses"); // 'courses', 'assignments', 'quizzes', 'add-lesson', 'add-quiz', 'notifications', 'enrollments', 'assignment-tasks'
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  // Enrollment and Student lists
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState("");
  const [selectedStudentEmailForEnroll, setSelectedStudentEmailForEnroll] = useState("");

  // Assignment tasks
  const [assignmentTasks, setAssignmentTasks] = useState([]);
  const [selectedCourseForTask, setSelectedCourseForTask] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  // Quiz Questions List & Edit
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Edit Course Outline State
  const [editingCourse, setEditingCourse] = useState(null);

  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

  // Add Lesson Form State
  const [selectedCourseForLesson, setSelectedCourseForLesson] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");

  // Add Quiz Question Form State
  const [quizQuestion, setQuizQuestion] = useState({
    courseId: "",
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctAnswer: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, coursesRes, assignmentsRes, quizzesRes] = await Promise.all([
        api.get("/progress/stats").catch(() => ({ data: { totalCourses: 0, totalAssignmentSubmissions: 0, totalQuizSubmissions: 0 } })),
        api.get("/courses").catch(() => ({ data: [] })),
        api.get("/assignments").catch(() => ({ data: [] })),
        api.get("/quizzes/submissions").catch(() => ({ data: [] }))
      ]);
      
      setStats(statsRes.data || { totalCourses: 0, totalAssignmentSubmissions: 0, totalQuizSubmissions: 0 });
      setCourses(coursesRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setQuizzes(quizzesRes.data || []);

      const [enrollRes, usersRes, tasksRes] = await Promise.all([
        api.get("/enrollments").catch(() => ({ data: [] })),
        api.get("/users?role=student").catch(() => ({ data: [] })),
        api.get("/assignments/tasks").catch(() => ({ data: [] }))
      ]);

      setEnrollments(enrollRes.data || []);
      setStudents((usersRes.data || []).filter(u => u.role?.toLowerCase() === "student"));
      setAssignmentTasks(tasksRes.data || []);

      if (isInstructor) {
        try {
          const [notifsRes, usersRes2] = await Promise.all([
            api.get(`/notifications?email=${user.email}`).catch(() => ({ data: [] })),
            api.get("/users?role=lecturer").catch(() => ({ data: [] }))
          ]);
          setNotifications(notifsRes.data || []);
          setLecturers((usersRes2.data || []).filter(u => u.role?.toLowerCase() === "lecturer"));
        } catch (notifErr) {
          console.error("Failed to load notifications or lecturers", notifErr);
        }
      }

      // Fetch quiz questions for manageable courses
      const manageable = coursesRes.data.filter(c => !isLecturer || c.assignedLecturerEmail === user.email);
      const questionsPromises = manageable.map(c => api.get(`/quizzes/${c.id}`).catch(() => ({ data: [] })));
      const questionsResponses = await Promise.all(questionsPromises);
      const allQuestions = questionsResponses.flatMap((res, idx) => {
        const course = manageable[idx];
        return res.data.map(q => ({ ...q, courseTitle: course.title }));
      });
      setQuizQuestions(allQuestions);
    } catch (err) {
      console.error("Failed to load lecturer dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!selectedCourseForLesson) {
      alert("Please select a course first");
      return;
    }
    try {
      await api.post(`/courses/${selectedCourseForLesson}/lessons`, { title: lessonTitle });
      alert("Lesson added successfully!");
      setLessonTitle("");
      loadData();
    } catch (err) {
      alert("Failed to add lesson");
    }
  };

  const handleAddQuizQuestion = async (e) => {
    e.preventDefault();
    if (!quizQuestion.courseId) {
      alert("Please select a course first");
      return;
    }
    try {
      await api.post("/quizzes/questions", {
        ...quizQuestion,
        courseId: Number(quizQuestion.courseId)
      });
      alert("Quiz question added successfully!");
      setQuizQuestion({
        courseId: "",
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: ""
      });
      loadData();
    } catch (err) {
      alert("Failed to add quiz question");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.delete(`/courses/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  const handleEditAddLesson = () => {
    setEditingCourse({
      ...editingCourse,
      lessons: [...(editingCourse.lessons || []), { title: "" }]
    });
  };

  const handleEditRemoveLesson = (index) => {
    const updatedLessons = (editingCourse.lessons || []).filter((_, idx) => idx !== index);
    setEditingCourse({
      ...editingCourse,
      lessons: updatedLessons
    });
  };

  const handleEditLessonFieldChange = (index, field, value) => {
    const updatedLessons = (editingCourse.lessons || []).map((l, idx) => (idx === index ? { ...l, [field]: value } : l));
    setEditingCourse({
      ...editingCourse,
      lessons: updatedLessons
    });
  };

  const handleEditAddQuizQuestion = (lessonIndex) => {
    const updatedLessons = (editingCourse.lessons || []).map((l, idx) => {
      if (idx === lessonIndex) {
        return {
          ...l,
          quizQuestions: [
            ...(l.quizQuestions || []),
            { question: "", option1: "", option2: "", option3: "", option4: "", correctAnswer: "Option 1" }
          ]
        };
      }
      return l;
    });
    setEditingCourse({
      ...editingCourse,
      lessons: updatedLessons
    });
  };

  const handleEditRemoveQuizQuestion = (lessonIndex, questionIndex) => {
    const updatedLessons = (editingCourse.lessons || []).map((l, idx) => {
      if (idx === lessonIndex) {
        const filteredQ = (l.quizQuestions || []).filter((_, qIdx) => qIdx !== questionIndex);
        return { ...l, quizQuestions: filteredQ };
      }
      return l;
    });
    setEditingCourse({
      ...editingCourse,
      lessons: updatedLessons
    });
  };

  const handleEditQuizQuestionFieldChange = (lessonIndex, questionIndex, field, value) => {
    const updatedLessons = (editingCourse.lessons || []).map((l, idx) => {
      if (idx === lessonIndex) {
        const updatedQ = (l.quizQuestions || []).map((q, qIdx) => {
          if (qIdx === questionIndex) {
            return { ...q, [field]: value };
          }
          return q;
        });
        return { ...l, quizQuestions: updatedQ };
      }
      return l;
    });
    setEditingCourse({
      ...editingCourse,
      lessons: updatedLessons
    });
  };

  const handleStartEditCourse = (c) => {
    const preparedLessons = (c.lessons || []).map(l => {
      let parsedQuestions = [];
      try {
        parsedQuestions = l.quizQuestionsJson ? JSON.parse(l.quizQuestionsJson) : [];
      } catch (err) {
        console.error("Error parsing quiz questions:", err);
      }
      if (parsedQuestions.length === 0 && l.quizQuestion) {
        parsedQuestions.push({
          question: l.quizQuestion,
          option1: l.quizOption1,
          option2: l.quizOption2,
          option3: l.quizOption3,
          option4: l.quizOption4,
          correctAnswer: l.quizCorrectAnswer
        });
      }
      if (parsedQuestions.length === 0) {
        parsedQuestions.push({
          question: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correctAnswer: "Option 1"
        });
      }
      return {
        ...l,
        quizQuestions: parsedQuestions
      };
    });
    setEditingCourse({
      ...c,
      lessons: preparedLessons,
      assignmentTitle: c.assignmentTitle || "",
      assignmentDescription: c.assignmentDescription || "",
      assignmentDeadline: c.assignmentDeadline || ""
    });
  };

  const handleEditCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const mappedLessons = (editingCourse.lessons || []).map(l => {
        const questionsList = l.quizQuestions || [];
        return {
          ...l,
          quizQuestionsJson: JSON.stringify(questionsList),
          quizQuestion: questionsList[0]?.question || "",
          quizOption1: questionsList[0]?.option1 || "",
          quizOption2: questionsList[0]?.option2 || "",
          quizOption3: questionsList[0]?.option3 || "",
          quizOption4: questionsList[0]?.option4 || "",
          quizCorrectAnswer: questionsList[0]?.correctAnswer || "Option 1"
        };
      });
      const payload = {
        ...editingCourse,
        lessons: mappedLessons
      };
      const response = await api.put(`/courses/${editingCourse.id}`, payload);
      alert("Course details updated successfully!");
      setEditingCourse(null);
      setCourses(courses.map(c => c.id === response.data.id ? response.data : c));
    } catch (err) {
      alert("Failed to update course details");
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/assignments/${gradingSubmission.id}/grade`, {
        grade: gradeInput,
        feedback: feedbackInput
      });
      alert("Grade and feedback submitted successfully!");
      setGradingSubmission(null);
      setGradeInput("");
      setFeedbackInput("");
      loadData();
    } catch (err) {
      alert("Failed to grade assignment");
    }
  };

  const handleAssignLecturer = async (courseId, lecturerEmail) => {
    try {
      await api.put(`/courses/${courseId}/assign?email=${lecturerEmail}`);
      alert("Lecturer assigned to course successfully!");
      loadData();
    } catch (err) {
      alert("Failed to assign lecturer");
    }
  };

  const handleReadNotification = async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedCourseForEnroll || !selectedStudentEmailForEnroll) {
      alert("Please select both course and student");
      return;
    }
    try {
      await api.post(`/enrollments/course/${selectedCourseForEnroll}?email=${selectedStudentEmailForEnroll}`);
      alert("Student enrolled successfully!");
      setSelectedStudentEmailForEnroll("");
      loadData();
    } catch (err) {
      alert(err.response?.data || "Failed to enroll student");
    }
  };

  const handleCreateAssignmentTask = async (e) => {
    e.preventDefault();
    if (!selectedCourseForTask) {
      alert("Please select a course first");
      return;
    }
    try {
      await api.post("/assignments/tasks", {
        courseId: Number(selectedCourseForTask),
        title: taskTitle,
        description: taskDescription,
        deadline: taskDeadline
      });
      alert("Assignment task created successfully!");
      setTaskTitle("");
      setTaskDescription("");
      setTaskDeadline("");
      loadData();
    } catch (err) {
      alert("Failed to create assignment");
    }
  };

  const handleUpdateAssignmentTask = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/assignments/tasks/${editingTask.id}`, editingTask);
      alert("Assignment task updated successfully!");
      setEditingTask(null);
      loadData();
    } catch (err) {
      alert("Failed to update assignment");
    }
  };

  const handleDeleteAssignmentTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this assignment task?")) return;
    try {
      await api.delete(`/assignments/tasks/${taskId}`);
      alert("Assignment task deleted successfully!");
      loadData();
    } catch (err) {
      alert("Failed to delete assignment");
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/quizzes/questions/${editingQuestion.id}`, editingQuestion);
      alert("Quiz question updated successfully!");
      setEditingQuestion(null);
      loadData();
    } catch (err) {
      alert("Failed to update quiz question");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz question?")) return;
    try {
      await api.delete(`/quizzes/questions/${id}`);
      alert("Quiz question deleted successfully!");
      loadData();
    } catch (err) {
      alert("Failed to delete quiz question");
    }
  };

  return (
    <div className="page lecturer-dashboard-page">
      <div className="dashboard-header">
        <h1>Lecturer Hub</h1>
        <p>Create courses, add online lessons/quizzes, and evaluate student grades.</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h2>{stats.totalCourses}</h2>
          <p>My Courses</p>
        </div>

        <div className="stat-card">
          <h2>{assignments.length}</h2>
          <p>Assignments Received</p>
        </div>

        <div className="stat-card">
          <h2>{quizzes.length}</h2>
          <p>Quizzes Completed</p>
        </div>
      </div>

      <div className="admin-box">
        <div className="tab-menu">
          <button 
            className={`tab-btn ${activeTab === "courses" ? "active" : ""}`} 
            onClick={() => setActiveTab("courses")}
          >
            My Courses
          </button>
          <button 
            className={`tab-btn ${activeTab === "assignments" ? "active" : ""}`} 
            onClick={() => setActiveTab("assignments")}
          >
            Student Assignments
          </button>
          <button 
            className={`tab-btn ${activeTab === "quizzes" ? "active" : ""}`} 
            onClick={() => setActiveTab("quizzes")}
          >
            Quiz Submissions
          </button>
          <button 
            className={`tab-btn ${activeTab === "add-lesson" ? "active" : ""}`} 
            onClick={() => setActiveTab("add-lesson")}
          >
            Add Lesson
          </button>
          <button 
            className={`tab-btn ${activeTab === "add-quiz" ? "active" : ""}`} 
            onClick={() => setActiveTab("add-quiz")}
          >
            Add Quiz Question
          </button>
          {isInstructor && (
            <button 
              className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`} 
              onClick={() => setActiveTab("notifications")}
              style={{ position: "relative" }}
            >
              Notifications Hub
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ 
                  position: "absolute", 
                  top: "-5px", 
                  right: "-5px", 
                  background: "var(--danger)", 
                  color: "#fff", 
                  borderRadius: "50%", 
                  width: "18px", 
                  height: "18px", 
                  fontSize: "0.68rem", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontWeight: "bold"
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          )}
          <button 
            className={`tab-btn ${activeTab === "enrollments" ? "active" : ""}`} 
            onClick={() => setActiveTab("enrollments")}
          >
            Enrolled Students
          </button>
          <button 
            className={`tab-btn ${activeTab === "assignment-tasks" ? "active" : ""}`} 
            onClick={() => setActiveTab("assignment-tasks")}
          >
            Manage Assignment Specs
          </button>
        </div>

        {loading ? (
          <div className="loading-container">Loading lecturer data...</div>
        ) : (
          <div className="tab-content">
            {activeTab === "courses" && (
              <div className="management-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2>Courses Overview</h2>
                  <Link className="main-btn" to="/add-course">Add New Course</Link>
                </div>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Course Title</th>
                        <th>Lessons</th>
                        <th>Status</th>
                        {isInstructor && <th>Assigned Lecturer</th>}
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.filter(c => !isLecturer || c.assignedLecturerEmail === user.email).length === 0 ? (
                        <tr>
                          <td colSpan={isInstructor ? 6 : 5} style={{ textAlign: "center", padding: "40px" }}>
                            {isLecturer ? (
                              <div style={{ color: "var(--text-secondary)" }}>
                                <p style={{ fontWeight: "800", fontSize: "1.1rem", color: "var(--text-primary)" }}>No courses assigned to you yet.</p>
                                <p style={{ fontSize: "0.9rem", marginTop: "6px" }}>Please notify an Instructor to assign a subject to your lecturer account.</p>
                              </div>
                            ) : (
                              "No courses created yet. Click 'Add New Course' to begin."
                            )}
                          </td>
                        </tr>
                      ) : (
                        courses.filter(c => !isLecturer || c.assignedLecturerEmail === user.email).map((c) => (
                          <tr key={c.id}>
                            <td><strong>{c.title}</strong></td>
                            <td>
                              <span className="lesson-badge">{c.lessons?.length || 0} Lessons</span>
                            </td>
                            <td>
                              <span className={`grade-badge ${c.approved ? "pass" : "fail"}`} style={{ fontSize: "0.75rem" }}>
                                {c.approved ? "Published" : "Draft / Pending"}
                              </span>
                            </td>
                            {isInstructor && (
                              <td>
                                <select 
                                  value={c.assignedLecturerEmail || ""} 
                                  onChange={(e) => handleAssignLecturer(c.id, e.target.value)}
                                  style={{ minWidth: "160px", height: "40px", fontSize: "0.88rem", padding: "0 10px", background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
                                >
                                  <option value="">-- Unassigned --</option>
                                  {lecturers.map(l => (
                                    <option key={l.id} value={l.email}>{l.name} ({l.email})</option>
                                  ))}
                                </select>
                              </td>
                            )}
                            <td>{c.description ? c.description.substring(0, 50) + "..." : "No description"}</td>
                            <td>
                              <div style={{ display: "flex", gap: "5px" }}>
                                <button 
                                  className="action-btn" 
                                  style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)" }}
                                  onClick={() => handleStartEditCourse(c)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="action-btn delete-btn" 
                                  onClick={() => handleDeleteCourse(c.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "assignments" && (
              <div className="management-panel">
                <h2>Assignment Submissions</h2>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Student Email</th>
                        <th>Course</th>
                        <th>Submission Details</th>
                        <th>Cloud S3 Link</th>
                        <th>Grade</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No assignments submitted yet.</td>
                        </tr>
                      ) : (
                        assignments.map((a) => (
                          <tr key={a.id}>
                            <td>{a.studentEmail}</td>
                            <td><strong>{a.courseTitle}</strong></td>
                            <td style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{a.submissionText}</td>
                            <td>
                              <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="s3-link">
                                {a.fileUrl ? "Open S3 File" : "No File"}
                              </a>
                            </td>
                            <td>
                              {a.grade ? (
                                <span className="grade-badge pass" style={{ fontSize: "0.85rem" }}>{a.grade}</span>
                              ) : (
                                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontStyle: "italic" }}>Not Graded</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="action-btn" 
                                style={{ background: "var(--primary)", color: "#fff" }}
                                onClick={() => {
                                  setGradingSubmission(a);
                                  setGradeInput(a.grade || "");
                                  setFeedbackInput(a.feedback || "");
                                }}
                              >
                                {a.grade ? "Edit Grade" : "Grade"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "quizzes" && (
              <div className="management-panel">
                <h2>Student Quiz Grades</h2>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Student Email</th>
                        <th>Course Title</th>
                        <th>Score</th>
                        <th>Percentage</th>
                        <th>Completed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No quizzes submitted yet.</td>
                        </tr>
                      ) : (
                        quizzes.map((q) => (
                          <tr key={q.id}>
                            <td>{q.studentEmail}</td>
                            <td><strong>{q.courseTitle}</strong></td>
                            <td>{q.score} / {q.totalQuestions}</td>
                            <td>
                              <span className={`grade-badge ${q.score/q.totalQuestions >= 0.5 ? "pass" : "fail"}`}>
                                {Math.round((q.score / q.totalQuestions) * 100)}%
                              </span>
                            </td>
                            <td>{new Date(q.submittedAt).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "add-lesson" && (
              <div className="create-user-panel">
                <h2>Add Lesson to Course</h2>
                <form className="admin-form" onSubmit={handleAddLesson}>
                  <div className="form-group">
                    <label>Select Course</label>
                    <select 
                      value={selectedCourseForLesson}
                      onChange={(e) => setSelectedCourseForLesson(e.target.value)}
                      required
                    >
                      <option value="">-- Select Course --</option>
                      {courses.filter(c => !isLecturer || c.assignedLecturerEmail === user.email).map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Lesson Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Intro to Docker Containers"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      required
                    />
                  </div>

                  <button className="submit-btn" type="submit">Add Lesson</button>
                </form>
              </div>
            )}

            {activeTab === "add-quiz" && (
              <div className="management-panel">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px", alignItems: "start" }}>
                  
                  {/* Left: Add Quiz Question */}
                  <div className="create-user-panel" style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ marginTop: 0 }}>Add Quiz Question</h3>
                    <form onSubmit={handleAddQuizQuestion} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div className="form-group">
                        <label>Select Course</label>
                        <select 
                          value={quizQuestion.courseId}
                          onChange={(e) => setQuizQuestion({ ...quizQuestion, courseId: e.target.value })}
                          required
                        >
                          <option value="">-- Select Course --</option>
                          {courses.filter(c => !isLecturer || c.assignedLecturerEmail === user.email).map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Quiz Question</label>
                        <input 
                          type="text" 
                          placeholder="e.g. What is the main benefit of AWS S3?"
                          value={quizQuestion.question}
                          onChange={(e) => setQuizQuestion({ ...quizQuestion, question: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Option 1</label>
                        <input 
                          type="text" 
                          value={quizQuestion.option1}
                          onChange={(e) => setQuizQuestion({ ...quizQuestion, option1: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Option 2</label>
                        <input 
                          type="text" 
                          value={quizQuestion.option2}
                          onChange={(e) => setQuizQuestion({ ...quizQuestion, option2: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Option 3</label>
                        <input 
                          type="text" 
                          value={quizQuestion.option3}
                          onChange={(e) => setQuizQuestion({ ...quizQuestion, option3: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Option 4</label>
                        <input 
                          type="text" 
                          value={quizQuestion.option4}
                          onChange={(e) => setQuizQuestion({ ...quizQuestion, option4: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Correct Answer (Exact match)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Object Storage"
                          value={quizQuestion.correctAnswer}
                          onChange={(e) => setQuizQuestion({ ...quizQuestion, correctAnswer: e.target.value })}
                          required
                        />
                      </div>

                      <button className="submit-btn" type="submit">Create Quiz Question</button>
                    </form>
                  </div>

                  {/* Right: Quiz Questions List */}
                  <div>
                    <h3 style={{ marginTop: 0 }}>Quiz Questions Overview</h3>
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Course</th>
                            <th>Correct Option</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quizQuestions.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No quiz questions configured yet.</td>
                            </tr>
                          ) : (
                            quizQuestions.map((q) => (
                              <tr key={q.id}>
                                <td><strong>{q.question}</strong></td>
                                <td>{q.courseTitle}</td>
                                <td>
                                  <span className="lesson-badge">{q.correctAnswer}</span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "5px" }}>
                                    <button 
                                      className="action-btn"
                                      style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)" }}
                                      onClick={() => setEditingQuestion(q)}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      className="action-btn delete-btn"
                                      onClick={() => handleDeleteQuestion(q.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && isInstructor && (
              <div className="management-panel">
                <h2>Notifications Hub</h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "25px" }}>
                  Review new registered lecturers waiting for course assignments.
                </p>

                {notifications.length === 0 ? (
                  <div className="profile-card" style={{ padding: "30px", textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>No new notifications at this time.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className="profile-card"
                        style={{ 
                          padding: "20px 25px", 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          borderLeft: n.read ? "1px solid var(--border)" : "5px solid var(--primary)",
                          background: n.read ? "var(--surface)" : "rgba(37,99,235,0.03)"
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: n.read ? "500" : "800", color: "var(--text-primary)" }}>
                            {n.message}
                          </p>
                          <small style={{ color: "var(--text-secondary)" }}>
                            Received: {new Date(n.createdAt).toLocaleString()}
                          </small>
                        </div>
                        {!n.read && (
                          <button 
                            className="action-btn"
                            style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(37,99,235,0.2)" }}
                            onClick={() => handleReadNotification(n.id)}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "enrollments" && (
              <div className="management-panel">
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "30px", alignItems: "start" }}>
                  
                  {/* Left: Assign/Enroll Student form */}
                  <div className="create-user-panel" style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ marginTop: 0 }}>Enroll Student in Course</h3>
                    <form onSubmit={handleEnrollStudent} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      <div className="form-group">
                        <label>Select Course</label>
                        <select 
                          value={selectedCourseForEnroll} 
                          onChange={(e) => setSelectedCourseForEnroll(e.target.value)} 
                          required
                        >
                          <option value="">-- Select Course --</option>
                          {courses.filter(c => !isLecturer || c.assignedLecturerEmail === user.email).map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Select Student</label>
                        <select 
                          value={selectedStudentEmailForEnroll} 
                          onChange={(e) => setSelectedStudentEmailForEnroll(e.target.value)} 
                          required
                        >
                          <option value="">-- Select Student --</option>
                          {students.map(s => (
                            <option key={s.id} value={s.email}>{s.name} ({s.email})</option>
                          ))}
                        </select>
                      </div>

                      <button type="submit" className="submit-btn" style={{ marginTop: "10px" }}>Enroll Student</button>
                    </form>
                  </div>

                  {/* Right: Enrollments List */}
                  <div>
                    <h3 style={{ marginTop: 0 }}>Current Student Enrolments</h3>
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Student Email</th>
                            <th>Course Title</th>
                            <th>Enrolled Date</th>
                            <th>Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.filter(e => {
                            const course = courses.find(c => c.id === e.courseId);
                            if (!course) return false;
                            return !isLecturer || course.assignedLecturerEmail === user.email;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No students enrolled in your courses yet.</td>
                            </tr>
                          ) : (
                            enrollments.filter(e => {
                              const course = courses.find(c => c.id === e.courseId);
                              if (!course) return false;
                              return !isLecturer || course.assignedLecturerEmail === user.email;
                            }).map(e => (
                              <tr key={e.id}>
                                <td><strong>{e.studentEmail}</strong></td>
                                <td>{e.courseTitle}</td>
                                <td>{new Date(e.enrolledAt).toLocaleDateString()}</td>
                                <td>
                                  <span className="lesson-badge">{e.progress}% Completed</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assignment-tasks" && (
              <div className="management-panel">
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "30px", alignItems: "start" }}>
                  
                  {/* Left: Create Assignment Specs form */}
                  <div className="create-user-panel" style={{ padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ marginTop: 0 }}>Create Assignment Specification</h3>
                    <form onSubmit={handleCreateAssignmentTask} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      <div className="form-group">
                        <label>Select Course</label>
                        <select 
                          value={selectedCourseForTask} 
                          onChange={(e) => setSelectedCourseForTask(e.target.value)} 
                          required
                        >
                          <option value="">-- Select Course --</option>
                          {courses.filter(c => !isLecturer || c.assignedLecturerEmail === user.email).map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Assignment Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lab Project 1" 
                          value={taskTitle} 
                          onChange={(e) => setTaskTitle(e.target.value)} 
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label>Description / Guidelines</label>
                        <textarea 
                          placeholder="Provide description..." 
                          value={taskDescription} 
                          onChange={(e) => setTaskDescription(e.target.value)} 
                          rows="4"
                          style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", resize: "vertical", outline: "none" }}
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label>Deadline Date</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2026-12-31" 
                          value={taskDeadline} 
                          onChange={(e) => setTaskDeadline(e.target.value)} 
                          required 
                        />
                      </div>

                      <button type="submit" className="submit-btn" style={{ marginTop: "10px" }}>Create Assignment</button>
                    </form>
                  </div>

                  {/* Right: Assignment Tasks list */}
                  <div>
                    <h3 style={{ marginTop: 0 }}>Active Assignment Specs</h3>
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Course</th>
                            <th>Deadline</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignmentTasks.filter(t => {
                            const course = courses.find(c => c.id === t.courseId);
                            if (!course) return false;
                            return !isLecturer || course.assignedLecturerEmail === user.email;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No assignments created yet.</td>
                            </tr>
                          ) : (
                            assignmentTasks.filter(t => {
                              const course = courses.find(c => c.id === t.courseId);
                              if (!course) return false;
                              return !isLecturer || course.assignedLecturerEmail === user.email;
                            }).map(t => {
                              const course = courses.find(c => c.id === t.courseId);
                              return (
                                <tr key={t.id}>
                                  <td><strong>{t.title}</strong></td>
                                  <td>{course ? course.title : "Unknown Course"}</td>
                                  <td>{t.deadline}</td>
                                  <td>
                                    <div style={{ display: "flex", gap: "5px" }}>
                                      <button 
                                        className="action-btn"
                                        style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)" }}
                                        onClick={() => setEditingTask(t)}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        className="action-btn delete-btn"
                                        onClick={() => handleDeleteAssignmentTask(t.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Assignment Task Modal */}
      {editingTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "14px", width: "min(500px, 90%)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0 }}>Edit Assignment Spec</h2>
            <form onSubmit={handleUpdateAssignmentTask}>
              <div className="form-group">
                <label>Assignment Title</label>
                <input 
                  type="text" 
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description / Guidelines</label>
                <textarea 
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows="4"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", resize: "vertical", outline: "none" }}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Deadline Date</label>
                <input 
                  type="text" 
                  value={editingTask.deadline}
                  onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="main-btn" style={{ flex: 1 }}>Save Changes</button>
                <button 
                  type="button" 
                  className="main-btn" 
                  style={{ background: "#94a3b8", color: "#fff", flex: 1 }}
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quiz Question Modal */}
      {editingQuestion && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "14px", width: "min(500px, 90%)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0 }}>Edit Quiz Question</h2>
            <form onSubmit={handleUpdateQuestion}>
              <div className="form-group">
                <label>Question Text</label>
                <input 
                  type="text" 
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option 1</label>
                <input 
                  type="text" 
                  value={editingQuestion.option1}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, option1: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option 2</label>
                <input 
                  type="text" 
                  value={editingQuestion.option2}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, option2: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option 3</label>
                <input 
                  type="text" 
                  value={editingQuestion.option3}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, option3: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Option 4</label>
                <input 
                  type="text" 
                  value={editingQuestion.option4}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, option4: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Correct Answer</label>
                <input 
                  type="text" 
                  value={editingQuestion.correctAnswer}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="main-btn" style={{ flex: 1 }}>Save Changes</button>
                <button 
                  type="button" 
                  className="main-btn" 
                  style={{ background: "#94a3b8", color: "#fff", flex: 1 }}
                  onClick={() => setEditingQuestion(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "14px", width: "min(500px, 90%)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0 }}>Grade Submission</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Student: <strong>{gradingSubmission.studentEmail}</strong></p>
            
            <form onSubmit={handleGradeSubmit}>
              <div className="form-group">
                <label>Grade (e.g. A+, B, C, Fail)</label>
                <input 
                  type="text" 
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="e.g. A+"
                  required
                />
              </div>

              <div className="form-group">
                <label>Instructor Feedback / Comments</label>
                <textarea 
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide brief pointers and comments for the student..."
                  rows="4"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", resize: "vertical", outline: "none" }}
                  required
                ></textarea>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="main-btn" style={{ flex: 1 }}>Submit Grade</button>
                <button 
                  type="button" 
                  className="main-btn" 
                  style={{ background: "#94a3b8", color: "#fff", flex: 1 }}
                  onClick={() => setGradingSubmission(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Outline Modal */}
      {editingCourse && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "14px", width: "min(600px, 90%)", boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ marginTop: 0 }}>Edit Course Outline</h2>
            <form onSubmit={handleEditCourseSubmit}>
              <div className="form-group">
                <label>Course Title</label>
                <input 
                  type="text" 
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Instructor Name</label>
                <input 
                  type="text" 
                  value={editingCourse.instructor}
                  onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Course Description</label>
                <textarea 
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows="4"
                  style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", resize: "vertical", outline: "none" }}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>Video Lecture URL</label>
                <input 
                  type="text" 
                  value={editingCourse.video}
                  onChange={(e) => setEditingCourse({ ...editingCourse, video: e.target.value })}
                />
              </div>

              {/* Assignment Spec */}
              <div className="form-group" style={{ border: "1px solid var(--border)", padding: "15px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.01)", marginTop: "15px" }}>
                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#fff", display: "block", marginBottom: "10px" }}>Course Final Assignment Specification</span>
                
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label>Assignment Title</label>
                  <input 
                    type="text" 
                    value={editingCourse.assignmentTitle || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, assignmentTitle: e.target.value })}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", padding: "8px 12px" }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label>Description / Guidelines</label>
                  <textarea 
                    value={editingCourse.assignmentDescription || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, assignmentDescription: e.target.value })}
                    rows="3"
                    style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", resize: "vertical", outline: "none", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Submission Deadline</label>
                  <input 
                    type="text" 
                    value={editingCourse.assignmentDeadline || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, assignmentDeadline: e.target.value })}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff", padding: "8px 12px" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ border: "1px solid var(--border)", padding: "15px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.01)", marginTop: "15px", maxHeight: "300px", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#fff" }}>Course Syllabus & Lessons</span>
                  <button 
                    type="button" 
                    onClick={handleEditAddLesson}
                    style={{ padding: "4px 10px", fontSize: "0.75rem", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)", height: "auto", cursor: "pointer" }}
                  >
                    + Add Lesson
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {(editingCourse.lessons || []).map((lesson, index) => (
                    <div key={index} style={{ borderBottom: index < (editingCourse.lessons || []).length - 1 ? "2px solid var(--border)" : "none", paddingBottom: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold", minWidth: "60px" }}>Lesson {index + 1}:</span>
                        <input 
                          type="text"
                          placeholder={`Lesson ${index + 1} Title`}
                          value={lesson.title || ""}
                          onChange={(e) => handleEditLessonFieldChange(index, "title", e.target.value)}
                          required
                          style={{ flex: 1, padding: "6px 10px", fontSize: "0.9rem" }}
                        />
                        {editingCourse.lessons.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleEditRemoveLesson(index)}
                            style={{ padding: "6px 10px", background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)", height: "34px", width: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div style={{ paddingLeft: "68px" }}>
                        <textarea
                          placeholder={`Provide lecture content / notes for Lesson ${index + 1}...`}
                          value={lesson.content || ""}
                          onChange={(e) => handleEditLessonFieldChange(index, "content", e.target.value)}
                          rows="2"
                          style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "8px", background: "transparent", color: "var(--text-primary)", fontSize: "0.85rem", resize: "vertical", outline: "none" }}
                        />
                      </div>                      {/* Lesson Quizzes Section (Multiple Questions) */}
                      <div style={{ paddingLeft: "68px", display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.08)", padding: "12px", borderRadius: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--primary)" }}>📝 Lesson Quiz Questions</span>
                          <button 
                            type="button" 
                            onClick={() => handleEditAddQuizQuestion(index)}
                            style={{ padding: "2px 6px", fontSize: "0.7rem", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)", height: "auto" }}
                          >
                            + Add Question
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {(lesson.quizQuestions || []).map((q, qIdx) => (
                            <div key={qIdx} style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px" }}>
                              
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold" }}>Q{qIdx + 1}:</span>
                                <input 
                                  type="text"
                                  placeholder="Quiz Question Text"
                                  value={q.question || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "question", e.target.value)}
                                  required
                                  style={{ flex: 1, padding: "5px 8px", fontSize: "0.8rem" }}
                                />
                                {(lesson.quizQuestions || []).length > 1 && (
                                  <button 
                                    type="button" 
                                    onClick={() => handleEditRemoveQuizQuestion(index, qIdx)}
                                    style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)", height: "26px", width: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                <input 
                                  type="text"
                                  placeholder="Option 1"
                                  value={q.option1 || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "option1", e.target.value)}
                                  required
                                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                />
                                <input 
                                  type="text"
                                  placeholder="Option 2"
                                  value={q.option2 || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "option2", e.target.value)}
                                  required
                                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                />
                                <input 
                                  type="text"
                                  placeholder="Option 3"
                                  value={q.option3 || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "option3", e.target.value)}
                                  required
                                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                />
                                <input 
                                  type="text"
                                  placeholder="Option 4"
                                  value={q.option4 || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "option4", e.target.value)}
                                  required
                                  style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                />
                              </div>

                              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Correct Answer:</span>
                                <select
                                  value={q.correctAnswer || "Option 1"}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "correctAnswer", e.target.value)}
                                  style={{ padding: "2px 6px", border: "1px solid var(--border)", borderRadius: "4px", background: "#1e293b", color: "#fff", cursor: "pointer", fontSize: "0.75rem" }}
                                >
                                  <option value="Option 1">Option 1</option>
                                  <option value="Option 2">Option 2</option>
                                  <option value="Option 3">Option 3</option>
                                  <option value="Option 4">Option 4</option>
                                </select>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="main-btn" style={{ flex: 1 }}>Save Changes</button>
                <button 
                  type="button" 
                  className="main-btn" 
                  style={{ background: "#94a3b8", color: "#fff", flex: 1 }}
                  onClick={() => setEditingCourse(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}