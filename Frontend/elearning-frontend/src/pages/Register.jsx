import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    const name = e.target.name.value;
    const email = e.target.email.value;
    const role = e.target.role.value;

    localStorage.setItem("user", JSON.stringify({ name, email, role }));
    alert("Registration successful");
    navigate("/dashboard");
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