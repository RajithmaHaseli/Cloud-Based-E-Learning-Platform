import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const role = e.target.role.value.toLowerCase();

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/");
      } else {
        const errorMsg = await response.text();
        alert(errorMsg || "Registration failed");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      alert("Could not connect to backend server");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleRegister}>
        <h1>Create Account</h1>

        <input name="name" type="text" placeholder="Full name" required />
        <input name="email" type="email" placeholder="Email address" required />
        <input name="password" type="password" placeholder="Password" required />

        <select name="role">
          <option value="Student">Student</option>
          <option value="Lecturer">Lecturer</option>
          <option value="Admin">Admin</option>
        </select>

        <button type="submit">Register</button>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}