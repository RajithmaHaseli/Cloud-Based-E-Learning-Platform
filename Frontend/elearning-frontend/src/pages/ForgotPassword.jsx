import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        email: formData.email,
        password: formData.password
      });

      setMessage(response.data || "Password reset successfully!");
      
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error("Password reset failed:", err);
      const responseMessage =
        err.response?.data || "Failed to reset password. Email might not exist.";
      setError(
        typeof responseMessage === "string"
          ? responseMessage
          : "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
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

        <h1>Reset Password</h1>
        <p>Enter your email and define your new password credentials.</p>

        {message && <div className="success-message" style={{ margin: "5px 0 15px 0" }}>{message}</div>}
        {error && <div className="error-message" style={{ margin: "5px 0 15px 0" }}>{error}</div>}

        <div className="form-group">
          <label>Registered Email Address</label>
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
          <label>New Password</label>
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
          <label>Confirm New Password</label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="🔒 Retype new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            minLength={6}
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{ width: "100%", marginTop: "15px" }}>
          {loading ? "Resetting Password..." : "Reset Password"}
        </button>

        <p className="auth-footer">
          Remember your password? <Link to="/">Login here</Link>
        </p>
      </form>
    </div>
  );
}
