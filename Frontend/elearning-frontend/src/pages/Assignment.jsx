import { useState } from "react";

export default function Assignment() {
  const [fileName, setFileName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Assignment submitted successfully");
  };

  return (
    <div className="page">
      <h1>Assignment Submission</h1>

      <form className="assignment-card" onSubmit={handleSubmit}>
        <input type="text" placeholder="Assignment title" required />

        <textarea
          placeholder="Write a short description"
          rows="5"
          required
        ></textarea>

        <input
          type="file"
          onChange={(e) => setFileName(e.target.files[0]?.name)}
          required
        />

        {fileName && <p>Selected file: {fileName}</p>}

        <button type="submit">Submit Assignment</button>
      </form>
    </div>
  );
}