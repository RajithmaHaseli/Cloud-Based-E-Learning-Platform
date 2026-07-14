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
      <form className="auth-card" onSubmit={handleLogin}>
        <h1>Login</h1>
        <p>Welcome back to SkyLearn</p>

        {error && <div className="error-message">{error}</div>}

        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}