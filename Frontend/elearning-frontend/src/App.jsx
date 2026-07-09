import { Routes, Route, Link, useNavigate } from "react-router-dom";
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

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <h2>CloudLearn</h2>
      <div>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/assignment">Assignments</Link>
        <Link to="/lecturer">Lecturer</Link>
<Link to="/admin">Admin</Link>
<Link to="/profile">Profile</Link>
<Link to="/progress">Progress</Link>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/assignment" element={<Assignment />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/add-course" element={<AddCourse />} />
<Route path="/profile" element={<Profile />} />
<Route path="/progress" element={<Progress />} />
      </Routes>
    </>
  );
}