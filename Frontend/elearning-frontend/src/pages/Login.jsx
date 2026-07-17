import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      const user = response.data;

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role?.toLowerCase() === "admin") {
        navigate("/admin");
      } else if (
        user.role?.toLowerCase() === "instructor" ||
        user.role?.toLowerCase() === "lecturer"
      ) {
        navigate("/lecturer");
      } else {
        navigate("/dashboard");
      }
    } catch (requestError) {
      console.error("Login failed:", requestError);

      const message =
        requestError.response?.data ||
        "Unable to login. Check whether the backend is running.";

      setError(
        typeof message === "string" ? message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
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

        <h1>Login Portal</h1>
        <p>Sign in to your learning dashboard</p>

        {error && <div className="error-message" style={{ margin: "5px 0 15px 0" }}>{error}</div>}

        <div className="form-group">
          <label>Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="e.g. name@domain.com"
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
            placeholder="🔒 Enter password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{ width: "100%", marginTop: "15px" }}>
          {loading ? "Verifying Credentials..." : "Sign In"}
        </button>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}