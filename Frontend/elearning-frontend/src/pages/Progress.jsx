export default function Progress() {
  return (
    <div className="page">
      <h1>Learning Progress</h1>

      <div className="progress-card">
        <h2>Cloud Computing Basics</h2>
        <progress value="70" max="100"></progress>
        <p>70% completed</p>
      </div>

      <div className="progress-card">
        <h2>Web Development</h2>
        <progress value="45" max="100"></progress>
        <p>45% completed</p>
      </div>

      <div className="progress-card">
        <h2>Database Management</h2>
        <progress value="30" max="100"></progress>
        <p>30% completed</p>
      </div>
    </div>
  );
}