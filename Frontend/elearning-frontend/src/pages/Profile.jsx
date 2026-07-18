import { useState } from "react";
import api from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || {});
  const role = user?.role?.toUpperCase() || "STUDENT";

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return "SL";
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
      };

      if (newPassword) {
        payload.password = newPassword;
      }

      const response = await api.put(`/users/${user.id}`, payload);
      const updatedUser = response.data;

      // Update local storage & component state
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccessMsg("Profile updated successfully!");

      // Clear password fields
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data || "Failed to update profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page profile-page">
      <h1>My Profile</h1>
      <p style={{ color: "var(--text-secondary)" }}>Manage your account settings, roles, and profile credentials.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px", marginTop: "30px" }}>
        
        {/* Left Side: Avatar Card */}
        <div className="profile-card" style={{ padding: "40px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div 
            style={{ 
              width: "100px", 
              height: "100px", 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: "2.2rem", 
              fontWeight: "800", 
              color: "#ffffff",
              boxShadow: "0 8px 24px var(--primary-glow)",
              marginBottom: "20px",
              border: "3px solid rgba(255,255,255,0.1)"
            }}
          >
            {getInitials(user?.name)}
          </div>
          
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: "10px 0 5px 0" }}>{user?.name || "User Name"}</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "20px" }}>{user?.email}</p>

          <span 
            className="grade-badge pass" 
            style={{ 
              fontSize: "0.8rem", 
              padding: "6px 16px", 
              letterSpacing: "0.8px",
              fontWeight: "800",
              boxShadow: role === "ADMIN" ? "0 0 15px var(--accent-glow)" : "0 0 15px var(--primary-glow)"
            }}
          >
            {role}
          </span>

          <div style={{ marginTop: "30px", borderTop: "1px solid var(--border)", paddingTop: "25px", width: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Account Status</span>
              <strong style={{ color: "var(--success)" }}>Active</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Permissions</span>
              <strong>Read & Write</strong>
            </div>
          </div>
        </div>

        {/* Right Side: Account Details Panel */}
        <form className="profile-card" style={{ padding: "40px" }} onSubmit={handleUpdateProfile}>
          <h3 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "25px", color: "#fff", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            Account Credentials & Security
          </h3>

          {successMsg && <div className="success-message" style={{ marginBottom: "20px" }}>{successMsg}</div>}
          {errorMsg && <div className="error-message" style={{ marginBottom: "20px" }}>{errorMsg}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "25px" }}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)" }}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)" }}
              />
            </div>

            <div className="form-group">
              <label>Role (Not Editable)</label>
              <input 
                type="text" 
                value={user?.role || ""} 
                disabled 
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", color: "#94a3b8", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Security Protocol</label>
              <input 
                type="text" 
                value="SHA-256 / BCrypt Encrypted" 
                disabled 
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", color: "#94a3b8", cursor: "not-allowed" }}
              />
            </div>
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "20px", color: "#fff", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
            Change Password
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
            <div className="form-group">
              <label>New Password (Optional)</label>
              <input 
                type="password" 
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)" }}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: "30px", width: "100%" }}>
            {loading ? "Updating Account Details..." : "Save Profile Details"}
          </button>
        </form>

      </div>
    </div>
  );
}