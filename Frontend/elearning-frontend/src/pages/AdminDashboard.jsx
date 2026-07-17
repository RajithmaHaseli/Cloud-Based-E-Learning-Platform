import { useState, useEffect } from "react";
import api from "../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents: 0, totalInstructors: 0, totalCourses: 0 });
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'courses' or 'create-user'
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, coursesRes] = await Promise.all([
        api.get("/progress/stats"),
        api.get("/users"),
        api.get("/courses")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      loadData();
    } catch (err) {
      alert("Failed to update role");
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

  const handleApproveToggle = async (id, currentApprovedStatus) => {
    try {
      await api.put(`/courses/${id}/approve?approved=${!currentApprovedStatus}`);
      alert(currentApprovedStatus ? "Course set to Draft / Moderate" : "Course approved and published!");
      loadData();
    } catch (err) {
      alert("Failed to update approval status");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    try {
      await api.post("/users", newUser);
      setFormSuccess("User created successfully!");
      setNewUser({ name: "", email: "", password: "", role: "student" });
      loadData();
    } catch (err) {
      setFormError(err.response?.data || "Failed to create user");
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
                            <select 
                              value={u.role || "student"} 
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="role-selector"
                            >
                              <option value="student">Student</option>
                              <option value="instructor">Instructor</option>
                              <option value="lecturer">Lecturer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              className="action-btn delete-btn" 
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Delete
                            </button>
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
                <h2>Cloud Courses & Approval Panel</h2>
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
                      <option value="instructor">Instructor</option>
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
    </div>
  );
}