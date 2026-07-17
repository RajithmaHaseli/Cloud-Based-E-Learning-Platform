import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", formData);
      setMessage(response.data || "Registration successful.");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (requestError) {
      console.error("Registration failed:", requestError);

      const responseMessage =
        requestError.response?.data ||
        "Registration failed. Check whether the backend is running.";

      setError(
        typeof responseMessage === "string"
          ? responseMessage
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* Branding header */}
        <div style={{ textAlign: "center", marginBottom: "5px" }}>
          <span style={{
            fontSize: "2rem",
            fontWeight: "900",
            background: "linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px"
          }}>
            ☁ SkyLearn
          </span>
        </div>

        <h1>Create Account</h1>
        <p>Register as a student or instructor</p>

        {message && <div className="success-message" style={{ margin: "5px 0 15px 0" }}>{message}</div>}
        {error && <div className="error-message" style={{ margin: "5px 0 15px 0" }}>{error}</div>}

        <div className="form-group">
          <label>Full Name</label>
          <input
            name="name"
            type="text"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="e.g. john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="🔒 Min. 6 characters"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </div>

        <div className="form-group">
          <label>Account Role Type</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="lecturer">Lecturer</option>
          </select>
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{ width: "100%", marginTop: "15px" }}>
          {loading ? "Registering Account..." : "Create Account"}
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </form>
    </div>
  );
}