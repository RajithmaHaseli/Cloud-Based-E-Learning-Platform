import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Quiz from "./pages/Quiz";
import Assignment from "./pages/Assignment";
import LecturerDashboard from "./pages/LecturerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AddCourse from "./pages/AddCourse";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import Videos from "./pages/Videos";
import ForgotPassword from "./pages/ForgotPassword";

// Route Guard component
function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role?.toLowerCase())) {
    // Redirect to their default dashboard if role is unauthorized
    if (user.role?.toLowerCase() === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user.role?.toLowerCase() === "instructor" || user.role?.toLowerCase() === "lecturer") {
      return <Navigate to="/lecturer" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Sync user state on route change
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, [location]);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const isAuthPage = location.pathname === "/" || location.pathname === "/register";

  if (isAuthPage || !user) {
    return (
      <nav className="navbar navbar-centered">
        <h2>SkyLearn</h2>
      </nav>
    );
  }

  const role = user.role?.toLowerCase();

  return (
    <nav className="navbar">
      <h2>SkyLearn</h2>
      <div>
        {role === "student" && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/videos">Video Lectures</Link>
            <Link to="/assignment">Submit Assignment</Link>
            <Link to="/progress">My Grades</Link>
          </>
        )}
        {(role === "instructor" || role === "lecturer") && (
          <>
            <Link to="/lecturer">Lecturer Hub</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/videos">Video Lectures</Link>
            <Link to="/add-course">Add Course</Link>
          </>
        )}
        {role === "admin" && (
          <>
            <Link to="/admin">Admin Console</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/videos">Video Lectures</Link>
            <Link to="/add-course">Add Course</Link>
          </>
        )}
        <Link to="/profile">Profile</Link>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/assignment" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Assignment />
          </ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Progress />
          </ProtectedRoute>
        } />
        <Route path="/quiz/:id" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Quiz />
          </ProtectedRoute>
        } />

        {/* Shared (Student/Lecturer/Admin) Courses View */}
        <Route path="/courses" element={
          <ProtectedRoute allowedRoles={["student", "instructor", "lecturer", "admin"]}>
            <Courses />
          </ProtectedRoute>
        } />
        <Route path="/course/:id" element={
          <ProtectedRoute allowedRoles={["student", "instructor", "lecturer", "admin"]}>
            <CourseDetails />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={["student", "instructor", "lecturer", "admin"]}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/videos" element={
          <ProtectedRoute allowedRoles={["student", "instructor", "lecturer", "admin"]}>
            <Videos />
          </ProtectedRoute>
        } />

        {/* Lecturer Routes */}
        <Route path="/lecturer" element={
          <ProtectedRoute allowedRoles={["instructor", "lecturer"]}>
            <LecturerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/add-course" element={
          <ProtectedRoute allowedRoles={["instructor", "lecturer", "admin"]}>
            <AddCourse />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}