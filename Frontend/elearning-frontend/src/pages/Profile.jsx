export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="page">
      <h1>My Profile</h1>

      <div className="profile-card">
        <h2>{user?.name || "Student User"}</h2>
        <p><strong>Email:</strong> {user?.email || "student@example.com"}</p>
        <p><strong>Role:</strong> {user?.role || "Student"}</p>
        <p><strong>Status:</strong> Active</p>
      </div>
    </div>
  );
}