export default function AdminDashboard() {
  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p>Manage users, courses, and system activities.</p>

      <div className="stats">
        <div className="stat-card">
          <h2>1200</h2>
          <p>Students</p>
        </div>

        <div className="stat-card">
          <h2>25</h2>
          <p>Lecturers</p>
        </div>

        <div className="stat-card">
          <h2>40</h2>
          <p>Courses</p>
        </div>
      </div>

      <div className="admin-box">
        <h2>System Management</h2>
        <button>Manage Students</button>
        <button>Manage Lecturers</button>
        <button>Manage Courses</button>
      </div>
    </div>
  );
}