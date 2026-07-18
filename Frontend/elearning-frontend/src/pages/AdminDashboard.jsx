import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalInstructors: 0, totalCourses: 0 });
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'courses', 'quizzes', 'create-user'
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);

  // Quiz Form State
  const [quizQuestion, setQuizQuestion] = useState({
    courseId: "",
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctAnswer: ""
  });
  const [editingQuestion, setEditingQuestion] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, coursesRes] = await Promise.all([
        api.get("/progress/stats").catch(() => ({ data: { totalStudents: 0, totalInstructors: 0, totalCourses: 0 } })),
        api.get("/users").catch(() => ({ data: [] })),
        api.get("/courses").catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data || { totalStudents: 0, totalInstructors: 0, totalCourses: 0 });
      setUsers(usersRes.data || []);
      const loadedCourses = coursesRes.data || [];
      setCourses(loadedCourses);

      // Fetch all quiz questions for all courses
      const questionsPromises = loadedCourses.map(c =>
        api.get(`/quizzes/${c.id}`).catch(() => ({ data: [] }))
      );
      const questionsResponses = await Promise.all(questionsPromises);
      const allQuestions = questionsResponses.flatMap((res, idx) => {
        const course = loadedCourses[idx];
        return (res.data || []).map(q => ({ ...q, courseTitle: course.title }));
      });
      setQuizQuestions(allQuestions);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditAddLesson = () => {
    setEditingCourse({
      ...editingCourse,
      lessons: [...(editingCourse.lessons || []), { title: "", content: "", quizQuestions: [{ question: "", option1: "", option2: "", option3: "", option4: "", correctAnswer: "Option 1" }] }]
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
        quizQuestions: preparedLessons ? parsedQuestions : []
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
      const updatedCourse = response.data;
      alert("Course details updated successfully!");
      setEditingCourse(null);
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    } catch (err) {
      alert("Failed to update course details");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const userToDelete = users.find(u => u.id === id);
      await api.delete(`/users/${id}`);
      
      // Update state locally
      setUsers(users.filter(u => u.id !== id));
      if (userToDelete) {
        setStats(prev => ({
          ...prev,
          totalStudents: userToDelete.role?.toLowerCase() === "student" ? prev.totalStudents - 1 : prev.totalStudents,
          totalInstructors: ["lecturer", "instructor"].includes(userToDelete.role?.toLowerCase()) ? prev.totalInstructors - 1 : prev.totalInstructors
        }));
      }
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      };
      if (editingUser.password && editingUser.password.trim() !== "") {
        payload.password = editingUser.password;
      }
      const response = await api.put(`/users/${editingUser.id}`, payload);
      const updatedUser = response.data;
      alert("User updated successfully!");
      setEditingUser(null);
      
      // Update state locally
      const oldUser = users.find(u => u.id === updatedUser.id);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));

      if (oldUser && oldUser.role !== updatedUser.role) {
        setStats(prev => {
          let studentsDiff = 0;
          let instructorsDiff = 0;
          
          if (oldUser.role?.toLowerCase() === "student") studentsDiff--;
          if (["lecturer", "instructor"].includes(oldUser.role?.toLowerCase())) instructorsDiff--;
          
          if (updatedUser.role?.toLowerCase() === "student") studentsDiff++;
          if (["lecturer", "instructor"].includes(updatedUser.role?.toLowerCase())) instructorsDiff++;
          
          return {
            ...prev,
            totalStudents: prev.totalStudents + studentsDiff,
            totalInstructors: prev.totalInstructors + instructorsDiff
          };
        });
      }
    } catch (err) {
      alert(err.response?.data || "Failed to update user");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter(c => c.id !== id));
      setStats(prev => ({
        ...prev,
        totalCourses: prev.totalCourses - 1
      }));
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  const handleApproveToggle = async (id, currentApprovedStatus) => {
    try {
      await api.put(`/courses/${id}/approve?approved=${!currentApprovedStatus}`);
      alert(currentApprovedStatus ? "Course set to Draft / Moderate" : "Course approved and published!");
      setCourses(courses.map(c => c.id === id ? { ...c, approved: !currentApprovedStatus } : c));
    } catch (err) {
      alert("Failed to update approval status");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      const response = await api.post("/users", newUser);
      const createdUser = response.data;
      setFormSuccess("User created successfully!");
      setNewUser({ name: "", email: "", password: "", role: "student" });
      
      // Update state locally
      setUsers([...users, createdUser]);
      setStats(prev => ({
        ...prev,
        totalStudents: createdUser.role?.toLowerCase() === "student" ? prev.totalStudents + 1 : prev.totalStudents,
        totalInstructors: ["lecturer", "instructor"].includes(createdUser.role?.toLowerCase()) ? prev.totalInstructors + 1 : prev.totalInstructors
      }));
    } catch (err) {
      setFormError(err.response?.data || "Failed to create user");
    }
  };

  const handleAddQuizQuestion = async (e) => {
    e.preventDefault();
    if (!quizQuestion.courseId) {
      alert("Please select a course first");
      return;
    }
    try {
      const response = await api.post("/quizzes/questions", {
        ...quizQuestion,
        courseId: Number(quizQuestion.courseId)
      });
      const createdQuestion = response.data;
      alert("Quiz question added successfully!");
      
      const course = courses.find(c => c.id === Number(quizQuestion.courseId));
      setQuizQuestions([...quizQuestions, { ...createdQuestion, courseTitle: course ? course.title : "Unknown" }]);

      setQuizQuestion({
        courseId: "",
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: ""
      });
    } catch (err) {
      alert("Failed to add quiz question");
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/quizzes/questions/${editingQuestion.id}`, editingQuestion);
      const updatedQuestion = response.data;
      alert("Quiz question updated successfully!");
      setEditingQuestion(null);
      setQuizQuestions(quizQuestions.map(q => q.id === updatedQuestion.id ? { ...updatedQuestion, courseTitle: q.courseTitle } : q));
    } catch (err) {
      alert("Failed to update quiz question");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz question?")) return;
    try {
      await api.delete(`/quizzes/questions/${id}`);
      alert("Quiz question deleted successfully!");
      setQuizQuestions(quizQuestions.filter(q => q.id !== id));
    } catch (err) {
      alert("Failed to delete quiz question");
    }
  };

  return (
    <div className="page admin-dashboard-page">
      <div className="dashboard-header">
        <h1>Admin Console</h1>
        <p>Manage system users, courses, roles, and review platform activities.</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h2>{stats.totalStudents}</h2>
          <p>Total Students</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalInstructors}</h2>
          <p>Total Lecturers</p>
        </div>

        <div className="stat-card">
          <h2>{stats.totalCourses}</h2>
          <p>Total Courses</p>
        </div>
      </div>

      <div className="admin-box">
        <div className="tab-menu">
          <button 
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`} 
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </button>
          <button 
            className={`tab-btn ${activeTab === "courses" ? "active" : ""}`} 
            onClick={() => setActiveTab("courses")}
          >
            Manage Courses & Approvals
          </button>
          <button 
            className={`tab-btn ${activeTab === "quizzes" ? "active" : ""}`} 
            onClick={() => setActiveTab("quizzes")}
          >
            Manage Quiz Questions
          </button>
          <button 
            className={`tab-btn ${activeTab === "create-user" ? "active" : ""}`} 
            onClick={() => setActiveTab("create-user")}
          >
            Add New User
          </button>
        </div>

        {loading ? (
          <div className="loading-container">Loading platform data...</div>
        ) : (
          <div className="tab-content">
            {activeTab === "users" && (
              <div className="management-panel">
                <h2>System Users</h2>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>
                            <span 
                              className="grade-badge pass" 
                              style={{ 
                                textTransform: "capitalize", 
                                background: u.role?.toLowerCase() === "admin" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.05)",
                                color: u.role?.toLowerCase() === "admin" ? "var(--secondary)" : "var(--text-secondary)"
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                className="action-btn"
                                style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-light)" }}
                                onClick={() => setEditingUser({ id: u.id, name: u.name, email: u.email, role: u.role, password: "" })}
                              >
                                Edit
                              </button>
                              <button 
                                className="action-btn delete-btn" 
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "courses" && (
              <div className="management-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2>Cloud Courses & Approval Panel</h2>
                  <Link className="main-btn" to="/add-course">Add New Course</Link>
                </div>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Course Title</th>
                        <th>Instructor</th>
                        <th>Approval Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.title}</strong></td>
                          <td>{c.instructor}</td>
                          <td>
                            <span 
                              className={`grade-badge ${c.approved ? "pass" : "fail"}`}
                              style={{ display: "inline-block", fontSize: "0.85rem" }}
                            >
                              {c.approved ? "Approved & Public" : "Draft / Unapproved"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                className="action-btn"
                                style={{ 
                                  background: c.approved ? "rgba(245, 158, 11, 0.1)" : "rgba(22, 163, 74, 0.1)", 
                                  color: c.approved ? "var(--warning)" : "var(--success)",
                                  border: c.approved ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(22,163,74,0.2)"
                                }}
                                onClick={() => handleApproveToggle(c.id, c.approved)}
                              >
                                {c.approved ? "Moderate (Set Draft)" : "Approve & Publish"}
                              </button>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "quizzes" && (
              <div className="management-panel">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px", alignItems: "start" }}>
                  {/* Left Form: Add Quiz Question */}
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
                          {courses.map(c => (
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

                  {/* Right List: Quiz Questions */}
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

            {activeTab === "create-user" && (
              <div className="create-user-panel">
                <h2>Create New User</h2>
                <form className="admin-form" onSubmit={handleCreateUser}>
                  {formError && <div className="error-message">{formError}</div>}
                  {formSuccess && <div className="success-message">{formSuccess}</div>}

                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. john@skylearn.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>System Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button className="submit-btn" type="submit">Create User Account</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal Overlay */}
      {editingUser && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div className="assignment-card" style={{ width: "min(500px, 90%)", padding: "30px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>Edit User Details</h2>
            <form onSubmit={handleEditUserSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.name} 
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={editingUser.email} 
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>System Role</label>
                <select 
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>New Password (Leave blank to keep current)</label>
                <input 
                  type="password" 
                  placeholder="Enter new password" 
                  value={editingUser.password || ""} 
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} 
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="submit-btn" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff" }} onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quiz Question Modal Overlay */}
      {editingQuestion && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div className="assignment-card" style={{ width: "min(500px, 90%)", padding: "30px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#fff", marginBottom: "20px" }}>Edit Quiz Question</h2>
            <form onSubmit={handleUpdateQuestion} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group">
                <label>Quiz Question</label>
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
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="submit-btn" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "#fff" }} onClick={() => setEditingQuestion(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Outline Modal for Admin */}
      {editingCourse && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(5px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "14px", width: "min(600px, 90%)", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)", color: "#1e293b" }}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Edit Course Outline (Admin)</h2>
            <form onSubmit={handleEditCourseSubmit}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#334155" }}>Course Title</label>
                <input 
                  type="text" 
                  value={editingCourse.title || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", color: "#0f172a" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#334155" }}>Instructor Name</label>
                <input 
                  type="text" 
                  value={editingCourse.instructor || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", color: "#0f172a" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#334155" }}>Course Description</label>
                <textarea 
                  value={editingCourse.description || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows="4"
                  required
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", resize: "vertical", outline: "none", color: "#0f172a" }}
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#334155" }}>Video Lecture URL</label>
                <input 
                  type="text" 
                  value={editingCourse.video || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, video: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", color: "#0f172a" }}
                />
              </div>

              {/* Assignment Spec */}
              <div className="form-group" style={{ border: "1px solid var(--border)", padding: "15px", borderRadius: "8px", background: "rgba(0, 0, 0, 0.02)", marginTop: "15px", marginBottom: "20px" }}>
                <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1e293b", display: "block", marginBottom: "10px" }}>Course Final Assignment Specification</span>
                
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#334155" }}>Assignment Title</label>
                  <input 
                    type="text" 
                    value={editingCourse.assignmentTitle || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, assignmentTitle: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", color: "#0f172a" }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#334155" }}>Description / Guidelines</label>
                  <textarea 
                    value={editingCourse.assignmentDescription || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, assignmentDescription: e.target.value })}
                    rows="3"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", resize: "vertical", outline: "none", color: "#0f172a" }}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#334155" }}>Submission Deadline</label>
                  <input 
                    type="text" 
                    value={editingCourse.assignmentDeadline || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, assignmentDeadline: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", color: "#0f172a" }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ border: "1px solid var(--border)", padding: "15px", borderRadius: "8px", background: "rgba(0, 0, 0, 0.02)", marginTop: "15px", maxHeight: "250px", overflowY: "auto", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1e293b" }}>Course Syllabus & Lessons</span>
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
                    <div key={index} style={{ borderBottom: index < (editingCourse.lessons || []).length - 1 ? "1px solid var(--border)" : "none", paddingBottom: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: "bold", minWidth: "60px" }}>Lesson {index + 1}:</span>
                        <input 
                          type="text"
                          placeholder={`Lesson ${index + 1} Title`}
                          value={lesson.title || ""}
                          onChange={(e) => handleEditLessonFieldChange(index, "title", e.target.value)}
                          required
                          style={{ flex: 1, padding: "6px 10px", fontSize: "0.9rem", color: "#0f172a" }}
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
                          placeholder={`Provide lecture notes for Lesson ${index + 1}...`}
                          value={lesson.content || ""}
                          onChange={(e) => handleEditLessonFieldChange(index, "content", e.target.value)}
                          rows="2"
                          style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "8px", background: "transparent", color: "#0f172a", fontSize: "0.85rem", resize: "vertical", outline: "none" }}
                        />
                      </div>                      {/* Lesson Quizzes Section (Multiple Questions) */}
                      <div style={{ paddingLeft: "68px", display: "flex", flexDirection: "column", gap: "10px", background: "rgba(0,0,0,0.01)", border: "1px dashed rgba(0,0,0,0.08)", padding: "12px", borderRadius: "8px" }}>
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
                            <div key={qIdx} style={{ background: "rgba(0,0,0,0.02)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px" }}>
                              
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "bold" }}>Q{qIdx + 1}:</span>
                                <input 
                                  type="text"
                                  placeholder="Quiz Question Text"
                                  value={q.question || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "question", e.target.value)}
                                  required
                                  style={{ flex: 1, padding: "5px 8px", fontSize: "0.8rem", color: "#0f172a" }}
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
                                  style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#0f172a" }}
                                />
                                <input 
                                  type="text"
                                  placeholder="Option 2"
                                  value={q.option2 || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "option2", e.target.value)}
                                  required
                                  style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#0f172a" }}
                                />
                                <input 
                                  type="text"
                                  placeholder="Option 3"
                                  value={q.option3 || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "option3", e.target.value)}
                                  required
                                  style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#0f172a" }}
                                />
                                <input 
                                  type="text"
                                  placeholder="Option 4"
                                  value={q.option4 || ""}
                                  onChange={(e) => handleEditQuizQuestionFieldChange(index, qIdx, "option4", e.target.value)}
                                  required
                                  style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#0f172a" }}
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
                <button type="submit" className="main-btn" style={{ flex: 1, height: "46px" }}>Save Changes</button>
                <button 
                  type="button" 
                  className="main-btn" 
                  style={{ background: "#94a3b8", color: "#fff", flex: 1, height: "46px" }}
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