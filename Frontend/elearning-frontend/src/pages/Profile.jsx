export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toUpperCase() || "STUDENT";

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return "SL";
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").substring(0, 2).toUpperCase();
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
        <div className="profile-card" style={{ padding: "40px" }}>
          <h3 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "25px", color: "#fff", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
            Account Credentials & Security
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={user?.name || ""} 
                disabled 
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", color: "#94a3b8", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={user?.email || ""} 
                disabled 
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border)", color: "#94a3b8", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
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

          <div style={{ marginTop: "30px", background: "rgba(99, 102, 241, 0.04)", border: "1px dashed rgba(99, 102, 241, 0.2)", padding: "20px", borderRadius: "10px" }}>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              📌 <strong>Notice:</strong> Your credentials are secure. To modify your registered email or full name, please contact the system Administrator via console.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}