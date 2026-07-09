import { useState } from "react";

export default function AddCourse() {
  const [courseName, setCourseName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Course "${courseName}" added successfully`);
    setCourseName("");
  };

  return (
    <div className="page">
      <h1>Add New Course</h1>

      <form className="assignment-card" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Course title"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          required
        />

        <textarea
          placeholder="Course description"
          rows="5"
          required
        ></textarea>

        <input type="text" placeholder="Instructor name" required />

        <input type="file" accept="video/*" />

        <input type="file" accept=".pdf,.doc,.docx" />

        <button type="submit">Add Course</button>
      </form>
    </div>
  );
}